'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ShoppingCart, ExternalLink, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { useKAgentStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';
import { ProductImageSkeleton } from './ProductSkeleton';

interface Props {
  product: Product | null;
  onClose: () => void;
  lang?: UserLanguage;
}

export default function ProductDetailModal({ product, onClose, lang = 'en' }: Props) {
  const addToCart = useKAgentStore(s => s.addToCart);
  const [detail, setDetail] = useState<Product | null>(product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const L = uiLabels(lang);

  useEffect(() => {
    setDetail(product);
    setError('');
    if (!product?.kaprukaId) return;

    setLoading(true);
    fetch(`/api/kapruka/product?id=${encodeURIComponent(product.kaprukaId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.product) setDetail(data.product);
        else if (data.error) setError(data.error);
      })
      .catch(() => setError(L.productLoadError))
      .finally(() => setLoading(false));
  }, [product]);

  const p = detail;
  const imageUrl = p?.image?.startsWith('http') ? p.image : '';

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 80 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
            style={{
              position: 'fixed', left: '50%', top: '50%', zIndex: 90,
              width: 'clamp(280px, 92vw, 400px)', maxHeight: 'clamp(70vh, 90vh, 92vh)', overflowY: 'auto',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            }}
          >
            <div style={{ position: 'relative', height: 'clamp(160px, 40vw, 220px)', background: 'rgba(124,58,237,0.08)' }}>
              {loading && !imageUrl ? (
                <ProductImageSkeleton height={220} />
              ) : imageUrl ? (
                <Image src={imageUrl} alt={p.name} fill unoptimized style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎁</div>
              )}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)',
                  border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}
              >
                <X size={14} />
              </button>
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Loader2 size={24} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
            <div style={{ padding: 'clamp(12px, 3vw, 16px)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 2vw, 8px)', color: '#A78BFA',
                letterSpacing: '0.12em',
              }}>{L.kaprukaLive}</span>
              <h3 style={{ fontSize: 'clamp(13px, 4vw, 15px)', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{p.name}</h3>
              <p style={{ fontSize: 'clamp(16px, 5vw, 20px)', fontWeight: 800, color: '#fff' }}>{formatPrice(p.price)}</p>
              <p style={{ fontSize: 'clamp(9px, 2vw, 10px)', color: 'rgba(255,255,255,0.4)' }}>
                {p.inStock ? `✓ ${L.inStock}` : 'Out of stock'} · {p.deliveryDays <= 1 ? L.sameDay : `${p.deliveryDays}-day delivery`}
              </p>
              {error && <p style={{ fontSize: 10, color: '#F87171' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { addToCart({ product: p, quantity: 1 }); onClose(); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: '#7C3AED', border: 'none', borderRadius: 9, color: '#fff',
                    padding: '11px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
                  }}
                >
                  <ShoppingCart size={14} /> {L.addToCart}
                </button>
                {p.productUrl && (
                  <a
                    href={p.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 14px', borderRadius: 9,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: '#fff',
                    }}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
