import { NextRequest, NextResponse } from 'next/server';
import { runAgentOrchestration } from '@/lib/agents';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], budget } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const result = await runAgentOrchestration(message, history, budget ? Number(budget) : undefined);

    return NextResponse.json({
      response: result.response,
      activities: result.activities,
      bundles: result.bundles,
      products: result.products,
      predictiveAlerts: result.predictiveAlerts,
    });
  } catch (err: unknown) {
    console.error('[KAgent API Error]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
