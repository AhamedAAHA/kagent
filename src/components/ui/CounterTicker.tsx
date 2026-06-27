'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function CounterTicker({ value, prefix = '', suffix = '', duration = 800, style, className }: Props) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = end;
      }
    }

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return (
    <span style={style} className={className}>
      {prefix}{display.toLocaleString('en-LK')}{suffix}
    </span>
  );
}
