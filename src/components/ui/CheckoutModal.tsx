'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, Truck, AlertCircle } from 'lucide-react';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { CheckoutSession } from '@/types';
import { detectUserLanguage } from '@/lib/language';
import { checkoutLabels } from '@/lib/ui-strings';

interface Props {
  open: boolean;
  onClose: () => void;
  lastUserMessage?: string;
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface DeliveryState {
  available: boolean;
  rate?: number;
  next_available_date?: string | null;
  reason?: string | null;
}

export default function CheckoutModal({ open, onClose, lastUserMessage = '' }: Props) {
  const { cart, cartTotal, setCheckoutSession, addPurchase } = useKAgentStore();
  const total = cartTotal();
  const lang = detectUserLanguage(lastUserMessage || 'checkout');
  const L = checkoutLabels(lang);

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Colombo 03');
  const [deliveryDate, setDeliveryDate] = useState(tomorrowIso());
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [icingText, setIcingText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [cities, setCities] = useState<string[]>(['Colombo 03', 'Colombo 05', 'Kandy', 'Galle']);
  const [delivery, setDelivery] = useState<DeliveryState | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const kaprukaItems = cart.filter(i => i.product.kaprukaId || i.product.source === 'kapruka');
  const hasCake = kaprukaItems.some(i => {
    const id = (i.product.kaprukaId ?? i.product.id).toUpperCase();
    return id.startsWith('CAKE') || i.product.name.toLowerCase().includes('cake');
  });

  useEffect(() => {
    if (!open) return;
    fetch('/api/kapruka/cities?q=colombo')
      .then(r => r.json())
      .then(data => {
        if (data.cities?.length) {
          setCities(data.cities.map((c: { name: string }) => c.name));
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || !city || !deliveryDate) return;
    setCheckingDelivery(true);
    fetch('/api/kapruka/check-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        delivery_date: deliveryDate,
        product_id: kaprukaItems[0]?.product.kaprukaId,
      }),
    })
      .then(r => r.json())
      .then(data => {
        setDelivery({
          available: Boolean(data.available),
          rate: data.rate,
          next_available_date: data.next_available_date,
          reason: data.reason,
        });
      })
      .catch(() => setDelivery(null))
      .finally(() => setCheckingDelivery(false));
  }, [open, city, deliveryDate, kaprukaItems]);

  async function handleCheckout() {
    setError('');
    if (delivery && !delivery.available) {
      setError(L.deliveryUnavailable);
      return;
    }
    setLoading(true);
    try {
      const cartPayload = kaprukaItems.map(i => ({
        product_id: i.product.kaprukaId ?? i.product.id,
        quantity: i.quantity,
        ...(hasCake && icingText ? { icing_text: icingText } : {}),
      }));

      if (cartPayload.length === 0) {
        throw new Error('Add Kapruka products to cart for live checkout. Try a search like "birthday gift" or "roses".');
      }

      const res = await fetch('/api/kapruka/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cartPayload,
          recipient: { name: recipientName, phone: recipientPhone },
          delivery: { address, city, date: deliveryDate, instructions },
          sender: { name: senderName, anonymous },
          gift_message: giftMessage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');

      const checkout: CheckoutSession = {
        checkoutUrl: data.checkoutUrl,
        orderRef: data.orderRef,
        grandTotal: data.summary?.grand_total ?? total,
        currency: data.summary?.currency ?? 'LKR',
        expiresAt: data.expiresAt,
      };
      setSession(checkout);
      setCheckoutSession(checkout);
      kaprukaItems.forEach(i => addPurchase(i.product.kaprukaId ?? i.product.id, i.product.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  const deliveryOk = !delivery || delivery.available;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 60 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, x: '-50%' }}
            animate={{ opacity: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, y: 24, x: '-50%' }}
            style={{
              position: 'fixed', left: '50%', top: '50%',
              width: 'min(440px, 92vw)', maxHeight: '88vh', overflowY: 'auto',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, zIndex: 70, padding: 'clamp(16px, 4vw, 20px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>
                {L.title}
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {session ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 14px)' }}>
                <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: 'rgba(255,255,255,0.8)' }}>
                  Order <strong>{session.orderRef}</strong> created. {L.payKapruka} to complete.
                </p>
                <p style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, color: '#A78BFA' }}>{formatPrice(session.grandTotal)}</p>
                <a
                  href={session.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#7C3AED', color: '#fff', padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)', borderRadius: 9,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(10px, 2vw, 11px)', fontWeight: 700,
                    letterSpacing: '0.1em', textDecoration: 'none',
                  }}
                >
                  {L.payKapruka} <ExternalLink size={14} />
                </a>
                <p style={{ fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 'clamp(8px, 2vw, 10px)' }}>
                  After payment, use your Kapruka email order number (VIMP…) in <strong>Track Kapruka Order</strong> in the cart.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)' }}>
                <Field label={L.recipientName} value={recipientName} onChange={setRecipientName} />
                <Field label={L.recipientPhone} value={recipientPhone} onChange={setRecipientPhone} placeholder="0771234567" />
                <Field label={L.address} value={address} onChange={setAddress} />
                <label style={labelStyle}>
                  {L.city}
                  <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <Field label={L.deliveryDate} value={deliveryDate} onChange={setDeliveryDate} type="date" />
                <Field label={L.senderName} value={senderName} onChange={setSenderName} />
                <Field label={L.giftMessage} value={giftMessage} onChange={setGiftMessage} />
                {hasCake && (
                  <Field label={L.icingText} value={icingText} onChange={setIcingText} placeholder="Happy Birthday Amma!" />
                )}
                <Field label={L.instructions} value={instructions} onChange={setInstructions} />
                <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
                  <span>{L.anonymous}</span>
                </label>

                {checkingDelivery ? (
                  <p style={{ fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.35)' }}>Checking delivery…</p>
                ) : delivery && (
                  <div style={{
                    fontSize: 'clamp(9px, 2vw, 10px)', padding: 'clamp(6px, 1.5vw, 8px)', borderRadius: 6,
                    background: delivery.available ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${delivery.available ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                    color: delivery.available ? '#34D399' : '#F87171',
                    display: 'flex', alignItems: 'flex-start', gap: 6,
                  }}>
                    {delivery.available ? <Truck size={12} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span>
                      {delivery.available
                        ? `Delivery available — LKR ${delivery.rate?.toLocaleString() ?? '—'} flat rate`
                        : `${L.deliveryUnavailable}${delivery.reason ? `: ${delivery.reason}` : ''}`}
                      {!delivery.available && delivery.next_available_date && (
                        <button
                          type="button"
                          onClick={() => setDeliveryDate(delivery.next_available_date!.slice(0, 10))}
                          style={{
                            display: 'block', marginTop: 6, background: 'none', border: 'none',
                            color: '#A78BFA', cursor: 'pointer', fontSize: 'clamp(9px, 2vw, 10px)', padding: 0,
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          {L.useNextDate}: {delivery.next_available_date}
                        </button>
                      )}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.4)' }}>
                  <span>Items: {formatPrice(total)}</span>
                  {delivery?.available && delivery.rate != null && (
                    <span style={{ color: '#34D399' }}>+ LKR {delivery.rate.toLocaleString()} delivery</span>
                  )}
                </div>

                {error && <p style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: '#F87171' }}>{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={loading || !recipientName || !recipientPhone || !address || !senderName || !deliveryOk}
                  style={{
                    width: '100%', background: loading || !deliveryOk ? 'rgba(124,58,237,0.5)' : '#7C3AED',
                    border: 'none', borderRadius: 9, color: '#fff', padding: 'clamp(10px, 2.5vw, 12px) 0',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(9px, 2vw, 10px)', fontWeight: 700,
                    letterSpacing: '0.12em', cursor: loading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> …</> : L.createOrder}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
  fontSize: 'clamp(8px, 2vw, 9px)', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
  borderRadius: 7, padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 10px)', color: '#fff', fontSize: 'clamp(11px, 2.5vw, 12px)',
  fontFamily: 'Inter, sans-serif',
};

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}
