import { useState } from 'react';
import { ArrowLeft, ExternalLink, Copy, RefreshCw, Shield, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';
import Badge from '../components/Badge';
import { apis, trafficData, responseTimeData } from '../data/mockData';

const TABS = ['Overview', 'Analytics', 'Logs', 'Security', 'Documentation'];

interface ApiDetailProps {
  apiId: number;
  onBack: () => void;
}

const versionHistory = [
  { version: 'v2.4.1', date: '2026-07-28', author: 'Marcus Johnson', changes: 'JWT refresh token improvements, rate limit headers added', breaking: false },
  { version: 'v2.4.0', date: '2026-07-12', author: 'Sarah Williams', changes: 'OAuth 2.0 PKCE support, multi-tenant auth flow', breaking: false },
  { version: 'v2.3.0', date: '2026-06-18', author: 'James Wilson', changes: 'Breaking: response schema updated, legacy token deprecation', breaking: true },
  { version: 'v2.2.5', date: '2026-05-30', author: 'Alex Chen', changes: 'Security patch: timing attack mitigation', breaking: false },
];

const logLines = [
  { time: '14:32:18', level: 'INFO', method: 'POST', path: '/api/v2/auth', status: 200, duration: 124, ip: '10.0.1.42' },
  { time: '14:32:17', level: 'WARN', method: 'POST', path: '/api/v2/auth', status: 401, duration: 45, ip: '185.220.101.7' },
  { time: '14:32:16', level: 'INFO', method: 'POST', path: '/api/v2/auth', status: 200, duration: 138, ip: '10.0.1.18' },
  { time: '14:32:15', level: 'ERROR', method: 'POST', path: '/api/v2/auth', status: 500, duration: 2340, ip: '10.0.2.5' },
  { time: '14:32:14', level: 'INFO', method: 'POST', path: '/api/v2/auth', status: 200, duration: 119, ip: '10.0.1.91' },
  { time: '14:32:13', level: 'INFO', method: 'POST', path: '/api/v2/auth', status: 200, duration: 128, ip: '10.0.1.33' },
  { time: '14:32:12', level: 'WARN', method: 'POST', path: '/api/v2/auth', status: 429, duration: 12, ip: '185.220.101.7' },
];

const levelColor: Record<string, string> = {
  INFO: '#22C55E', WARN: '#F59E0B', ERROR: '#EF4444'
};

export default function ApiDetail({ apiId, onBack }: ApiDetailProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const api = apis.find(a => a.id === apiId) || apis[0];

  const stats = [
    { label: 'Total Requests', value: `${(api.requests / 1e6).toFixed(1)}M`, icon: <TrendingUp size={16} />, color: '#2563EB' },
    { label: 'Avg Response', value: `${api.avgResponse}ms`, icon: <Clock size={16} />, color: '#22C55E' },
    { label: 'Error Rate', value: `${api.errorRate}%`, icon: <AlertCircle size={16} />, color: '#EF4444' },
    { label: 'Uptime', value: `${api.uptime}%`, icon: <Shield size={16} />, color: '#06B6D4' },
  ];

  return (
    <div className="fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 btn-secondary"
          style={{ marginBottom: 16, height: 32, fontSize: 12 }}
        >
          <ArrowLeft size={14} /> Back to Registry
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>{api.name}</div>
              <Badge type="status" value={api.status} />
              <Badge type="method" value={api.method} dot={false} />
            </div>
            <div className="flex items-center gap-2 mono" style={{ fontSize: 13, color: '#60A5FA', marginBottom: 6 }}>
              {api.endpoint}
              <button style={{ background: 'none', border: 'none', color: '#64748B' }}>
                <Copy size={12} />
              </button>
              <button style={{ background: 'none', border: 'none', color: '#64748B' }}>
                <ExternalLink size={12} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>{api.description}</div>
            <div className="flex items-center gap-4 mt-2" style={{ fontSize: 12, color: '#64748B' }}>
              <span>Owner: <strong style={{ color: '#94A3B8' }}>{api.owner}</strong></span>
              <span>Version: <strong style={{ color: '#94A3B8' }} className="mono">{api.version}</strong></span>
              <span>Category: <strong style={{ color: '#94A3B8' }}>{api.category}</strong></span>
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2" style={{ height: 36 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          {stats.map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 10, padding: 14, border: '1px solid rgba(100,116,139,0.1)' }}>
              <div className="flex items-center gap-2 mb-1" style={{ color, fontSize: 12 }}>{icon}{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(100,116,139,0.15)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#60A5FA' : '#64748B',
              borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent',
              background: 'none', borderTop: 'none', borderRight: 'none', borderLeft: 'none',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 12 }}>Traffic (24h)</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="requests" stroke="#2563EB" fill="url(#ag)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 12 }}>Response Time (7d)</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="avg" stroke="#22C55E" strokeWidth={2} dot={false} name="Avg" />
                <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="P95" />
                <Line type="monotone" dataKey="max" stroke="#EF4444" strokeWidth={1} dot={false} name="Max" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Version history */}
          <div className="glass card-shadow" style={{ borderRadius: 16, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 }}>Version History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {versionHistory.map((v) => (
                <div
                  key={v.version}
                  className="flex items-start gap-4"
                  style={{ padding: '12px 14px', background: 'rgba(15,23,42,0.5)', borderRadius: 10, border: '1px solid rgba(100,116,139,0.1)' }}
                >
                  <code style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', background: 'rgba(37,99,235,0.1)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                    {v.version}
                  </code>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#CBD5E1' }}>{v.changes}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>{v.date} · {v.author}</div>
                  </div>
                  {v.breaking && (
                    <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 6px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      BREAKING
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Logs' && (
        <div className="glass card-shadow" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(100,116,139,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>Live Request Logs</div>
            <div className="flex items-center gap-2" style={{ fontSize: 11, color: '#22C55E' }}>
              <div className="status-dot healthy animate-pulse-slow" />
              Streaming
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Level</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Source IP</th>
              </tr>
            </thead>
            <tbody>
              {logLines.map((l, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 11, color: '#64748B' }}>{l.time}</td>
                  <td><span style={{ fontSize: 10, fontWeight: 700, color: levelColor[l.level] }}>{l.level}</span></td>
                  <td><Badge type="method" value={l.method} dot={false} /></td>
                  <td className="mono" style={{ fontSize: 11 }}>{l.path}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: l.status >= 500 ? '#EF4444' : l.status >= 400 ? '#F59E0B' : '#22C55E' }}>
                      {l.status}
                    </span>
                  </td>
                  <td className="mono" style={{ color: l.duration > 500 ? '#EF4444' : l.duration > 200 ? '#F59E0B' : '#22C55E', fontSize: 12 }}>
                    {l.duration}ms
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: '#64748B' }}>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {['Requests by Hour', 'Error Breakdown', 'Response Time Distribution', 'Throughput'].map((title, i) => (
            <div key={title} className="glass card-shadow" style={{ borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 12 }}>{title}</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={trafficData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey={i % 2 === 0 ? 'requests' : 'errors'} fill={['#2563EB', '#EF4444', '#22C55E', '#F59E0B'][i]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="flex flex-col gap-16">
          {[
            { label: 'Authentication', value: 'JWT / Bearer Token', icon: '🔐', status: 'Enforced' },
            { label: 'Rate Limiting', value: '1,000 req/min per client', icon: '⚡', status: 'Active' },
            { label: 'IP Allowlist', value: '12 CIDR ranges configured', icon: '🛡️', status: 'Active' },
            { label: 'TLS Version', value: 'TLS 1.3 required', icon: '🔒', status: 'Enforced' },
            { label: 'CORS Policy', value: 'Strict origin validation', icon: '🌐', status: 'Active' },
            { label: 'Audit Logging', value: 'All requests logged to SIEM', icon: '📋', status: 'Active' },
          ].map(({ label, value, icon, status }) => (
            <div key={label} className="glass" style={{ borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{value}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Documentation' && (
        <div className="glass card-shadow" style={{ borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>API Documentation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { method: 'POST', path: '/api/v2/auth/login', desc: 'Authenticate with email and password, returns JWT access and refresh tokens', params: '{ email, password }', response: '{ access_token, refresh_token, expires_in }' },
              { method: 'POST', path: '/api/v2/auth/refresh', desc: 'Exchange refresh token for new access token', params: '{ refresh_token }', response: '{ access_token, expires_in }' },
              { method: 'POST', path: '/api/v2/auth/logout', desc: 'Revoke active session and invalidate tokens', params: 'Authorization: Bearer <token>', response: '{ success: true }' },
            ].map(({ method, path, desc, params, response }) => (
              <div key={path} style={{ borderRadius: 10, border: '1px solid rgba(100,116,139,0.15)', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge type="method" value={method} dot={false} />
                  <code style={{ fontSize: 13, color: '#F1F5F9' }}>{path}</code>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>{desc}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Request</div>
                      <code style={{ fontSize: 11, color: '#60A5FA', background: 'rgba(37,99,235,0.08)', padding: '6px 10px', borderRadius: 6, display: 'block' }}>{params}</code>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Response</div>
                      <code style={{ fontSize: 11, color: '#22C55E', background: 'rgba(34,197,94,0.08)', padding: '6px 10px', borderRadius: 6, display: 'block' }}>{response}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
