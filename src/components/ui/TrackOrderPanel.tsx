'use client';

import { useState } from 'react';
import { Loader2, Package, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { KaprukaOrderTracking } from '@/types';
import { UserLanguage } from '@/lib/language';
import { uiLabels } from '@/lib/ui-strings';

interface Props {
  compact?: boolean;
  lang?: UserLanguage;
}

export default function TrackOrderPanel({ compact = false, lang = 'en' }: Props) {
  const [expanded, setExpanded] = useState(!compact);
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<KaprukaOrderTracking | null>(null);
  const L = uiLabels(lang);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    const num = orderNumber.trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    try {
      const res = await fetch('/api/kapruka/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: num }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? L.trackFailed);
      setResult(data as KaprukaOrderTracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.trackFailed);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = (status?: string) => {
    const s = (status ?? '').toLowerCase();
    if (s.includes('deliver')) return '#34D399';
    if (s.includes('ship') || s.includes('out')) return '#22D3EE';
    if (s.includes('cancel')) return '#F87171';
    return '#A78BFA';
  };

  return (
    <div style={{
      borderTop: compact ? 'none' : '1px solid var(--border)',
      padding: compact ? 0 : '12px 14px',
    }}>
      {compact && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px',
            color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, letterSpacing: '0.12em',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={12} /> {L.trackOrder}
          </span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {(!compact || expanded) && (
        <div style={{ padding: compact ? '0 14px 14px' : 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!compact && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em',
            }}>
              {L.trackOrder}
            </span>
          )}

          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            {L.trackHint}
          </p>

          <form onSubmit={handleTrack} style={{ display: 'flex', gap: 6 }}>
            <input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder={L.trackPlaceholder}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: 7, padding: '8px 10px', color: '#fff', fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
              }}
            />
            <button
              type="submit"
              disabled={loading || !orderNumber.trim()}
              style={{
                background: loading ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.25)',
                border: '1px solid rgba(124,58,237,0.4)', borderRadius: 7,
                color: '#A78BFA', padding: '8px 12px', fontSize: 9, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : L.trackBtn}
            </button>
          </form>

          {error && (
            <p style={{ fontSize: 10, color: '#F87171', lineHeight: 1.4 }}>{error}</p>
          )}

          {result && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              borderRadius: 9, padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {result.order_number}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: statusColor(result.status), marginTop: 4 }}>
                    {result.status_display ?? result.status}
                  </p>
                </div>
                {result.amount && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    LKR {parseFloat(String(result.amount)).toLocaleString('en-LK')}
                  </p>
                )}
              </div>

              {result.delivery_date && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                  {L.delivery}: {result.delivery_date}
                </p>
              )}

              {result.recipient && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <MapPin size={11} style={{ color: '#34D399', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                    {result.recipient.name}
                    {result.recipient.address && ` · ${result.recipient.address}`}
                    {result.recipient.city && `, ${result.recipient.city}`}
                  </p>
                </div>
              )}

              {result.items && result.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.items.slice(0, 4).map((item, i) => (
                    <p key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {item.quantity}× {item.name}
                    </p>
                  ))}
                </div>
              )}

              {result.progress && result.progress.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {L.progress}
                  </p>
                  {result.progress.slice(-4).map((step, i) => (
                    <p key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                      {step.timestamp ? `${step.timestamp} — ` : ''}{step.step}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
