import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  CheckCircle, Clock, Zap, Shield, Crown, Code2, Eye,
  Download, FilePlus, Plus, Lock, Send,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell, PieChart, Pie,
} from 'recharts';
import Badge from '../components/Badge';
import { trafficData, errorDistribution, apis, responseTimeData, weeklyTraffic } from '../data/mockData';
import { useUsers } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import RbacMatrix from '../components/RbacMatrix';
import PermissionGateModal from '../components/PermissionGateModal';

// ─── Radial health gauge (SVG) ────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const R = 54, cx = 68, cy = 68;
  const sweep = 240;
  const startAngle = 150;
  const filled = startAngle + (score / 100) * sweep;
  const color  = score >= 90 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#EF4444';

  const polar = (angle: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  };

  const arc = (from: number, to: number) => {
    const s = polar(from), e = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <svg width={136} height={136} viewBox="0 0 136 136">
      <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={10} strokeLinecap="round" />
      <path d={arc(startAngle, filled)}             fill="none" stroke={color}                  strokeWidth={10} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      <text x={cx} y={cy - 5}  textAnchor="middle" fill={color}         fontSize={26} fontWeight={800} fontFamily="inherit">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-4)" fontSize={10} fontFamily="inherit">Health Score</text>
    </svg>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const FEED_ITEMS = [
  { time: '14:32', type: 'spike',   msg: 'Traffic spike on Product Catalog +340%',  color: '#F59E0B' },
  { time: '13:58', type: 'slow',    msg: 'Notification API P95 > 1200ms threshold', color: '#F97316' },
  { time: '13:12', type: 'error',   msg: 'Order API error rate reached 8.4%',        color: '#EF4444' },
  { time: '12:45', type: 'resolve', msg: 'Auth API brute-force alert resolved',      color: '#22C55E' },
  { time: '12:01', type: 'info',    msg: 'Weekly SLA report auto-generated',         color: '#60A5FA' },
  { time: '11:23', type: 'spike',   msg: 'Search API 180% traffic — scaling OK',    color: '#8B5CF6' },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius: 10, padding: '10px 14px', fontSize: 12, minWidth: 130 }}>
      <div style={{ color: 'var(--text-4)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color || p.fill }} />
          <span style={{ color: 'var(--text-3)' }}>{p.name}:</span>
          <span style={{ color: p.color || p.fill, fontWeight: 700 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Compact metric chip ──────────────────────────────────────────────────────

function Chip({ label, value, sub, change, color }: { label: string; value: string; sub: string; change: number; color: string }) {
  const up = change >= 0;
  return (
    <div className="glass-card hover-lift" style={{ padding: '14px 16px', minWidth: 140, flex: '1 1 140px' }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
        <span style={{ color: up ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(change)}%
        </span>
        <span style={{ color: 'var(--text-5)' }}>{sub}</span>
      </div>
      <div style={{ marginTop: 8, height: 2, borderRadius: 1, background: `${color}25` }}>
        <div style={{ height: '100%', borderRadius: 1, background: color, width: `${Math.min(Math.abs(change) * 4, 100)}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Status grid cell ─────────────────────────────────────────────────────────

function StatusCell({ api }: { api: typeof apis[0] }) {
  const COLOR = { healthy: '#22C55E', warning: '#F59E0B', slow: '#F97316', down: '#EF4444' };
  const c = COLOR[api.status as keyof typeof COLOR] ?? '#64748B';
  return (
    <div
      title={`${api.name}\n${api.endpoint}\n${api.uptime}% up · ${api.avgResponse}ms`}
      style={{
        height: 28, borderRadius: 5,
        background: `${c}22`,
        border: `1px solid ${c}44`,
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${c}40`; e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${c}22`; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: `${api.uptime}%`, height: '100%', background: `${c}18` }} />
      <div style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', background: c, boxShadow: api.status === 'down' ? 'none' : `0 0 5px ${c}` }} />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser, canAccess } = useUsers();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);

  // Modal states for RBAC
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [gateOpen, setGateOpen]               = useState(false);
  const [gateAction, setGateAction]           = useState('');

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const totalReq     = trafficData.reduce((s, d) => s + d.requests, 0);
  const totalErr     = trafficData.reduce((s, d) => s + d.errors, 0);
  const errorRate    = ((totalErr / totalReq) * 100).toFixed(2);
  const healthyCount = apis.filter(a => a.status === 'healthy').length;

  const roleMeta = {
    Admin:     { color: '#F87171', bg: 'rgba(239,68,68,0.14)',  border: 'rgba(239,68,68,0.3)',  icon: <Crown size={12} /> },
    Developer: { color: '#60A5FA', bg: 'rgba(37,99,235,0.14)',  border: 'rgba(37,99,235,0.3)',  icon: <Code2 size={12} /> },
    Viewer:    { color: '#CBD5E1', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', icon: <Eye size={12} /> },
  }[currentUser?.role || 'Viewer'];

  // RBAC Action handlers
  const handleExportData = () => {
    if (!canAccess('export')) {
      setGateAction('Export Analytics Data');
      setGateOpen(true);
      return;
    }
    toast('success', 'Export Started', 'Dashboard analytics data is downloading as CSV.');
  };

  const handleCreateReport = () => {
    if (!canAccess('reports')) {
      setGateAction('Create Custom Reports');
      setGateOpen(true);
      return;
    }
    toast('info', 'Report Generation', 'Creating automated weekly SLA report...');
  };

  const handleManageApis = () => {
    if (!canAccess('apis')) {
      setGateAction('Manage APIs & Endpoints');
      setGateOpen(true);
      return;
    }
    toast('info', 'Manage APIs', 'Navigating to API Registry management.');
  };

  return (
    <div className="page stagger" style={{ gap: 14 }}>

      {/* ── RBAC Role Capabilities Banner ── */}
      <div className="glass-card scale-in" style={{
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 17, 32, 0.98) 100%)',
        border: '1px solid rgba(0, 196, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: roleMeta.bg, border: `1px solid ${roleMeta.border}`,
            color: roleMeta.color, fontSize: 12, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
          }}>
            {roleMeta.icon} {currentUser?.role?.toUpperCase() || 'VIEWER'} MODE
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
              Logged in as <strong style={{ color: '#60A5FA' }}>{currentUser?.name || 'User'}</strong>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
              {currentUser?.role === 'Admin'
                ? 'Full access to Dashboards, Analytics, APIs, Reports, Users, and Settings.'
                : currentUser?.role === 'Developer'
                ? 'Access to Dashboards, Analytics, APIs, Reports, and Data Export.'
                : 'Read-Only access to Dashboards & Analytics based on RBAC Permissions Matrix.'}
            </div>
          </div>
        </div>

        {/* Dashboard RBAC Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowMatrixModal(true)}
            className="btn btn-secondary"
            style={{ height: 32, fontSize: 11.5, gap: 5, borderColor: 'rgba(0,196,255,0.3)', color: '#00C8FF' }}
          >
            <Shield size={12} /> RBAC Matrix
          </button>

          <button
            onClick={handleExportData}
            className="btn btn-secondary"
            style={{
              height: 32, fontSize: 11.5, gap: 5,
              opacity: canAccess('export') ? 1 : 0.7,
              borderColor: canAccess('export') ? 'var(--border)' : 'rgba(239, 68, 68, 0.3)',
            }}
          >
            {canAccess('export') ? <Download size={12} /> : <Lock size={12} style={{ color: '#F87171' }} />}
            Export Data
          </button>

          <button
            onClick={handleCreateReport}
            className="btn btn-primary"
            style={{
              height: 32, fontSize: 11.5, gap: 5,
              background: canAccess('reports') ? 'linear-gradient(135deg, #1d4ed8, #2563EB)' : 'rgba(30, 41, 59, 0.8)',
              borderColor: canAccess('reports') ? 'transparent' : 'rgba(239, 68, 68, 0.4)',
              color: canAccess('reports') ? 'white' : '#F87171',
            }}
          >
            {canAccess('reports') ? <FilePlus size={12} /> : <Lock size={12} />}
            Create Report
          </button>
        </div>
      </div>

      {/* ── Row 1: Hero health + chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'stretch' }}>

        {/* Health ring panel */}
        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(11,17,32,0.98) 100%)' }}>
          <HealthRing score={96} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Platform Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'APIs Healthy', val: `${healthyCount} / ${apis.length}`, color: '#22C55E' },
                { label: 'Uptime (30d)', val: '99.97%', color: '#06B6D4' },
                { label: 'Error Rate',   val: `${errorRate}%`, color: '#EF4444' },
                { label: 'Avg Response', val: '142ms', color: '#F59E0B' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-4)', width: 88 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metric chips row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignContent: 'stretch' }}>
          <Chip label="Total Requests"  value="48.2M"  sub="this month" change={23}   color="#60A5FA" />
          <Chip label="Success Rate"    value="97.3%"  sub="vs 96.8%"   change={0.5}  color="#22C55E" />
          <Chip label="Failed Requests" value="1.28M"  sub="this month" change={-5}   color="#EF4444" />
          <Chip label="Avg Latency"     value="142ms"  sub="P95: 312ms" change={-8}   color="#F59E0B" />
          <Chip label="Active APIs"     value="231"    sub="of 247 total" change={8}  color="#8B5CF6" />
        </div>
      </div>

      {/* ── Row 2: Traffic chart + activity feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

        {/* 24h area chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div className="section-title">API Traffic — 24 Hours</div>
              <div className="section-sub">Requests · Errors · P95 latency overlay</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
              {[['#2563EB','Requests'],['#EF4444','Errors'],['#22C55E','P95']].map(([c,l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 2, background: c, display: 'inline-block', borderRadius: 1 }} />{l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                {[['rg','#2563EB'],['eg','#EF4444'],['pg','#22C55E']].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#2563EB" fill="url(#rg)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="p95"      name="P95 ms"   stroke="#22C55E" fill="url(#pg)" strokeWidth={1.5} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="errors"   name="Errors"   stroke="#EF4444" fill="url(#eg)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live activity feed */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="dot dot-healthy" style={{ animation: 'pulse-dot 2s infinite' }} />
              <div className="section-title" style={{ fontSize: 13 }}>Live Events</div>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-5)', fontWeight: 600 }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {FEED_ITEMS.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 5px ${item.color}80` }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{item.msg}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-5)', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Response time + API status grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Response time sparklines */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Response Time — 7 Days</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Avg / P95 / Max with SLA threshold</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={responseTimeData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="avg" name="Avg"  stroke="#22C55E" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="p95" name="P95"  stroke="#F59E0B" strokeWidth={2}   dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="max" name="Max"  stroke="#EF4444" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* API status grid */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="section-title">API Status Grid</div>
              <div className="section-sub">All {apis.length} endpoints — hover for details</div>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
              {[['#22C55E','Healthy'],['#F59E0B','Warning'],['#EF4444','Down']].map(([c,l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: c, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-4)' }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {apis.map(api => <StatusCell key={api.id} api={api} />)}
          </div>
        </div>
      </div>

      {/* ── Row 4: Weekly bar + error donut + top APIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 1fr', gap: 14 }}>

        {/* Weekly traffic bars */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Weekly Volume</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Success vs error split</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyTraffic} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="success" name="Success" fill="#22C55E" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="errors"  name="Errors"  fill="#EF4444" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Error donut */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="section-title" style={{ marginBottom: 2, alignSelf: 'flex-start' }}>Errors</div>
          <div className="section-sub" style={{ marginBottom: 10, alignSelf: 'flex-start' }}>By HTTP code</div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={errorDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} strokeWidth={0}>
                {errorDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {errorDistribution.slice(0,3).map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: e.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-4)' }}>{e.name}</span>
                </span>
                <span style={{ color: 'var(--text-2)', fontWeight: 700 }}>{(e.value/1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top APIs by volume */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Top APIs by Volume</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Highest-traffic endpoints today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...apis].sort((a,b) => b.requests - a.requests).slice(0, 5).map((api, i) => {
              const maxReq = apis.reduce((m, a) => Math.max(m, a.requests), 0);
              const pct = (api.requests / maxReq) * 100;
              const COLOR = { healthy:'#22C55E', warning:'#F59E0B', slow:'#F97316', down:'#EF4444' };
              const c = COLOR[api.status as keyof typeof COLOR] ?? '#64748B';
              return (
                <div key={api.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-5)', fontWeight: 700, width: 14, textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{api.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', flexShrink: 0, marginLeft: 8 }}>{(api.requests/1e6).toFixed(1)}M</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(100,116,139,0.15)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${c}, ${c}88)`, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: c, flexShrink: 0, boxShadow: api.status !== 'down' ? `0 0 6px ${c}` : 'none' }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RBAC Permissions Matrix Modal ── */}
      {showMatrixModal && (
        <div className="modal-overlay" onClick={() => setShowMatrixModal(false)} style={{ zIndex: 999 }}>
          <div className="modal-panel scale-in" style={{ width: 620, padding: 24, background: '#0B1120' }} onClick={e => e.stopPropagation()}>
            <RbacMatrix highlightRole={currentUser?.role} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowMatrixModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restricted Action Gate Modal ── */}
      <PermissionGateModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        currentRole={currentUser?.role}
        actionName={gateAction}
      />
    </div>
  );
}
