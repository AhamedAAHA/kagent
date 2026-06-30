import { NextRequest, NextResponse } from 'next/server';
import { callKaprukaTool } from '@/lib/kapruka';

export async function POST(req: NextRequest) {
  try {
    const { order_number } = await req.json();
    if (!order_number) {
      return NextResponse.json({ error: 'order_number is required' }, { status: 400 });
    }

    const result = await callKaprukaTool<Record<string, unknown>>('kapruka_track_order', {
      order_number,
      response_format: 'json',
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tracking failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
