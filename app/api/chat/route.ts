import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant' | 'system';
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[/api/chat] OPENAI_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error: API key not configured' }, { status: 500 });
  }

  let body: RequestBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }); }

  const { messages, model, max_tokens, system, stream: doStream } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: '`messages` must be a non-empty array' }, { status: 400 });
  }

  const openaiMessages: Message[] = [
    ...(system ? [{ role: 'system' as const, content: system }] : []),
    ...messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
  ];

  // ── Streaming mode ──────────────────────────────────────────────────────────
  if (doStream) {
    let upstream: Response;
    try {
      upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model ?? 'gpt-4o', max_tokens: max_tokens ?? 3500, stream: true, messages: openaiMessages }),
      });
    } catch (err) {
      console.error('[/api/chat] Network error:', err);
      return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    // Forward SSE delta content as plain text chunks
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
              if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
              try {
                const parsed = JSON.parse(line.slice(6)) as { choices?: Array<{ delta?: { content?: string } }> };
                const chunk = parsed.choices?.[0]?.delta?.content;
                if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
              } catch { /* skip malformed SSE lines */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // ── Non-streaming mode (fallback) ────────────────────────────────────────────
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model ?? 'gpt-4o', max_tokens: max_tokens ?? 3500, messages: openaiMessages }),
    });
  } catch (err) {
    console.error('[/api/chat] Network error:', err);
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
  }

  if (!upstreamRes.ok) {
    const errData = await upstreamRes.json().catch(() => ({})) as Record<string, unknown>;
    const errMsg = typeof errData?.error === 'object' && errData.error !== null
      ? (errData.error as Record<string, unknown>).message ?? 'Upstream API error'
      : 'Upstream API error';
    return NextResponse.json({ error: String(errMsg) }, { status: upstreamRes.status });
  }

  const data = await upstreamRes.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  return NextResponse.json({ text });
}
