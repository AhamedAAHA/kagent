'use client';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import BundleCard from '@/components/ui/BundleCard';

interface Props { message: ChatMessage; }

export default function MessageBubble({ message }: Props) {
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
        background: isUser ? 'linear-gradient(135deg,#7C3AED,#5B21B6)' : 'rgba(217,119,6,0.15)',
        border: isUser ? 'none' : '1px solid rgba(217,119,6,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13,
      }}>
        {isUser ? '👤' : '⚡'}
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: '82%', alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* Text bubble */}
        <div
          className={isUser ? 'bubble-user' : 'bubble-agent'}
          style={{
            padding: '10px 16px', fontSize: 13, lineHeight: 1.65,
            color: isUser ? '#fff' : 'rgba(240,238,248,0.88)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {message.content}
        </div>

        {/* Bundles */}
        {message.bundles && message.bundles.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', padding: '0 2px',
            }}>
              CHOOSE YOUR SETUP:
            </div>
            {message.bundles.map((bundle, i) => (
              <BundleCard key={bundle.id} bundle={bundle} index={i} />
            ))}
          </div>
        )}

        {/* Products */}
        {message.products && message.products.length > 0 && !message.bundles && (
          <div style={{ width: '100%' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
              color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: 8, padding: '0 2px',
            }}>
              PRODUCTS FOUND:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {message.products.slice(0, 6).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
          color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em', padding: '0 2px',
        }}>
          {message.timestamp.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
