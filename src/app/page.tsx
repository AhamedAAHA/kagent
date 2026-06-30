'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, ArrowRight, LayoutPanelLeft, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';

import { useKAgentStore } from '@/lib/store';
import { getUpcomingFestival } from '@/lib/festivals';
import { generateId } from '@/lib/utils';
import { ChatMessage, StreamChunk, ShoppingBundle, ShopperDNA, AgentDebateMessage } from '@/types';

import AgentPanel from '@/components/agents/AgentPanel';
import AgentTerminal from '@/components/agents/AgentTerminal';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import CartSidebar from '@/components/ui/CartSidebar';
import FestivalBanner from '@/components/ui/FestivalBanner';
import BudgetRing from '@/components/ui/BudgetRing';
import ShopperDNACard from '@/components/ui/ShopperDNACard';
import SurpriseMode from '@/components/ui/SurpriseMode';

const HalideTopo = dynamic(() => import('@/components/landing/HalideTopo'), { ssr: false });

const QUICK = [
  { icon: '🏠', label: "I'M MOVING", msg: "I'm moving to a new apartment next month, budget Rs. 150,000" },
  { icon: '🎓', label: 'UNI SETUP', msg: "I'm starting university in September, need everything for my room and studies" },
  { icon: '🎊', label: 'HOSTING', msg: "I'm hosting 25 people this Saturday for a party" },
  { icon: '🚀', label: 'REDEPLOY', msg: "I'm redeploying my project this week — help me get any supplies or gear I might need" },
];

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  const {
    messages, addMessage, updateLastMessage,
    agents, updateAgent, appendAgentLog, resetAgents,
    isLoading, setLoading,
    cart, cartTotal,
    messageCount,
    shopperDNA, setShopperDNA,
    addTerminalLine, clearTerminal,
    userBudget,
  } = useKAgentStore();

  const upcomingFestival = getUpcomingFestival();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const spent = cartTotal();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (isLoading) return;
    setChatOpen(true);
    setLoading(true);
    resetAgents();
    clearTerminal();

    // Add user message
    addMessage({
      id: generateId(), role: 'user',
      content: userMessage, timestamp: new Date(),
    });

    // Add empty assistant message we'll stream into
    const assistantId = generateId();
    streamingIdRef.current = assistantId;
    addMessage({
      id: assistantId, role: 'assistant',
      content: '', timestamp: new Date(),
    });

    // Activate all agents visually
    agents.forEach(a => updateAgent(a.id, { status: 'thinking', message: 'Activating...' }));
    addTerminalLine('system', `Mission started: "${userMessage.slice(0, 60)}"`);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history,
          budget: userBudget,
          messageCount,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No stream body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accResponse = '';
      let latestBundles: ShoppingBundle[] | undefined;
      let latestProducts: unknown[] | undefined;
      let latestDebate: AgentDebateMessage[] | undefined;
      let latestDNA: ShopperDNA | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));

            if (chunk.type === 'agent_log' && chunk.agentId) {
              updateAgent(chunk.agentId, { status: 'thinking', message: chunk.text });
              appendAgentLog(chunk.agentId, chunk.text ?? '');
              addTerminalLine(chunk.agentId, chunk.text ?? '');
            }
            else if (chunk.type === 'agent_done' && chunk.agentId) {
              updateAgent(chunk.agentId, { status: 'done', message: chunk.text });
              addTerminalLine(chunk.agentId, `✓ ${chunk.text}`);
            }
            else if (chunk.type === 'response_token') {
              accResponse += chunk.text ?? '';
              updateLastMessage({ content: accResponse });
            }
            else if (chunk.type === 'bundles') {
              latestBundles = chunk.data as ShoppingBundle[];
              updateLastMessage({ bundles: latestBundles, products: latestProducts as never });
            }
            else if (chunk.type === 'products') {
              latestProducts = chunk.data as unknown[];
              updateLastMessage({ products: latestProducts as never, bundles: latestBundles });
            }
            else if (chunk.type === 'debate') {
              latestDebate = chunk.data as AgentDebateMessage[];
            }
            else if (chunk.type === 'dna') {
              latestDNA = chunk.data as ShopperDNA;
              setShopperDNA(latestDNA);
            }
            else if (chunk.type === 'done') {
              updateLastMessage({
                content: accResponse,
                bundles: latestBundles,
                products: latestProducts as never,
                debate: latestDebate,
                shopperDNA: latestDNA,
              });
              addTerminalLine('system', '✓ Mission complete.');
            }
            else if (chunk.type === 'error') {
              throw new Error(chunk.text);
            }
          } catch (parseErr) {
            // Skip malformed chunks
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateLastMessage({ content: `Sorry, something went wrong: ${msg}. Please check your EXA_API_KEY in environment settings.` });
      agents.forEach(a => updateAgent(a.id, { status: 'error' }));
      addTerminalLine('system', `✗ Error: ${msg}`);
    } finally {
      setLoading(false);
      streamingIdRef.current = null;
    }
  }, [isLoading, messages, agents, messageCount, userBudget]);

  /* ── LANDING ─────────────────────────────────────────────────────────── */
  if (!chatOpen) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Grain */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div className="grain-overlay" />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} color="#fff" />
          </div>
          <span className="font-syncopate" style={{ fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '0.12em' }}>KAGENT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {upcomingFestival && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 20, padding: '4px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(217,119,6,0.85)', letterSpacing: '0.1em' }}>
              🎊 {upcomingFestival.name.toUpperCase()} IN {upcomingFestival.daysUntil}D
            </div>
          )}
          <button onClick={() => setCartOpen(true)} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 9px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#7C3AED', color: '#fff', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Interface grid overlay */}
      <div style={{ position: 'fixed', inset: 0, padding: '100px 40px 200px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr auto', zIndex: 10, pointerEvents: 'none', gap: 0 }}>
        <div className="font-mono-custom" style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.18em', alignSelf: 'start' }}>
          KAGENT_CORE / LIFE_INTELLIGENCE / v2.0
        </div>
        <div className="font-mono-custom" style={{ fontSize: 8, color: 'rgba(217,119,6,0.5)', textAlign: 'right', alignSelf: 'start', lineHeight: 1.9 }}>
          <div>6.9271° N / 79.8612° E</div>
          <div>COLOMBO · SRI LANKA · {new Date().getFullYear()}</div>
        </div>

        <div style={{ gridColumn: '1 / -1', alignSelf: 'center', paddingTop: 28 }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-syncopate"
            style={{ fontSize: 'clamp(2.6rem,7.5vw,7.5rem)', lineHeight: 0.88, letterSpacing: '-0.03em', color: '#fff', fontWeight: 700 }}
          >
            WHAT&apos;S<br />
            <span className="text-gradient">HAPPENING</span><br />
            IN YOUR LIFE?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 20, maxWidth: 440, lineHeight: 1.6 }}
          >
            7 AI agents analyse your life situation and build a complete Sri Lankan shopping plan — instantly.
          </motion.p>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto', gap: 16 }}>
          <div className="font-mono-custom" style={{ fontSize: 9, color: 'var(--text-faint)', lineHeight: 2.2 }}>
            <div>[ 7 AGENTS · STREAMING · VOICE ENABLED ]</div>
            <div>LIFE SITUATION → COMPLETE SOLUTION → CART</div>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="cta-clip font-syncopate"
            style={{ background: 'var(--text)', color: 'var(--bg)', padding: '13px 26px', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            START MISSION <ArrowRight size={12} />
          </button>
        </div>

        {/* Shopper DNA Card - Right Side */}
        {shopperDNA && (
          <div style={{ gridColumn: '2', gridRow: '2', justifySelf: 'end', alignSelf: 'center', pointerEvents: 'auto', maxWidth: 320 }}>
            <ShopperDNACard dna={shopperDNA} />
          </div>
        )}
      </div>

      {/* 3D topo bg — right side so headline doesn't cover it */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 'clamp(16px, 4vw, 48px)',
        pointerEvents: 'none',
      }}>
        <div style={{ width: 'min(58vw, 820px)', height: 'min(70vh, 520px)', flexShrink: 0 }}>
          <HalideTopo className="w-full h-full" />
        </div>
      </div>

      {/* Bottom: quick missions + input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, rgba(4,2,12,0.98) 65%, transparent)', padding: '44px 40px 28px' }}>
        <div style={{
          display: 'flex', flexWrap: 'nowrap', gap: 8, marginBottom: 16,
          justifyContent: 'center', overflowX: 'auto', paddingBottom: 4,
          maxWidth: 720, margin: '0 auto 16px',
          WebkitOverflowScrolling: 'touch',
        }}>
          <SurpriseMode onSurprise={msg => handleSend(msg)} variant="chip" />
          {QUICK.map(q => (
            <button key={q.label} type="button" onClick={() => handleSend(q.msg)}
              className="font-mono-custom glass"
              style={{
                padding: '6px 13px', borderRadius: 6, fontSize: 8,
                color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <span style={{ fontSize: 12 }}>{q.icon}</span> {q.label}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 140, left: '50%', transform: 'translateX(-50%)', zIndex: 5, width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(124,58,237,0.5), transparent)' }} className="scroll-line" />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );

  /* ── CHAT INTERFACE ──────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" /><feColorMatrix type="saturate" values="0" /></filter>
      </svg>
      <div className="grain-overlay" />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', flexShrink: 0, zIndex: 30 }}>
        <button onClick={() => setChatOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="#fff" />
          </div>
          <span className="font-syncopate" style={{ fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '0.12em' }}>KAGENT</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Terminal toggle */}
          <button
            onClick={() => setShowTerminal(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: showTerminal ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showTerminal ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: showTerminal ? '#A78BFA' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.1em', transition: 'all 0.2s',
            }}
          >
            <LayoutPanelLeft size={12} /> TERMINAL
          </button>

          {upcomingFestival && (
            <span className="font-mono-custom festival-banner" style={{ fontSize: 8, color: 'rgba(217,119,6,0.8)', letterSpacing: '0.1em', background: 'rgba(217,119,6,0.08)', border: '1px solid', borderRadius: 4, padding: '3px 8px' }}>
              🎊 {upcomingFestival.daysUntil}D
            </span>
          )}

          <button onClick={() => setCartOpen(true)} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 8px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
            <ShoppingCart size={14} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#7C3AED', color: '#fff', fontSize: 8, fontWeight: 700, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Body: agent sidebar + chat + terminal */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left agent sidebar */}
        <aside style={{
          width: 240, borderRight: '1px solid var(--border)',
          padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
          overflowY: 'auto', flexShrink: 0,
        }} className="hide-mobile">
          <style>{`.hide-mobile { display: none; } @media(min-width:900px){.hide-mobile{display:flex !important;}}`}</style>

          <div>
            <div className="font-mono-custom" style={{ fontSize: 8, color: 'var(--text-faint)', letterSpacing: '0.18em', marginBottom: 10 }}>AGENT SWARM</div>
            <AgentPanel />
          </div>

          <BudgetRing spent={spent} budget={userBudget} />

          {upcomingFestival && (
            <FestivalBanner festival={upcomingFestival} onShop={handleSend} />
          )}

          {/* DNA pill */}
          {shopperDNA && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div className="font-mono-custom" style={{ fontSize: 7, color: 'var(--text-faint)', letterSpacing: '0.18em', marginBottom: 6 }}>YOUR DNA</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {shopperDNA.traits.slice(0,3).map((t, i) => (
                  <span key={t} style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 7,
                    color: ['#A78BFA','#34D399','#FCD34D'][i],
                    background: `${'rgba(167,139,250,0.1) rgba(52,211,153,0.1) rgba(252,211,77,0.1)'.split(' ')[i]}`,
                    border: `1px solid ${'rgba(167,139,250,0.25) rgba(52,211,153,0.25) rgba(252,211,77,0.25)'.split(' ')[i]}`,
                    borderRadius: 3, padding: '2px 6px', letterSpacing: '0.08em',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Chat column */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10, color: 'var(--text-faint)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3 }} />
                <span className="font-mono-custom" style={{ fontSize: 9, letterSpacing: '0.18em' }}>AWAITING YOUR LIFE SITUATION</span>
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>⚡</div>
                <div className="bubble-agent" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '10px 18px 18px', borderTop: '1px solid var(--border)' }}>
            <ChatInput onSend={handleSend} disabled={isLoading} showSurprise />
          </div>
        </main>

        {/* Right terminal panel */}
        <AnimatePresence>
          {showTerminal && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderLeft: '1px solid var(--border)',
                padding: 12, overflow: 'hidden', flexShrink: 0,
                display: 'flex', flexDirection: 'column',
              }}
              className="hide-mobile"
            >
              <AgentTerminal />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
