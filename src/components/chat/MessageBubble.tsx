'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage, Product } from '@/types';
import ProductCarousel from '@/components/ui/ProductCarousel';
import ProductDetailModal from '@/components/ui/ProductDetailModal';
import BundleCard from '@/components/ui/BundleCard';
import AgentDebate from '@/components/agents/AgentDebate';
import ShopperDNACard from '@/components/ui/ShopperDNACard';
import ProductCardSkeleton from '@/components/ui/ProductSkeleton';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  lang?: UserLanguage;
  showProductSkeleton?: boolean;
}

export default function MessageBubble({ message, isStreaming, lang = 'en', showProductSkeleton }: Props) {
  const isUser = message.role === 'user';
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const L = uiLabels(lang);

  const products = (message.products ?? [])
    .filter(p => p.source === 'kapruka' || p.image?.startsWith('http'))
    .slice(0, 12);

  const hasVisualContent = products.length > 0 || (message.bundles?.length ?? 0) > 0;

  return (
    <>
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} lang={lang} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row' }}
      >
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
          maxWidth: '92%', alignItems: isUser ? 'flex-end' : 'flex-start', width: isUser ? undefined : '100%',
        }}>
          {(message.content || isStreaming) && (
            <div
              className={isUser ? 'bubble-user' : 'bubble-agent'}
              style={{
                padding: '10px 16px', fontSize: 13, lineHeight: 1.65,
                color: isUser ? '#fff' : 'rgba(240,238,248,0.9)',
                fontFamily: lang === 'si' ? 'Inter, "Noto Sans Sinhala", sans-serif' : 'Inter, sans-serif',
                position: 'relative', maxWidth: hasVisualContent ? '100%' : undefined,
              }}
            >
              {message.content}
              {isStreaming && (
                <span style={{
                  display: 'inline-block', width: 7, height: 13,
                  background: '#A78BFA', marginLeft: 3, verticalAlign: 'middle',
                  animation: 'blink-cursor 1s step-end infinite',
                }} />
              )}
            </div>
          )}

          {showProductSkeleton && !products.length && (
            <div style={{ width: '100%' }}>
              <ProductCardSkeleton count={3} />
            </div>
          )}

          {message.shopperDNA && <ShopperDNACard dna={message.shopperDNA} />}

          {message.debate && message.debate.length > 0 && (
            <div style={{ width: '100%' }}>
              <AgentDebate debate={message.debate} />
            </div>
          )}

          {products.length > 0 && (
            <div style={{ width: '100%' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', marginBottom: 8,
              }}>{L.livePicks}</div>
              <ProductCarousel
                products={products}
                onSelectProduct={setSelectedProduct}
                lang={lang}
              />
            </div>
          )}

          {message.bundles && message.bundles.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em',
              }}>{L.chooseBundle}</div>
              {message.bundles.map((bundle, i) => (
                <BundleCard key={bundle.id} bundle={bundle} index={i} lang={lang} />
              ))}
            </div>
          )}

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
    </>
  );
}
