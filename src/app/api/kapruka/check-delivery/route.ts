import { NextRequest, NextResponse } from 'next/server';
import { checkKaprukaDelivery } from '@/lib/kapruka-products';

export async function POST(req: NextRequest) {
  try {
    const { city, delivery_date, product_id } = await req.json();
    if (!city) {
      return NextResponse.json({ error: 'city is required' }, { status: 400 });
    }

    const result = await checkKaprukaDelivery(city, delivery_date, product_id);
    if (!result) {
      return NextResponse.json({ error: 'Delivery check failed' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delivery check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
