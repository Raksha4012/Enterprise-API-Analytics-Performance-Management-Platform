import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { responseTimeData, trafficData } from '../data/mockData';

const latencyBreakdown = [
  { service: 'Auth API', avg: 124, p95: 312, max: 892 },
  { service: 'Product API', avg: 89, p95: 198, max: 456 },
  { service: 'Analytics API', avg: 67, p95: 156, max: 312 },
  { service: 'Payment API', avg: 456, p95: 1240, max: 3400 },
  { service: 'Search API', avg: 134, p95: 289, max: 678 },
  { service: 'Notify API', avg: 678, p95: 1580, max: 4200 },
];

const distribution = [
  { bucket: '<50ms', count: 12400, pct: 26 },
  { bucket: '50-100ms', count: 18600, pct: 39 },
  { bucket: '100-200ms', count: 9800, pct: 20 },
  { bucket: '200-500ms', count: 4700, pct: 10 },
  { bucket: '500ms-1s', count: 1400, pct: 3 },
  { bucket: '>1s', count: 1000, pct: 2 },
];

const radarData = [
  { service: 'Auth', p50: 80, p95: 65, p99: 42 },
  { service: 'Product', p50: 92, p95: 84, p99: 68 },
  { service: 'Analytics', p50: 96, p95: 88, p99: 72 },
  { service: 'Payment', p50: 45, p95: 28, p99: 18 },
  { service: 'Search', p50: 87, p95: 76, p99: 60 },
  { service: 'Notify', p50: 38, p95: 22, p99: 12 },
];

export default function ResponseTimeAnalytics() {
  const stats = [
    { label: 'P50 (Median)', value: '142ms', color: '#22C55E', delta: '-8ms' },
    { label: 'P95', value: '312ms', color: '#F59E0B', delta: '-24ms' },
    { label: 'P99', value: '678ms', color: '#F97316', delta: '+12ms' },
    { label: 'Max', value: '4,200ms', color: '#EF4444', delta: '+340ms' },
  ];

  return (
    <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {stats.map(({ label, value, color, delta }) => (
          <div key={label} className="glass hover-lift card-shadow" style={{ borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: delta.startsWith('+') ? '#EF4444' : '#22C55E', marginTop: 4 }}>
              {delta} vs last week
            </div>
          </div>
        ))}
      </div>

      {/* Trend + distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>Latency Trend — 7 Days</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>P50, P95, P99 percentiles</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={responseTimeData}>
              <defs>
                <linearGradient id="p95g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} unit="ms" />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
              <ReferenceLine y={500} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'SLA 500ms', fill: '#EF4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="p95" name="P95" stroke="#F59E0B" fill="url(#p95g)" strokeWidth={2} />
              <Line type="monotone" dataKey="avg" name="Avg" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="max" name="Max" stroke="#EF4444" strokeWidth={1} dot={false} strokeDasharray="3 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>Latency Distribution</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Request buckets by duration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {distribution.map(({ bucket, count, pct }) => (
              <div key={bucket}>
                <div className="flex justify-between" style={{ fontSize: 11, marginBottom: 3 }}>
                  <span className="mono" style={{ color: '#94A3B8' }}>{bucket}</span>
                  <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(100,116,139,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, width: `${pct}%`,
                    background: pct > 30 ? '#22C55E' : pct > 15 ? '#F59E0B' : '#EF4444',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 }}>Service Latency Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={latencyBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} unit="ms" />
              <YAxis dataKey="service" type="category" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="avg" name="Avg" fill="#22C55E" radius={[0, 3, 3, 0]} />
              <Bar dataKey="p95" name="P95" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>SLA Compliance Radar</div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Latency score by service (higher = faster)</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(100,116,139,0.15)" />
              <PolarAngleAxis dataKey="service" tick={{ fontSize: 10, fill: '#64748B' }} />
              <Radar name="P50" dataKey="p50" stroke="#22C55E" fill="#22C55E" fillOpacity={0.12} strokeWidth={2} />
              <Radar name="P95" dataKey="p95" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.08} strokeWidth={2} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
