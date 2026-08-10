import { useState, useRef, useEffect } from 'react';
import {
  Bell, Search, RefreshCw, ChevronDown, Menu,
  AlertTriangle, CheckCircle, Info, X, Clock,
  Crown, Code2, Eye, UserCheck, Shield,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useUsers } from '../context/UserContext';

const PAGE_INFO: Record<string, { title: string; sub: string }> = {
  dashboard:        { title: 'Dashboard',          sub: 'Real-time overview across all APIs' },
  health:           { title: 'API Health Monitor',  sub: 'Live endpoint status' },
  traffic:          { title: 'Traffic Analytics',   sub: 'Request volume and throughput' },
  'response-time':  { title: 'Response Time',        sub: 'Latency distribution and percentile trends' },
  errors:           { title: 'Error Analytics',     sub: 'HTTP error tracking and root cause analysis' },
  'ml-predictions': { title: 'ML Predictions',      sub: 'AI-powered traffic and load forecasting' },
  anomaly:          { title: 'Anomaly Detection',   sub: 'Intelligent spike and incident alerting' },
  registry:         { title: 'API Registry',        sub: 'Manage all registered endpoints' },
  'api-detail':     { title: 'API Details',         sub: 'Deep-dive analytics for a single endpoint' },
  reports:          { title: 'Reports',             sub: 'Generate and export analytics reports' },
  users:            { title: 'User Management',     sub: 'Team access control and RBAC approvals' },
  settings:         { title: 'Settings',            sub: 'Platform configuration and preferences' },
};

const TIME_RANGES = ['Last 15 min', 'Last 1 hour', 'Last 6 hours', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];

const NOTIFS = [
  { id: 1, type: 'warning', title: 'New Access Request: Yuki Tanaka (Developer)', time: '3 min ago', read: false },
  { id: 2, type: 'error',   title: 'Order API is Down',                           time: '8 min ago', read: false },
  { id: 3, type: 'warning', title: 'High error rate on Payment API',              time: '14 min ago', read: false },
  { id: 4, type: 'success', title: 'Auth API back to healthy',                    time: '32 min ago', read: true  },
];

const notifIcon = (t: string) => ({
  error:   <AlertTriangle size={13} style={{ color: '#EF4444' }} />,
  warning: <AlertTriangle size={13} style={{ color: '#F59E0B' }} />,
  success: <CheckCircle   size={13} style={{ color: '#22C55E' }} />,
  info:    <Info          size={13} style={{ color: '#06B6D4' }} />,
}[t]);

interface NavbarProps {
  activePage: string;
  onMobileMenuOpen?: () => void;
  onRefresh?: () => void;
}

export default function Navbar({ activePage, onMobileMenuOpen, onRefresh }: NavbarProps) {
  const { toast } = useToast();
  const { users, currentUser, switchUser } = useUsers();
  const [timeRange, setTimeRange]         = useState('Last 24 hours');
  const [showTimeMenu, setShowTimeMenu]   = useState(false);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [notifs, setNotifs]               = useState(NOTIFS);
  const [refreshing, setRefreshing]       = useState(false);
  const notifRef  = useRef<HTMLDivElement>(null);
  const timeRef   = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (timeRef.current  && !timeRef.current.contains(e.target as Node))  setShowTimeMenu(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUserSwitch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      onRefresh?.();
      toast('success', 'Data refreshed', `Showing live data for ${timeRange}`);
    }, 900);
  };

  const handleTimeRange = (r: string) => {
    setTimeRange(r);
    setShowTimeMenu(false);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      onRefresh?.();
      toast('info', `Range: ${r}`, 'Charts updated to selected time window');
    }, 700);
  };

  const info = PAGE_INFO[activePage] || PAGE_INFO.dashboard;

  const roleMeta = {
    Admin:     { color: '#F87171', bg: 'rgba(239,68,68,0.14)',  border: 'rgba(239,68,68,0.3)',  icon: <Crown size={11} /> },
    Developer: { color: '#60A5FA', bg: 'rgba(37,99,235,0.14)',  border: 'rgba(37,99,235,0.3)',  icon: <Code2 size={11} /> },
    Viewer:    { color: '#CBD5E1', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', icon: <Eye size={11} /> },
  }[currentUser?.role || 'Viewer'];

  return (
    <div
      className="glass-strong"
      style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        position: 'relative', zIndex: 10,
      }}
    >
      {/* Mobile menu */}
      <button className="btn-icon hide-md" onClick={onMobileMenuOpen} style={{ flexShrink: 0 }}>
        <Menu size={15} />
      </button>

      {/* Page title */}
      <div style={{ flex: '0 1 auto', overflow: 'hidden' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          {info.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.sub}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Role / User Switcher for Testing RBAC */}
      <div ref={userRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowUserSwitch(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 10px', borderRadius: 8,
            background: roleMeta.bg, border: `1px solid ${roleMeta.border}`,
            color: roleMeta.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          title="Switch role / user for testing RBAC"
        >
          {roleMeta.icon}
          <span>{currentUser?.name || 'Active User'}</span>
          <span style={{ fontSize: 10, opacity: 0.85, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            ({currentUser?.role})
          </span>
          <ChevronDown size={11} style={{ transform: showUserSwitch ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>

        {showUserSwitch && (
          <div
            className="glass-strong"
            style={{
              position: 'absolute', top: 38, right: 0, borderRadius: 12,
              padding: 8, minWidth: 240, zIndex: 40,
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              border: '1px solid var(--border)',
              animation: 'scaleIn 0.15s ease',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-5)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 6px', fontFamily: "'JetBrains Mono', monospace" }}>
              Switch User Role (RBAC Testing)
            </div>
            {users.slice(0, 5).map(u => {
              const active = u.id === currentUser?.id;
              const isPending = u.status === 'pending';
              const isInactive = u.status === 'inactive';
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    if (isPending || isInactive) {
                      toast('warning', 'Cannot Switch User', `${u.name} status is ${u.status}. Access approval required.`);
                      return;
                    }
                    switchUser(u.id);
                    setShowUserSwitch(false);
                    toast('info', `Switched to ${u.name}`, `Active role: ${u.role}`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 10px', marginBottom: 2,
                    textAlign: 'left', background: active ? 'rgba(37,99,235,0.15)' : 'none',
                    border: 'none', borderRadius: 8, cursor: (isPending || isInactive) ? 'not-allowed' : 'pointer',
                    opacity: (isPending || isInactive) ? 0.5 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: 'var(--text-1)' }}>
                      {u.name} {active && <span style={{ color: '#60A5FA', fontSize: 11 }}>(Current)</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>
                      {u.email}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                    background: u.role === 'Admin' ? 'rgba(239,68,68,0.15)' : u.role === 'Developer' ? 'rgba(37,99,235,0.15)' : 'rgba(148,163,184,0.15)',
                    color: u.role === 'Admin' ? '#F87171' : u.role === 'Developer' ? '#60A5FA' : '#94A3B8',
                  }}>
                    {isPending ? 'PENDING' : u.role}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time range */}
      <div className="hide-md" ref={timeRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          className="btn btn-secondary"
          style={{ height: 32, fontSize: 12, gap: 5 }}
          onClick={() => setShowTimeMenu(s => !s)}
        >
          <Clock size={12} />
          {timeRange}
          <ChevronDown size={11} style={{ transform: showTimeMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        {showTimeMenu && (
          <div
            className="glass-strong"
            style={{
              position: 'absolute', top: 38, right: 0, borderRadius: 10,
              padding: 6, minWidth: 160, zIndex: 30,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.15s ease',
            }}
          >
            {TIME_RANGES.map(r => (
              <button
                key={r}
                onClick={() => handleTimeRange(r)}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px',
                  textAlign: 'left', background: r === timeRange ? 'rgba(37,99,235,0.15)' : 'none',
                  color: r === timeRange ? '#60A5FA' : 'var(--text-2)',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: r === timeRange ? 600 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button
        className="btn-icon"
        onClick={handleRefresh}
        title="Refresh data"
        disabled={refreshing}
        style={{ flexShrink: 0, opacity: refreshing ? 0.7 : 1 }}
      >
        <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          className="btn-icon"
          onClick={() => setShowNotifs(s => !s)}
          style={{ position: 'relative' }}
        >
          <Bell size={14} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 8, height: 8, borderRadius: '50%',
              background: '#EF4444', border: '1.5px solid var(--bg)',
            }} />
          )}
        </button>

        {showNotifs && (
          <div
            className="glass-strong"
            style={{
              position: 'absolute', top: 42, right: 0, width: 320,
              borderRadius: 14, zIndex: 30,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.15s ease',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                Notifications
                {unread > 0 && <span style={{ marginLeft: 7, fontSize: 11, background: '#EF4444', color: 'white', borderRadius: 9, padding: '1px 6px', fontWeight: 700 }}>{unread}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {unread > 0 && (
                  <button
                    style={{ fontSize: 11, color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
                  >
                    Mark all read
                  </button>
                )}
                <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => setShowNotifs(false)}>
                  <X size={11} />
                </button>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  style={{
                    display: 'flex', gap: 10, padding: '11px 16px',
                    background: !n.read ? 'rgba(37,99,235,0.06)' : 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                >
                  <div style={{ marginTop: 1, flexShrink: 0 }}>{notifIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: n.read ? 400 : 600, color: 'var(--text-1)' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 5 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div className="dot dot-healthy" style={{ animation: 'pulse-dot 2s infinite' }} />
        <span className="hide-md" style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Live</span>
      </div>
    </div>
  );
}
