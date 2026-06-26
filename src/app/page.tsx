'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, Globe, ArrowRight, Cpu } from 'lucide-react';
import dynamic from 'next/dynamic';

import { useKAgentStore } from '@/lib/store';
import { getUpcomingFestival } from '@/lib/festivals';
import { generateId } from '@/lib/utils';
import { ChatMessage, AgentActivity } from '@/types';

import AgentPanel from '@/components/agents/AgentPanel';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import CartSidebar from '@/components/ui/CartSidebar';
import FestivalBanner from '@/components/ui/FestivalBanner';

const HeroCanvas = dynamic(() => import('@/components/landing/HeroCanvas'), { ssr: false });
const HalideTopo = dynamic(() => import('@/components/landing/HalideTopo'), { ssr: false });

const QUICK = [
  { icon: '🏠', label: "I'M MOVING",     msg: "I'm moving to a new apartment next month, budget Rs. 150,000" },
  { icon: '🎓', label: 'UNI SETUP',       msg: "I'm starting university in September, need everything for my room and studies" },
  { icon: '🎂', label: 'BIRTHDAY GIFT',   msg: "My mother's birthday is next week, help me find the perfect gift" },
  { icon: '🎊', label: 'HOSTING PARTY',   msg: "I'm hosting 25 people this Saturday for a party" },
  { icon: '🎁', label: 'SURPRISE ME',     msg: "Surprise me with something special under Rs. 5,000" },
  { icon: '🎉', label: 'FESTIVAL PREP',   msg: "Help me prepare for the upcoming Sri Lankan festival" },
];

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages, addMessage,
    agents, updateAgent, resetAgents,
    isLoading, setLoading,
    cart,
  } = useKAgentStore();

  const upcomingFestival = getUpcomingFestival();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(userMessage: string) {
    if (isLoading) return;
    setChatOpen(true);
    setLoading(true);
    resetAgents();

    addMessage({
      id: generateId(), role: 'user',
      content: userMessage, timestamp: new Date(),
    });

    agents.forEach(a => updateAgent(a.id, { status: 'thinking', message: 'Activating...' }));

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      const data = await res.json();

      if (data.activities) {
        for (const act of data.activities as AgentActivity[]) {
          updateAgent(act.agentId, { status: act.status, message: act.message });
        }
      }
      addMessage({
        id: generateId(), role: 'assistant',
        content: data.response, timestamp: new Date(),
        bundles: data.bundles, products: data.products,
        agentActivity: data.activities,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addMessage({
        id: generateId(), role: 'assistant',
        content: `Sorry, something went wrong: ${msg}. Check your ANTHROPIC_API_KEY in .env.local.`,
        timestamp: new Date(),
      });
      agents.forEach(a => updateAgent(a.id, { status: 'error' }));
    } finally {
      setLoading(false);
    }
  }

  /* ──────────────────────────────────────────────
     LANDING PAGE
  ────────────────────────────────────────────── */
  if (!chatOpen) return (
    <>
      {/* Grain filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="grain-overlay" />

      <div style={{ background: 'var(--bg)', minHeight: '100vh', overflow: 'hidden' }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 40px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={16} color="#fff" />
            </div>
            <span className="font-syncopate" style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '0.1em' }}>
              KAGENT
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {upcomingFestival && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)',
                borderRadius: 20, padding: '5px 12px',
                fontFamily: 'monospace', fontSize: 9, color: 'rgba(217,119,6,0.9)',
                letterSpacing: '0.1em',
              }}>
                🎊 {upcomingFestival.name.toUpperCase()} IN {upcomingFestival.daysUntil}D
              </div>
            )}
            <button
              onClick={() => setCartOpen(true)}
              style={{
                position: 'relative', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: '8px 10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#7C3AED', color: '#fff', fontSize: 10, fontWeight: 700,
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount}</span>
              )}
            </button>
          </div>
        </nav>

        {/* ── INTERFACE GRID OVERLAY (Halide style) ── */}
        <div style={{
          position: 'fixed', inset: 0, padding: '100px 40px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto 1fr auto',
          zIndex: 10, pointerEvents: 'none',
          gap: 0,
        }}>
          {/* Top-left system label */}
          <div className="font-mono-custom" style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.18em', alignSelf: 'start' }}>
            KAGENT_CORE / LIFE_INTELLIGENCE
          </div>

          {/* Top-right coordinates */}
          <div className="font-mono-custom" style={{ fontSize: 9, color: 'rgba(217,119,6,0.55)', textAlign: 'right', alignSelf: 'start', lineHeight: 1.8 }}>
            <div>6.9271° N / 79.8612° E</div>
            <div>COLOMBO · SRI LANKA · {new Date().getFullYear()}</div>
          </div>

          {/* Big title — col span 2 */}
          <div style={{ gridColumn: '1 / -1', alignSelf: 'center', paddingTop: 40 }}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-syncopate"
              style={{
                fontSize: 'clamp(2.8rem, 8vw, 8rem)',
                lineHeight: 0.88,
                letterSpacing: '-0.03em',
                mixBlendMode: 'difference',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              WHAT&apos;S<br />
              <span className="text-gradient">HAPPENING</span><br />
              IN YOUR LIFE?
            </motion.h1>
          </div>

          {/* Bottom row */}
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            pointerEvents: 'auto',
            gap: 20,
          }}>
            <div className="font-mono-custom" style={{ fontSize: 10, color: 'var(--text-faint)', lineHeight: 2 }}>
              <div>[ 7 AGENTS · REAL-TIME · SRI LANKA ]</div>
              <div>LIFE SITUATION → COMPLETE SOLUTION → CART</div>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="cta-clip font-syncopate"
              style={{
                background: 'var(--text)', color: 'var(--bg)',
                padding: '14px 28px', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.12em', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              START MISSION <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ── 3D TOPO CANVAS (background) ── */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HalideTopo className="w-full h-full" />
        </div>

        {/* ── BOTTOM SECTION: Quick missions + input ── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          background: 'linear-gradient(to top, rgba(4,2,12,0.98) 60%, transparent)',
          padding: '40px 40px 32px',
        }}>
          {/* Quick mission buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
            {QUICK.map(q => (
              <button
                key={q.label}
                onClick={() => handleSend(q.msg)}
                className="font-mono-custom glass"
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 9,
                  color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <span>{q.icon}</span> {q.label}
              </button>
            ))}
          </div>

          {/* Main input */}
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </div>

        {/* Scroll hint line */}
        <div style={{
          position: 'fixed', bottom: 160, left: '50%', transform: 'translateX(-50%)',
          zIndex: 5, width: 1, height: 50,
          background: 'linear-gradient(to bottom, rgba(124,58,237,0.6), transparent)',
        }} className="scroll-line" />
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );

  /* ──────────────────────────────────────────────
     CHAT INTERFACE
  ────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* SVG grain */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="grain-overlay" />

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0, zIndex: 30,
      }}>
        <button
          onClick={() => setChatOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color="#fff" />
          </div>
          <span className="font-syncopate" style={{ fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: '0.1em' }}>KAGENT</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {upcomingFestival && (
            <span className="font-mono-custom festival-banner" style={{
              fontSize: 9, color: 'rgba(217,119,6,0.8)', letterSpacing: '0.1em',
              background: 'rgba(217,119,6,0.08)', border: '1px solid',
              borderRadius: 4, padding: '4px 10px',
            }}>
              🎊 {upcomingFestival.name.toUpperCase()} IN {upcomingFestival.daysUntil}D
            </span>
          )}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              position: 'relative', background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '7px 9px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: '#7C3AED', color: '#fff', fontSize: 9, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Agent sidebar */}
        <aside style={{
          width: 260, borderRight: '1px solid var(--border)',
          padding: 16, display: 'none', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }} className="lg-sidebar">
          <style>{`.lg-sidebar { display: none; } @media(min-width:1024px){.lg-sidebar{display:flex !important;}}`}</style>

          <div>
            <div className="font-mono-custom" style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.18em', marginBottom: 12 }}>
              AGENT SWARM
            </div>
            <AgentPanel />
          </div>

          {upcomingFestival && (
            <FestivalBanner festival={upcomingFestival} onShop={handleSend} />
          )}

          {/* System info */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="font-mono-custom" style={{ fontSize: 8, color: 'var(--text-faint)', lineHeight: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Cpu size={9} style={{ color: '#34D399' }} />
                <span style={{ color: '#34D399' }}>claude-sonnet-4-6</span>
              </div>
              <div>BAND OF AGENTS API</div>
              <div>50+ SRI LANKAN PRODUCTS</div>
              <div>LIVE FESTIVAL INTEL</div>
            </div>
          </div>
        </aside>

        {/* Chat */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-faint)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                  <p className="font-mono-custom" style={{ fontSize: 10, letterSpacing: '0.15em' }}>TELL KAGENT WHAT&apos;S HAPPENING</p>
                </div>
              </div>
            )}
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>🤖</div>
                <div className="bubble-agent" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)' }}>
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </main>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
