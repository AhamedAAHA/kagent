'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props { onSurprise: (msg: string) => void; variant?: 'default' | 'chip'; }

const SURPRISE_PACKS = [
  { emoji: '☕', name: 'Coffee Lover', msg: 'Surprise me with a coffee lover gift pack under Rs. 3,000' },
  { emoji: '🎮', name: 'Gaming Night', msg: 'Surprise me with a gaming night setup under Rs. 5,000' },
  { emoji: '🧘', name: 'Wellness Kit', msg: 'Surprise me with a wellness and self-care kit under Rs. 4,000' },
  { emoji: '🌙', name: 'Movie Night', msg: 'Surprise me with a movie night pack for two under Rs. 3,500' },
  { emoji: '🌺', name: 'Sri Lankan Vibes', msg: 'Surprise me with authentic Sri Lankan gift items under Rs. 5,000' },
  { emoji: '🎁', name: 'Mystery Box', msg: 'Surprise me with your best recommendation under Rs. 5,000 — total surprise!' },
];

export default function SurpriseMode({ onSurprise, variant = 'default' }: Props) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);

  function handlePick(idx: number) {
    setShaking(true);
    setTimeout(() => { setShaking(false); setRevealed(idx); }, 600);
    setTimeout(() => {
      setOpen(false);
      setRevealed(null);
      onSurprise(SURPRISE_PACKS[idx].msg);
    }, 1400);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        className={variant === 'chip' ? 'font-mono-custom glass' : undefined}
        style={
          variant === 'chip'
            ? {
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px', borderRadius: 6, fontSize: 8,
                color: '#FCD34D', letterSpacing: '0.12em', cursor: 'pointer',
                background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)',
                transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
              }
            : {
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)',
                borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                color: '#FCD34D', letterSpacing: '0.12em',
                transition: 'all 0.2s ease',
              }
        }
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = variant === 'chip' ? 'rgba(252,211,77,0.15)' : 'rgba(252,211,77,0.15)';
          if (variant === 'chip') el.style.color = '#FDE68A';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = 'rgba(252,211,77,0.08)';
          if (variant === 'chip') el.style.color = '#FCD34D';
        }}
      >
        <Sparkles size={variant === 'chip' ? 11 : 12} /> SURPRISE ME
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 60 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                zIndex: 61, width: 380, maxWidth: '92vw',
                background: 'var(--surface)', border: '1px solid rgba(252,211,77,0.2)',
                borderRadius: 18, padding: '28px 24px',
              }}
            >
              {/* Box animation */}
              <motion.div
                animate={shaking ? { rotate: [-3,3,-3,3,0], scale: [1,1.06,1] } : {}}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', marginBottom: 20 }}
              >
                <div style={{ fontSize: 52, marginBottom: 6 }}>
                  {revealed !== null ? SURPRISE_PACKS[revealed].emoji : '🎁'}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: '#FCD34D', letterSpacing: '0.18em',
                }}>
                  {revealed !== null ? SURPRISE_PACKS[revealed].name.toUpperCase() : 'PICK YOUR SURPRISE'}
                </div>
              </motion.div>

              {/* Pack options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SURPRISE_PACKS.map((pack, i) => (
                  <button
                    key={i}
                    onClick={() => handlePick(i)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: revealed === i ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${revealed === i ? 'rgba(252,211,77,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10, padding: '12px 8px', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(252,211,77,0.08)'; }}
                    onMouseLeave={e => { if (revealed !== i) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <span style={{ fontSize: 24 }}>{pack.emoji}</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                      color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textAlign: 'center',
                    }}>{pack.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
