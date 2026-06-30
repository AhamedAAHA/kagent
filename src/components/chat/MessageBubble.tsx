'use client';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import BundleCard from '@/components/ui/BundleCard';
import AgentDebate from '@/components/agents/AgentDebate';
import ShopperDNACard from '@/components/ui/ShopperDNACard';

interface Props { message: ChatMessage; isStreaming?: boolean; }

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row' }}
    >
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'linear-gradient(135deg,#7C3AED,#5B21B6)' : 'rgba(217,119,6,0.12)',
        border: isUser ? 'none' : '1px solid rgba(217,119,6,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
      }}>
        {isUser ? '👤' : '⚡'}
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: '84%', alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* Text bubble */}
        <div
          className={isUser ? 'bubble-user' : 'bubble-agent'}
          style={{
            padding: '10px 16px', fontSize: 13, lineHeight: 1.65,
            color: isUser ? '#fff' : 'rgba(240,238,248,0.9)',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
          }}
        >
          {message.content}
          {isStreaming && (
            <span style={{
              display: 'inline-block', width: 7, height: 13,
              background: '#A78BFA', marginLeft: 3,
              verticalAlign: 'middle',
              animation: 'blink-cursor 1s step-end infinite',
            }} />
          )}
        </div>

        {/* Shopper DNA */}
        {message.shopperDNA && <ShopperDNACard dna={message.shopperDNA} />}

        {/* Agent Debate */}
        {message.debate && message.debate.length > 0 && (
          <div style={{ width: '100%' }}>
            <AgentDebate debate={message.debate} />
          </div>
        )}

        {/* Kapruka product cards — shown alongside bundles */}
        {message.products && message.products.length > 0 && (
          <div style={{ width: '100%' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', marginBottom: 8,
            }}>── LIVE KAPRUKA PICKS ──</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {message.products
                .filter(p => p.image?.startsWith('http') || p.source === 'kapruka')
                .slice(0, 8)
                .map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
            </div>
          </div>
        )}

        {/* Bundles */}
        {message.bundles && message.bundles.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em',
            }}>── CHOOSE YOUR SETUP ──</div>
            {message.bundles.map((bundle, i) => (
              <BundleCard key={bundle.id} bundle={bundle} index={i} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
          color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em',
        }}>
          {message.timestamp.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}
