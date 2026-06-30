'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDING_WORDS = ['LIFE?', 'BIRTHDAY?', 'WEDDING?', 'NEW HOME?', 'PARTY?', 'AVURUDU?'];

export default function SlidingHeadline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % SLIDING_WORDS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="font-syncopate landing-headline"
    >
      WHAT&apos;S
      <br />
      <span className="text-gradient">HAPPENING</span>
      <br />
      <span className="landing-headline-line3">
        IN YOUR{' '}
        <span className="headline-slide-viewport" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={SLIDING_WORDS[index]}
            className="text-gradient headline-slide-word"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {SLIDING_WORDS[index]}
          </motion.span>
        </AnimatePresence>
        </span>
      </span>
    </motion.h1>
  );
}
