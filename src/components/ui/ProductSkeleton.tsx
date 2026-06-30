'use client';

import { motion } from 'framer-motion';
import { Product } from '@/types';

interface Props {
  count?: number;
}

export default function ProductCardSkeleton({ count = 3 }: Props) {
  return (
    <div style={{ display: 'flex', gap: 10, overflow: 'hidden', padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
          style={{
            minWidth: 160, height: 220, borderRadius: 10, flexShrink: 0,
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)',
          }}
        />
      ))}
    </div>
  );
}

export function ProductImageSkeleton({ height = 96 }: { height?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      style={{
        height, borderRadius: 7, width: '100%',
        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)',
      }}
    />
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
      fontSize: 12, color: '#FCA5A5', lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
}
