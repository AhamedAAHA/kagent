'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, MessageSquare, Terminal } from 'lucide-react';
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
import Logo, { LogoMark } from '@/components/ui/Logo';
import SlidingHeadline from '@/components/landing/SlidingHeadline';
import LanguageToggle from '@/components/ui/LanguageToggle';
import MobileAgentStrip from '@/components/agents/MobileAgentStrip';
import { QUICK_PROMPTS, uiLabels, errorMessage, quickPromptLabel } from '@/lib/ui-strings';
import { detectUserLanguage } from '@/lib/language';
import { isVoiceSupported } from '@/lib/voice';
import { KaprukaOrderTracking } from '@/types';

const HalideTopo = dynamic(() => import('@/components/landing/HalideTopo'), { ssr: false });

const QUICK = QUICK_PROMPTS;

function formatTrackReply(data: KaprukaOrderTracking, lang: ReturnType<typeof uiLabels>): string {
  const lines = [
    `**Order ${data.order_number}** — ${data.status_display ?? data.status}`,
    data.delivery_date ? `${lang.delivery}: ${data.delivery_date}` : '',
    data.recipient?.name ? `To: ${data.recipient.name}${data.recipient.city ? `, ${data.recipient.city}` : ''}` : '',
  ].filter(Boolean);
  if (data.progress?.length) {
    const last = data.progress[data.progress.length - 1];
    lines.push(`${lang.progress}: ${last.step}${last.timestamp ? ` (${last.timestamp})` : ''}`);
  }
  return lines.join('\n');
}

function HomePageInner() {
  const searchParams = useSearchParams();
  // Landing first at /. Use ?chat=1 to open the mission interface directly.
  const [chatOpen, setChatOpen] = useState(() => searchParams.get('chat') === '1');
  const [cartOpen, setCartOpen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [spotlight, setSpotlight] = useState<{ live: boolean; featuredName: string; featuredPrice: number } | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [voiceOk, setVoiceOk] = useState(false);
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
    uiLanguage, setUiLanguage,
    familyMembers, purchaseHistory, learnMemoryFromMessage,
  } = useKAgentStore();

  const detectedLang = detectUserLanguage(lastUserMessage || '');
  const lang = uiLanguage !== 'en' ? uiLanguage : (detectedLang !== 'en' ? detectedLang : uiLanguage);
  const L = uiLabels(lang);

  const upcomingFestival = getUpcomingFestival();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const spent = cartTotal();

  useEffect(() => {
    setVoiceOk(isVoiceSupported());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/kapruka/spotlight')
      .then(r => r.json())
      .then(data => { if (!cancelled) setSpotlight(data); })
      .catch(() => { if (!cancelled) setSpotlight(null); });
    return () => { cancelled = true; };
  }, []);

  // Refresh live price when returning to landing
  useEffect(() => {
    if (!chatOpen) {
      fetch('/api/kapruka/spotlight')
        .then(r => r.json())
        .then(setSpotlight)
        .catch(() => setSpotlight(null));
    }
  }, [chatOpen]);

  const activeAgents = agents.filter(a => a.status === 'thinking').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (isLoading) return;
    setLastUserMessage(userMessage);
    setChatOpen(true);

    const msgLang = detectUserLanguage(userMessage);
    if (msgLang !== 'en') setUiLanguage(msgLang);
    learnMemoryFromMessage(userMessage);

    const trackId = userMessage.match(/\b(VIMP[A-Z0-9]{4,})\b/i)?.[1]
      ?? userMessage.match(/\b([A-Z]{4}[A-Z0-9]{4,})\b/)?.[1];
    const isTrackIntent = /track|where.*order|order\s*status|ගෙටි|order number/i.test(userMessage);

    if (isTrackIntent && trackId) {
      setLoading(true);
      addMessage({ id: generateId(), role: 'user', content: userMessage, timestamp: new Date() });
      const assistantId = generateId();
      addMessage({ id: assistantId, role: 'assistant', content: L.lookingUpOrder, timestamp: new Date() });
      try {
        const res = await fetch('/api/kapruka/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_number: trackId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? L.orderNotFound);
        updateLastMessage({ content: formatTrackReply(data as KaprukaOrderTracking, L) });
      } catch (err) {
        updateLastMessage({
          content: err instanceof Error ? err.message : L.orderNotFound,
        });
      } finally {
        setLoading(false);
      }
      return;
    }

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
          familyMembers,
          purchaseHistory,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
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
      updateLastMessage({ content: errorMessage(lang, err) });
      agents.forEach(a => updateAgent(a.id, { status: 'error' }));
      addTerminalLine('system', `✗ ${errorMessage(lang, err)}`);
    } finally {
      setLoading(false);
      streamingIdRef.current = null;
    }
  }, [isLoading, messages, agents, messageCount, userBudget, familyMembers, purchaseHistory, learnMemoryFromMessage, setUiLanguage, lang, L]);

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
      <nav className="landing-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <Logo size="md" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageToggle lang={lang} onChange={setUiLanguage} />
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
      <div className="landing-grid" style={{ position: 'fixed', inset: 0, padding: '100px 40px 200px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr auto', zIndex: 10, pointerEvents: 'none', gap: 0 }}>
        <div className="landing-meta-tl font-mono-custom" style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.18em', alignSelf: 'start' }}>
          KAGENT_CORE / LIFE_INTELLIGENCE / v2.0
        </div>
        <div className="landing-meta-tr font-mono-custom" style={{ fontSize: 8, color: 'rgba(217,119,6,0.5)', textAlign: 'right', alignSelf: 'start', lineHeight: 1.9 }}>
          <div>6.9271° N / 79.8612° E</div>
          <div>COLOMBO · SRI LANKA · {new Date().getFullYear()}</div>
        </div>

        <div className="landing-headline-wrap" style={{ gridColumn: '1 / -1', gridRow: '2', alignSelf: 'center', paddingTop: 28, position: 'relative', zIndex: 12 }}>
          <SlidingHeadline />
          <motion.p
            className="landing-subtitle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 20, maxWidth: 440, lineHeight: 1.6 }}
          >
            {L.landingSubtitle}
          </motion.p>
        </div>

        <div className="landing-cta-row" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto', gap: 16 }}>
          <div className="landing-meta-bl font-mono-custom" style={{ fontSize: 9, color: 'var(--text-faint)', lineHeight: 2.2 }}>
            <div>{L.landingMeta(voiceOk)}</div>
            <div>LIFE SITUATION → COMPLETE SOLUTION → CART</div>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="cta-clip font-syncopate"
            style={{ background: 'var(--text)', color: 'var(--bg)', padding: '13px 26px', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            {L.startMission} <ArrowRight size={12} />
          </button>
        </div>

      </div>

      {/* 3D topo bg — right side so headline doesn't cover it */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 'clamp(16px, 4vw, 48px)',
        pointerEvents: 'none',
      }}>
        <div className="landing-hero-3d" style={{ width: 'min(58vw, 820px)', height: 'min(70vh, 520px)', flexShrink: 0 }}>
          <HalideTopo
            className="w-full h-full"
            mode="landing"
            cartTotal={spent}
            cartCount={cartCount}
            activeAgents={activeAgents}
            spotlight={spotlight}
          />
        </div>
      </div>

      {/* Bottom: quick missions + input */}
      <div className="landing-bottom" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(to top, rgba(4,2,12,0.98) 65%, transparent)', padding: '44px 40px 28px' }}>
        <div style={{
          display: 'flex', flexWrap: 'nowrap', gap: 8, marginBottom: 16,
          justifyContent: 'center', overflowX: 'auto', paddingBottom: 4,
          maxWidth: 720, margin: '0 auto 16px',
          WebkitOverflowScrolling: 'touch',
        }}>
          <SurpriseMode onSurprise={msg => handleSend(msg)} variant="chip" />
          {QUICK.map(q => (
            <button key={q.labelEn} type="button" onClick={() => handleSend(q.msg)}
              className="font-mono-custom glass quick-prompt-chip"
              style={{
                padding: '6px 13px', borderRadius: 6, fontSize: 8,
                color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span style={{ fontSize: 12 }}>{q.icon}</span> {quickPromptLabel(q, lang)}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <ChatInput onSend={handleSend} disabled={isLoading} lang={lang} />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 140, left: '50%', transform: 'translateX(-50%)', zIndex: 5, width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(124,58,237,0.5), transparent)' }} className="scroll-line" />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} lastUserMessage={lastUserMessage} lang={lang} />
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
          <Logo size="sm" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageToggle lang={lang} onChange={setUiLanguage} />
          <button
            onClick={() => setShowTerminal(v => !v)}
            aria-pressed={showTerminal}
            aria-label={L.terminalToggle}
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
            <Terminal size={12} /> {L.terminalToggle}
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

      <MobileAgentStrip lang={lang} />

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
            <div className="font-mono-custom" style={{ fontSize: 8, color: 'var(--text-faint)', letterSpacing: '0.18em', marginBottom: 10 }}>{L.agentSwarm}</div>
            <AgentPanel />
          </div>

          <BudgetRing spent={spent} budget={userBudget} />

          {upcomingFestival && (
            <FestivalBanner festival={upcomingFestival} onShop={handleSend} />
          )}

          {shopperDNA && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <ShopperDNACard dna={shopperDNA} compact />
            </div>
          )}
        </aside>

        {/* Chat column */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10, color: 'var(--text-faint)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3 }} />
                <span className="font-mono-custom" style={{ fontSize: 9, letterSpacing: '0.18em' }}>{L.awaiting}</span>
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'}
                lang={lang}
                showProductSkeleton={isLoading && idx === messages.length - 1 && msg.role === 'assistant' && !msg.products?.length}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  <LogoMark size={22} />
                </div>
                <div className="bubble-agent" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '10px 18px 18px', borderTop: '1px solid var(--border)' }}>
            <ChatInput onSend={handleSend} disabled={isLoading} lang={lang} />
          </div>
        </main>

        {/* Right terminal panel — desktop */}
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
              <AgentTerminal onClose={() => setShowTerminal(false)} closeLabel={L.terminalClose} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal overlay — mobile */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            className="terminal-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              display: 'none', padding: 16, paddingTop: 72,
            }}
            onClick={() => setShowTerminal(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ height: '100%', maxHeight: 'calc(100vh - 88px)' }}
            >
              <AgentTerminal onClose={() => setShowTerminal(false)} closeLabel={L.terminalClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} lastUserMessage={lastUserMessage} lang={lang} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <HomePageInner />
    </Suspense>
  );
}
