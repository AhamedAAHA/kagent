import { NextRequest, NextResponse } from 'next/server';
import { listKaprukaCities } from '@/lib/kapruka-products';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? undefined;
  try {
    const cities = await listKaprukaCities(query);
    return NextResponse.json({ cities });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
