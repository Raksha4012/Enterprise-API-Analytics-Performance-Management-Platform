import { RefreshCw, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Badge from '../components/Badge';
import { apis, trafficData } from '../data/mockData';

const COLOR = { healthy: '#22C55E', warning: '#F59E0B', slow: '#F97316', down: '#EF4444' } as Record<string,string>;
const DOT_CLASS = { healthy: 'dot-healthy', warning: 'dot-warning', slow: 'dot-slow', down: 'dot-down' } as Record<string,string>;

function RadialGauge({ value, color }: { value: number; color: string }) {
  const R = 30, CX = 40, CY = 40;
  const SWEEP = 240;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const s = { x: cx + r * Math.cos(toRad(startDeg - 90)), y: cy + r * Math.sin(toRad(startDeg - 90)) };
    const e = { x: cx + r * Math.cos(toRad(endDeg   - 90)), y: cy + r * Math.sin(toRad(endDeg   - 90)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };
  const startAngle = -120, endAngle = startAngle + SWEEP;
  const fillAngle = startAngle + (value / 100) * SWEEP;

  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      <path d={arc(CX, CY, R, startAngle, endAngle)} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={7} strokeLinecap="round" />
      <path d={arc(CX, CY, R, startAngle, fillAngle)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill={color}>{Math.round(value)}</text>
    </svg>
  );
}

const SUMMARY_GROUPS = [
  { label: 'Healthy', color: '#22C55E', status: 'healthy' },
  { label: 'Warning',  color: '#F59E0B', status: 'warning' },
  { label: 'Slow',     color: '#F97316', status: 'slow' },
  { label: 'Down',     color: '#EF4444', status: 'down' },
];

export default function ApiHealth() {
  return (
    <div className="page stagger">
      {/* Summary */}
      <div className="grid-kpi">
        {SUMMARY_GROUPS.map(({ label, color, status }) => {
          const count = apis.filter(a => a.status === status).length;
          return (
            <div key={label} className="glass-card hover-lift" style={{ padding: 20, borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 36, fontWeight: 800, color, marginBottom: 3, letterSpacing: '-0.03em' }}>{count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>APIs {label}</div>
              <div className="progress" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: `${(count/apis.length)*100}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cards grid */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <div className="section-title">Live Status Cards</div>
          <div className="section-sub">Real-time health metrics per endpoint</div>
        </div>
        <div className="grid-auto">
          {apis.map(api => {
            const color = COLOR[api.status] ?? '#64748B';
            const dotClass = DOT_CLASS[api.status] ?? 'dot-inactive';
            const health = api.status === 'healthy' ? api.uptime : api.status === 'warning' ? 76 : api.status === 'slow' ? 54 : 22;
            const mini = trafficData.slice(4, 12).map(d => api.errorRate > 3 ? d.errors * 2 : d.requests / 500);
            return (
              <div
                key={api.id}
                className="glass-card hover-lift"
                style={{ padding: 16, borderTop: `2px solid ${color}25` }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ flex: 1, overflow: 'hidden', paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <div className={`dot ${dotClass}`} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {api.name}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: '#60A5FA' }}>{api.endpoint}</div>
                  </div>
                  <RadialGauge value={health} color={color} />
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Availability', value: `${api.uptime}%`    },
                    { label: 'Latency',      value: `${api.avgResponse}ms` },
                    { label: 'Error Rate',   value: `${api.errorRate}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="metric-chip">
                      <div style={{ fontSize: 9.5, color: 'var(--text-4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Sparkline */}
                <div style={{ height: 40 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mini.map((v,i) => ({ v, i }))} margin={{ top: 4, bottom: 4 }}>
                      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Badge type="status" value={api.status} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" style={{ width: 26, height: 26 }}><ExternalLink size={11} /></button>
                    <button className="btn-icon" style={{ width: 26, height: 26 }}><RefreshCw size={11} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
