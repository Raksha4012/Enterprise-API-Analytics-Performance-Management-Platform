import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  change?: number;
  icon: ReactNode;
  accent?: string;
  sub?: string;
  sparkline?: number[];
  loading?: boolean;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 72, H = 26;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = (((data.length - 1) / (data.length - 1)) * W).toFixed(1);
  const lastY = (H - ((data[data.length-1] - min) / range) * (H - 4) - 2).toFixed(1);
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', opacity: 0.9 }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={`url(#sg-${color.replace('#','')})`}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ strokeDasharray: 1000, animation: 'drawLine 1.2s ease both' }}
      />
      <circle cx={lastX} cy={lastY} r={3} fill={color} opacity={0.9} />
    </svg>
  );
}

export default function KpiCard({ label, value, change, icon, accent = '#2563EB', sub, sparkline, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: 20, minHeight: 120 }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '60%', height: 24, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '80%', height: 12 }} />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className="glass-card hover-lift fade-in-up"
      style={{ padding: 18, position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 80, height: 80, borderRadius: '50%',
        background: accent, opacity: 0.07, filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}1A`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        {sparkline && <Sparkline data={sparkline} color={accent} />}
      </div>

      <div style={{
        fontSize: 24, fontWeight: 800, color: 'var(--text-1)',
        letterSpacing: '-0.02em', lineHeight: 1,
        marginBottom: 3,
        animation: 'countUp 0.4s ease both',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: sub || change !== undefined ? 7 : 0 }}>
        {label}
      </div>

      {(change !== undefined || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          {change !== undefined && (
            <>
              {isPositive && <TrendingUp size={11} style={{ color: '#22C55E' }} />}
              {isNegative && <TrendingDown size={11} style={{ color: '#EF4444' }} />}
              <span style={{
                color: isPositive ? '#22C55E' : isNegative ? '#EF4444' : 'var(--text-4)',
                fontWeight: 600,
              }}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </>
          )}
          {sub && <span style={{ color: 'var(--text-4)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
