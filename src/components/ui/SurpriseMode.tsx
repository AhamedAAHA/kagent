'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function handlePick(idx: number) {
    setShaking(true);
    setTimeout(() => { setShaking(false); setRevealed(idx); }, 600);
    setTimeout(() => {
      setOpen(false);
      setRevealed(null);
      onSurprise(SURPRISE_PACKS[idx].msg);
    }, 1400);
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="surprise-modal-backdrop"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.88, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="surprise-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Pick your surprise"
          >
            <motion.div
              animate={shaking ? { rotate: [-3, 3, -3, 3, 0], scale: [1, 1.06, 1] } : {}}
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

            <div className="surprise-modal-grid">
              {SURPRISE_PACKS.map((pack, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePick(i)}
                  className="surprise-pack-btn"
                  data-selected={revealed === i ? 'true' : undefined}
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
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        className={variant === 'chip' ? 'font-mono-custom glass surprise-me-chip' : 'surprise-me-btn'}
      >
        <Sparkles size={variant === 'chip' ? 11 : 12} /> SURPRISE ME
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
