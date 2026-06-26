'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Package } from 'lucide-react';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

interface Props { open: boolean; onClose: () => void; }

const CAT_EMOJI: Record<string, string> = {
  food: '🍛', electronics: '📱', household: '🏠', clothing: '👔',
  gifts: '🎁', stationery: '📚', beauty: '✨', groceries: '🛒',
  flowers: '🌸', festival: '🎉',
};

export default function CartSidebar({ open, onClose }: Props) {
  const { cart, removeFromCart, clearCart, cartTotal } = useKAgentStore();
  const total = cartTotal();

  return (
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
              position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
              background: 'var(--surface)', borderLeft: '1px solid var(--border)',
              zIndex: 50, display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={15} style={{ color: '#A78BFA' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>
                  CART
                </span>
                {cart.length > 0 && (
                  <span style={{
                    background: '#7C3AED', color: '#fff', fontSize: 9, fontWeight: 700,
                    width: 17, height: 17, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{cart.length}</span>
                )}
              </div>
              <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.2)' }}>
                  <Package size={36} />
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', textAlign: 'center' }}>
                    CART IS EMPTY<br />TELL KAGENT WHAT YOU NEED
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
                        borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 7,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                      }}>
                        {CAT_EMOJI[item.product.category] ?? '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product.name}
                        </p>
                        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {item.product.vendor}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#A78BFA', marginTop: 3 }}>
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
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>TOTAL</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>{formatPrice(total)}</span>
                </div>
                <button style={{
                  width: '100%', background: '#7C3AED', border: 'none', borderRadius: 9,
                  color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.12em', padding: '12px 0', cursor: 'pointer',
                }}>
                  PROCEED TO CHECKOUT
                </button>
                <button onClick={clearCart} style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.1em',
                }}>
                  <Trash2 size={10} /> CLEAR CART
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
