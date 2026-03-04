import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-5';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  model?: string;
  max_tokens?: number;
  system?: string;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[/api/chat] ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error: API key not configured' }, { status: 500 });
  }

  let body: RequestBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

  const { messages, model, max_tokens, system, stream: doStream } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: '`messages` must be a non-empty array' }, { status: 400 });
  }

  const filteredMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  if (filteredMessages.length === 0) {
    return NextResponse.json({ error: 'At least one user message is required' }, { status: 400 });
  }

  const anthropicBody = {
    model: model ?? DEFAULT_MODEL,
    max_tokens: max_tokens ?? 3500,
    ...(system ? { system } : {}),
    messages: filteredMessages,
    ...(doStream ? { stream: true } : {}),
  };

  // ── Streaming mode ──────────────────────────────────────────────────────────
  if (doStream) {
    let upstream: Response;
    try {
      upstream = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(anthropicBody),
      });
    } catch (err) {
      console.error('[/api/chat] Network error:', err);
      return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
    }

    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({})) as Record<string, unknown>;
      console.error('[/api/chat] Anthropic error:', upstream.status, errData);
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    // Forward Anthropic SSE content_block_delta as plain text chunks
    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const dec = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = dec.decode(value, { stream: true });
            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data) as {
                  type?: string;
                  delta?: { type?: string; text?: string };
                };
                if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                  const chunk = parsed.delta.text;
                  if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
                }
              } catch { /* skip malformed lines */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── Non-streaming mode ───────────────────────────────────────────────────────
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(anthropicBody),
    });
  } catch (err) {
    console.error('[/api/chat] Network error:', err);
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    const errData = await upstreamRes.json().catch(() => ({})) as Record<string, unknown>;
    const errMsg = (errData?.error as Record<string, unknown>)?.message ?? 'Upstream API error';
    console.error('[/api/chat] Anthropic error:', upstreamRes.status, errMsg);
    return NextResponse.json({ error: String(errMsg) }, { status: upstreamRes.status });
  }

  const data = await upstreamRes.json() as { content?: Array<{ text?: string }> };
  const text = (data.content ?? []).map((b) => b.text ?? '').join('').trim();
  return NextResponse.json({ text });
}
