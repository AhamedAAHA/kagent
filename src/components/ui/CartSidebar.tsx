'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Package } from 'lucide-react';
import Image from 'next/image';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import CheckoutModal from './CheckoutModal';
import TrackOrderPanel from './TrackOrderPanel';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props {
  open: boolean;
  onClose: () => void;
  lastUserMessage?: string;
  lang?: UserLanguage;
}

const CAT_EMOJI: Record<string, string> = {
  food: '🍛', electronics: '📱', household: '🏠', clothing: '👔',
  gifts: '🎁', stationery: '📚', beauty: '✨', groceries: '🛒',
  flowers: '🌸', festival: '🎉',
};

export default function CartSidebar({ open, onClose, lastUserMessage = '', lang = 'en' }: Props) {
  const { cart, removeFromCart, clearCart, cartTotal } = useKAgentStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const total = cartTotal();
  const L = uiLabels(lang);

  return (
    <>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} lastUserMessage={lastUserMessage} />
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 40 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0,
                width: 'clamp(240px, 100vw, 320px)',
                background: 'var(--surface)', borderLeft: '1px solid var(--border)',
                zIndex: 50, display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'clamp(12px, 3vw, 16px) clamp(14px, 4vw, 18px)', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
                  <ShoppingCart size={15} style={{ color: '#A78BFA' }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>
                    {L.cart}
                  </span>
                  {cart.length > 0 && (
                    <span style={{
                      background: '#7C3AED', color: '#fff', fontSize: 'clamp(8px, 1.5vw, 9px)', fontWeight: 700,
                      width: 17, height: 17, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{cart.length}</span>
                  )}
                </div>
                <button onClick={onClose} aria-label="Close cart" style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(10px, 3vw, 14px)', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 8px)' }}>
                {cart.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(8px, 3vw, 10px)', color: 'rgba(255,255,255,0.2)' }}>
                    <Package size={36} />
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)', letterSpacing: '0.15em', textAlign: 'center', whiteSpace: 'pre-line' }}>
                      {L.cartEmpty}<br />{L.cartEmptyHint}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                        style={{
                          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                          borderRadius: 9, padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 10px)',
                        }}
                      >
                        <div style={{
                          width: 'clamp(40px, 12vw, 48px)', height: 'clamp(40px, 12vw, 48px)', borderRadius: 7, overflow: 'hidden', flexShrink: 0,
                          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(14px, 4vw, 16px)',
                          position: 'relative',
                        }}>
                          {item.product.image?.startsWith('http') ? (
                            <Image src={item.product.image} alt={item.product.name} fill unoptimized style={{ objectFit: 'cover' }} />
                          ) : (
                            CAT_EMOJI[item.product.category] ?? '📦'
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product.name}
                          </p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {item.product.vendor}
                            {item.product.source === 'kapruka' && ` · ${L.kaprukaLive}`}
                          </p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 700, color: '#A78BFA', marginTop: 3 }}>
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)}
                          style={{ color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          <X size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                <TrackOrderPanel compact lang={lang} />
              </div>

              {cart.length > 0 && (
                <div style={{ padding: 'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 16px)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 3vw, 10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(8px, 2vw, 9px)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>{L.total}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, color: '#fff' }}>{formatPrice(total)}</span>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    style={{
                      width: '100%', background: '#7C3AED', border: 'none', borderRadius: 9,
                      color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(9px, 2vw, 10px)',
                      fontWeight: 700, letterSpacing: '0.12em', padding: 'clamp(10px, 2.5vw, 12px) 0', cursor: 'pointer',
                    }}
                  >
                    {L.checkout}
                  </button>
                  <button onClick={clearCart} style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 1.5vw, 8px)', letterSpacing: '0.1em',
                  }}>
                    <Trash2 size={10} /> {L.clearCart}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
