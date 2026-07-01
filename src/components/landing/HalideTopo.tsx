'use client';
import { useEffect, useRef } from 'react';
import { formatPrice } from '@/lib/utils';
import { LogoMark } from '@/components/ui/Logo';

interface Spotlight {
  live: boolean;
  featuredName: string;
  featuredPrice: number;
}

interface Props {
  className?: string;
  cartTotal?: number;
  cartCount?: number;
  activeAgents?: number;
  spotlight?: Spotlight | null;
  /** Landing always shows live Kapruka spotlight; cart shown as secondary line */
  mode?: 'landing' | 'default';
}

export default function HalideTopo({
  className = '',
  cartTotal = 0,
  cartCount = 0,
  activeAgents = 0,
  spotlight = null,
  mode = 'default',
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);

  const isLanding = mode === 'landing';
  const waitingSpotlight = spotlight === null;
  const livePrice = spotlight?.featuredPrice ?? 0;

  const displayTotal = isLanding
    ? livePrice
    : cartTotal > 0
      ? cartTotal
      : livePrice;

  const displayLabel = isLanding
    ? (spotlight?.live ? 'KAPRUKA LIVE' : waitingSpotlight ? 'KAPRUKA LIVE' : 'OPTIMISED CART')
    : cartTotal > 0
      ? 'YOUR CART'
      : spotlight?.live
        ? 'KAPRUKA LIVE'
        : waitingSpotlight
          ? 'KAPRUKA LIVE'
          : 'OPTIMISED CART';

  const subLabel = isLanding
    ? spotlight?.live
      ? spotlight.featuredName.slice(0, 28) + (spotlight.featuredName.length > 28 ? '…' : '')
      : waitingSpotlight
        ? 'FETCHING LIVE CATALOG…'
        : 'CONNECTING TO MCP…'
    : cartCount > 0
      ? `${cartCount} ITEM${cartCount > 1 ? 'S' : ''} IN CART`
      : spotlight?.live
        ? spotlight.featuredName.slice(0, 28) + (spotlight.featuredName.length > 28 ? '…' : '')
        : waitingSpotlight
          ? 'FETCHING LIVE CATALOG…'
          : 'CONNECTING TO MCP…';

  const cartHint = isLanding && cartCount > 0
    ? `${cartCount} item${cartCount > 1 ? 's' : ''} · ${formatPrice(cartTotal)} in cart`
    : null;

  const showLoading = waitingSpotlight && (isLanding || cartTotal === 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Disable interactive effects on mobile for performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 30;
      const y = (window.innerHeight / 2 - e.pageY) / 30;
      canvas.style.transform = `rotateX(${55 + y / 2}deg) rotateZ(${-25 + x / 2}deg)`;
      layersRef.current.forEach((layer, index) => {
        if (!layer) return;
        const depth = (index + 1) * 20;
        const moveX = x * (index + 1) * 0.25;
        const moveY = y * (index + 1) * 0.25;
        layer.style.transform = `translateZ(${depth}px) translate(${moveX}px, ${moveY}px)`;
      });
    };

    canvas.style.opacity = '0';
    canvas.style.transform = 'rotateX(90deg) rotateZ(0deg) scale(0.8)';
    const timeout = setTimeout(() => {
      canvas.style.transition = 'all 2.8s cubic-bezier(0.16, 1, 0.3, 1)';
      canvas.style.opacity = '1';
      canvas.style.transform = 'rotateX(55deg) rotateZ(-25deg) scale(1)';
    }, 400);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className={`perspective-2000 flex items-center justify-center ${className}`}>
      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '820px',
          maxHeight: '520px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          ref={el => { layersRef.current[0] = el; }}
          style={{
            position: 'absolute', inset: 0,
            border: '1px solid rgba(124,58,237,0.15)',
            background: `
              radial-gradient(ellipse 80% 60% at 45% 55%, rgba(124,58,237,0.18) 0%, transparent 70%),
              radial-gradient(ellipse 50% 40% at 60% 40%, rgba(217,119,6,0.10) 0%, transparent 60%),
              repeating-radial-gradient(ellipse at 45% 55%, transparent 0, transparent 28px, rgba(124,58,237,0.06) 29px, transparent 30px),
              #0A0614
            `,
            transition: 'transform 0.5s ease',
          }}
        />
        <div
          ref={el => { layersRef.current[1] = el; }}
          style={{
            position: 'absolute', inset: 0,
            background: `
              radial-gradient(ellipse 60% 50% at 50% 50%, rgba(217,119,6,0.12) 0%, transparent 65%),
              repeating-radial-gradient(ellipse at 55% 45%, transparent 0, transparent 18px, rgba(217,119,6,0.04) 19px, transparent 20px)
            `,
            mixBlendMode: 'screen',
            opacity: 0.8,
            transition: 'transform 0.5s ease',
          }}
        />
        <div
          ref={el => { layersRef.current[2] = el; }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            mixBlendMode: 'overlay',
            opacity: 0.6,
            transition: 'transform 0.5s ease',
          }}
        />
        <div
          ref={el => { layersRef.current[3] = el; }}
          style={{
            position: 'absolute', inset: '-10%',
            backgroundImage: `
              repeating-radial-gradient(ellipse at 48% 52%, transparent 0, transparent 45px, rgba(167,139,250,0.07) 46px, transparent 47px),
              repeating-radial-gradient(ellipse at 52% 48%, transparent 0, transparent 65px, rgba(251,191,36,0.05) 66px, transparent 67px)
            `,
            transform: 'translateZ(60px)',
            transition: 'transform 0.5s ease',
          }}
        />

        <div style={{
          position: 'absolute', top: '18px', left: '22px', zIndex: 10, transform: 'translateZ(80px)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <LogoMark size={28} />
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>KAGENT_AI</span>
        </div>

        <div style={{
          position: 'absolute', top: '18px', right: '22px', zIndex: 10, transform: 'translateZ(80px)',
          fontFamily: 'monospace', fontSize: 9, color: 'rgba(217,119,6,0.7)', textAlign: 'right', lineHeight: 1.6,
        }}>
          <div>{spotlight?.live ? '● MCP LIVE' : '○ MCP'}</div>
          <div>COLOMBO · SRI LANKA</div>
        </div>

        {[
          { label: 'CONCIERGE', color: '#A78BFA', x: '12%', y: '30%' },
          { label: 'SHOPPING', color: '#34D399', x: '72%', y: '22%' },
          { label: 'FESTIVAL', color: '#FCD34D', x: '85%', y: '58%' },
          { label: 'BUDGET', color: '#FB923C', x: '20%', y: '72%' },
          { label: 'DELIVERY', color: '#22D3EE', x: '55%', y: '78%' },
        ].map((dot, i) => (
          <div key={dot.label} style={{
            position: 'absolute', left: dot.x, top: dot.y, zIndex: 10, transform: 'translateZ(100px)',
            display: 'flex', alignItems: 'center', gap: 5,
            animation: `agentPulse ${1.5 + i * 0.3}s ease-in-out infinite`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: dot.color,
              boxShadow: `0 0 8px ${dot.color}`,
            }} />
            <span style={{
              fontFamily: 'monospace', fontSize: 8, fontWeight: 700,
              color: dot.color, letterSpacing: '0.12em', opacity: 0.8,
            }}>{dot.label}</span>
          </div>
        ))}

        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%) translateZ(110px)',
          zIndex: 10, textAlign: 'center', maxWidth: '80%',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(167,139,250,0.5)', letterSpacing: '0.2em', marginBottom: 4 }}>
            {displayLabel}
          </div>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {showLoading ? (
              <span style={{ opacity: 0.45, fontSize: 22, letterSpacing: '0.08em' }}>···</span>
            ) : (
              formatPrice(displayTotal)
            )}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 8, color: 'rgba(217,119,6,0.6)', marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {subLabel}
          </div>
          {cartHint && (
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(52,211,153,0.75)', marginTop: 5 }}>
              {cartHint}
            </div>
          )}
          {activeAgents > 0 && (
            <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(52,211,153,0.7)', marginTop: 6 }}>
              {activeAgents} AGENTS ACTIVE
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute', bottom: '16px', left: '22px', right: '22px',
          zIndex: 10, transform: 'translateZ(80px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>[ KAPRUKA MCP · LIVE CATALOG ]</span>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: spotlight?.live ? 'rgba(52,211,153,0.7)' : 'rgba(217,119,6,0.5)', letterSpacing: '0.1em' }}>
            {spotlight?.live ? 'CONNECTED' : 'SYNCING'}
          </span>
        </div>
      </div>
    </div>
  );
}
