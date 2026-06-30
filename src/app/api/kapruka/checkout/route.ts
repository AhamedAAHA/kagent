import { NextRequest, NextResponse } from 'next/server';
import { createKaprukaOrder } from '@/lib/kapruka-products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cart, recipient, delivery, sender, gift_message } = body;

    if (!cart?.length || !recipient?.name || !recipient?.phone || !delivery?.address || !delivery?.city || !delivery?.date || !sender?.name) {
      return NextResponse.json({ error: 'Missing required checkout fields' }, { status: 400 });
    }

    const kaprukaCart = cart.map((item: { product_id: string; quantity: number; icing_text?: string }) => ({
      product_id: item.product_id,
      quantity: item.quantity ?? 1,
      ...(item.icing_text ? { icing_text: item.icing_text } : {}),
    }));

    const result = await createKaprukaOrder({
      cart: kaprukaCart,
      recipient: { name: recipient.name, phone: recipient.phone },
      delivery: {
        address: delivery.address,
        city: delivery.city,
        location_type: delivery.location_type ?? 'house',
        date: delivery.date,
        instructions: delivery.instructions,
      },
      sender: { name: sender.name, anonymous: sender.anonymous ?? false },
      gift_message,
      currency: 'LKR',
    });

    return NextResponse.json({
      checkoutUrl: result.checkout_url,
      orderRef: result.order_ref,
      summary: result.summary,
      expiresAt: result.expires_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
