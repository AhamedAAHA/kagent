import { NextRequest } from 'next/server';
import { runAgentStream } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.EXA_API_KEY && !process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'EXA_API_KEY or OPENAI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const body = await req.json();
    const { message, history = [], budget, messageCount = 1 } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    // Server-Sent Events stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runAgentStream(
            message, history, budget ? Number(budget) : undefined, messageCount
          )) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (err) {
          const errChunk = { type: 'error', text: err instanceof Error ? err.message : 'Unknown error' };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500 }
    );
  }
}
