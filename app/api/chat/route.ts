import { NextRequest, NextResponse } from 'next/server';

// This route proxies requests to the Anthropic Messages API.
// The API key is read exclusively from server-side environment variables
// and is never exposed to the client.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  model?: string;
  max_tokens?: number;
  system?: string;
}

export async function POST(req: NextRequest) {
  // Read the API key only on the server — never pass this to the client
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('[/api/chat] ANTHROPIC_API_KEY is not set');
    return NextResponse.json(
      { error: 'Server configuration error: API key not configured' },
      { status: 500 }
    );
  }

  // Parse the incoming request body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { messages, model, max_tokens, system } = body;

  // Basic input validation
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: '`messages` must be a non-empty array' },
      { status: 400 }
    );
  }

  // Filter only user/assistant roles for the messages array.
  // Anthropic's API uses `system` as a top-level parameter, not inside messages.
  const filteredMessages = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant'
  );

  if (filteredMessages.length === 0) {
    return NextResponse.json(
      { error: 'At least one user or assistant message is required' },
      { status: 400 }
    );
  }

  // Call the Anthropic Messages API server-side
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: model ?? 'claude-sonnet-4-20250514',
        max_tokens: max_tokens ?? 2000,
        ...(system ? { system } : {}),
        messages: filteredMessages,
      }),
    });
  } catch (err) {
    console.error('[/api/chat] Network error calling Anthropic:', err);
    return NextResponse.json(
      { error: 'Failed to reach AI service' },
      { status: 502 }
    );
  }

  if (!upstreamRes.ok) {
    const errData = await upstreamRes.json().catch(() => ({})) as Record<string, unknown>;
    const errMsg =
      typeof errData?.error === 'object' && errData.error !== null
        ? (errData.error as Record<string, unknown>).message ?? 'Upstream API error'
        : 'Upstream API error';
    console.error('[/api/chat] Anthropic error:', upstreamRes.status, errMsg);
    return NextResponse.json(
      { error: String(errMsg) },
      { status: upstreamRes.status }
    );
  }

  const data = await upstreamRes.json() as { content?: Array<{ text?: string }> };

  // Extract only the text content — do not transparently proxy the full response
  const text = (data.content ?? [])
    .map((block) => block.text ?? '')
    .join('');

  return NextResponse.json({ text });
}
