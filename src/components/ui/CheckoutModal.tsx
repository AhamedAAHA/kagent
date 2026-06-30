'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, Truck } from 'lucide-react';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { CheckoutSession } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckoutModal({ open, onClose }: Props) {
  const { cart, cartTotal, setCheckoutSession } = useKAgentStore();
  const total = cartTotal();

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Colombo 03');
  const [deliveryDate, setDeliveryDate] = useState(tomorrowIso());
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [cities, setCities] = useState<string[]>(['Colombo 03', 'Colombo 05', 'Kandy', 'Galle']);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const kaprukaItems = cart.filter(i => i.product.kaprukaId || i.product.source === 'kapruka');

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
    if (!open || !city) return;
    fetch('/api/kapruka/check-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, delivery_date: deliveryDate, product_id: kaprukaItems[0]?.product.kaprukaId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.available && data.rate != null) setDeliveryFee(data.rate);
        else setDeliveryFee(null);
      })
      .catch(() => setDeliveryFee(null));
  }, [open, city, deliveryDate, kaprukaItems]);

  async function handleCheckout() {
    setError('');
    setLoading(true);
    try {
      const cartPayload = kaprukaItems.map(i => ({
        product_id: i.product.kaprukaId ?? i.product.id,
        quantity: i.quantity,
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
          sender: { name: senderName },
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

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
              borderRadius: 14, zIndex: 70, padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>
                KAPRUKA CHECKOUT
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {session ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  Order <strong>{session.orderRef}</strong> created. Pay on Kapruka to complete your purchase.
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#A78BFA' }}>
                  {formatPrice(session.grandTotal)}
                </p>
                <a
                  href={session.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#7C3AED', color: '#fff', padding: '12px 16px', borderRadius: 9,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textDecoration: 'none',
                  }}
                >
                  PAY ON KAPRUKA <ExternalLink size={14} />
                </a>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  Link expires {new Date(session.expiresAt).toLocaleString('en-LK')}. Prices locked until then.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kaprukaItems.length < cart.length && (
                  <p style={{ fontSize: 10, color: '#FCD34D', background: 'rgba(252,211,77,0.08)', padding: 8, borderRadius: 6 }}>
                    {cart.length - kaprukaItems.length} local mock item(s) won&apos;t be included — only live Kapruka products checkout.
                  </p>
                )}

                <Field label="Recipient name" value={recipientName} onChange={setRecipientName} />
                <Field label="Recipient phone" value={recipientPhone} onChange={setRecipientPhone} placeholder="0771234567" />
                <Field label="Delivery address" value={address} onChange={setAddress} />
                <label style={labelStyle}>
                  City
                  <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <Field label="Delivery date" value={deliveryDate} onChange={setDeliveryDate} type="date" />
                <Field label="Your name (sender)" value={senderName} onChange={setSenderName} />
                <Field label="Gift message (optional)" value={giftMessage} onChange={setGiftMessage} />
                <Field label="Delivery instructions (optional)" value={instructions} onChange={setInstructions} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Items: {formatPrice(total)}</span>
                  {deliveryFee != null && (
                    <span style={{ fontSize: 10, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Truck size={10} /> + LKR {deliveryFee.toLocaleString()} delivery
                    </span>
                  )}
                </div>

                {error && <p style={{ fontSize: 11, color: '#F87171' }}>{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={loading || !recipientName || !recipientPhone || !address || !senderName}
                  style={{
                    width: '100%', background: loading ? 'rgba(124,58,237,0.5)' : '#7C3AED',
                    border: 'none', borderRadius: 9, color: '#fff', padding: '12px 0',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', cursor: loading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> CREATING ORDER...</> : 'CREATE KAPRUKA ORDER'}
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
  fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
  borderRadius: 7, padding: '8px 10px', color: '#fff', fontSize: 12,
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
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}
