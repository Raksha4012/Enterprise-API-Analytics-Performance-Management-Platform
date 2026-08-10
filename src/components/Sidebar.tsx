import {
  LayoutDashboard, Database, Clock, AlertTriangle, Activity,
  Brain, Search, FileText, Users, Settings, Zap,
  BarChart3, X, ChevronRight, LogOut,
  Radio, Menu, Shield,
} from 'lucide-react';
import { useUsers } from '../context/UserContext';

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard, perm: 'dashboards' },
      { id: 'health',     label: 'API Health',       icon: Activity,        perm: 'dashboards' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { id: 'traffic',       label: 'Traffic',         icon: BarChart3,     perm: 'analytics' },
      { id: 'response-time', label: 'Response Time',   icon: Clock,        perm: 'analytics' },
      { id: 'errors',        label: 'Error Analytics', icon: AlertTriangle, perm: 'analytics' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { id: 'ml-predictions', label: 'ML Predictions',    icon: Brain,  perm: 'analytics' },
      { id: 'anomaly',        label: 'Anomaly Detection', icon: Search, perm: 'analytics' },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'registry', label: 'API Registry', icon: Database, perm: 'apis' },
      { id: 'reports',  label: 'Reports',      icon: FileText, perm: 'reports' },
      { id: 'users',    label: 'Users',        icon: Users,    perm: 'users' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, perm: 'settings' },
    ],
  },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onLogout?: () => void;
}

function SidebarContent({ activePage, onNavigate, collapsed, onToggle, onMobileClose, onLogout }: Omit<SidebarProps, 'mobileOpen'>) {
  const { currentUser, canAccess } = useUsers();
  const navigate = (id: string) => { onNavigate(id); onMobileClose?.(); };

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleColor = currentUser?.role === 'Admin'
    ? '#EF4444'
    : currentUser?.role === 'Developer'
    ? '#60A5FA'
    : '#94A3B8';

  return (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 12px 12px',
        borderBottom: '1px solid rgba(0,196,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6, flexShrink: 0,
          background: 'transparent',
          border: '1px solid rgba(0,196,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(0,196,255,0.18), inset 0 0 8px rgba(0,196,255,0.05)',
        }}>
          <Zap size={15} color="#00C8FF" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#D8EEFF', letterSpacing: '0.01em', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
              ApiPulse
            </div>
            <div style={{ fontSize: 9, color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.7, marginTop: 1 }}>
              Enterprise
            </div>
          </div>
        )}
        <button
          onClick={onMobileClose ?? onToggle}
          style={{ background: 'none', border: 'none', color: '#4E6E84', cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0, marginLeft: 'auto', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00C8FF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4E6E84')}
        >
          {onMobileClose ? <X size={14} /> : <Menu size={13} />}
        </button>
      </div>

      {/* Status strip */}
      {!collapsed && (
        <div style={{ padding: '8px 10px 4px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,229,153,0.05)',
            border: '1px solid rgba(0,229,153,0.12)',
            borderRadius: 4, padding: '5px 9px',
          }}>
            <Radio size={10} style={{ color: '#00E599' }} />
            <span style={{ fontSize: 10, color: '#00E599', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
              LIVE
            </span>
            <span style={{ fontSize: 10, color: '#3A5060', marginLeft: 2 }}>· monitoring active</span>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E599', boxShadow: '0 0 6px #00E599', marginLeft: 'auto', animation: 'pulse-dot 2s infinite' }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="scroll-area" style={{ flex: 1, padding: '6px 8px' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                fontSize: 9, fontWeight: 600, color: '#1E2D3A',
                textTransform: 'uppercase', letterSpacing: '0.16em',
                padding: '10px 6px 4px',
                fontFamily: "'JetBrains Mono', monospace",
                borderTop: group !== 'Overview' ? '1px solid rgba(0,196,255,0.04)' : 'none',
                marginTop: group !== 'Overview' ? 4 : 0,
              }}>
                {group}
              </div>
            )}
            {items.map(({ id, label, icon: Icon, perm }) => {
              const active = activePage === id || (activePage === 'api-detail' && id === 'registry');
              const isRestricted = perm ? !canAccess(perm) : false;
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`nav-item${active ? ' active' : ''}`}
                  title={collapsed ? `${label}${isRestricted ? ' (Restricted - Upgrade Required)' : ''}` : undefined}
                  style={{
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '8px' : '7px 8px',
                    opacity: isRestricted ? 0.5 : 1,
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, fontSize: 11.5 }}>{label}</span>
                      {isRestricted ? (
                        <span title="Restricted - Upgrade Required" style={{ display: 'inline-flex' }}>
                          <Shield size={10} style={{ color: '#F87171', opacity: 0.8 }} />
                        </span>
                      ) : active ? (
                        <ChevronRight size={10} style={{ color: '#00C8FF', opacity: 0.6 }} />
                      ) : null}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User row */}
      <div style={{ borderTop: '1px solid rgba(0,196,255,0.06)', padding: 8, flexShrink: 0 }}>
        {collapsed ? (
          <div style={{
            width: 30, height: 30, borderRadius: 4,
            border: `1px solid ${roleColor}`,
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', fontSize: 10, fontWeight: 700, color: roleColor,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{initials}</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 4, flexShrink: 0,
              border: `1px solid ${roleColor}40`,
              background: `${roleColor}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: roleColor,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#D8EEFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'Guest'}
              </div>
              <div style={{ fontSize: 9.5, color: roleColor, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', fontWeight: 700 }}>
                {currentUser?.role?.toUpperCase() || 'VIEWER'}
              </div>
            </div>
            <button onClick={onLogout} title="Sign out"
              style={{ background: 'none', border: 'none', color: '#4E6E84', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FF3B5C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4E6E84')}>
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, mobileOpen, onMobileClose, onLogout }: SidebarProps) {
  return (
    <>
      <div className="sidebar hide-sm" style={{ width: collapsed ? 54 : 220 }}>
        <SidebarContent activePage={activePage} onNavigate={onNavigate} collapsed={collapsed} onToggle={onToggle} onLogout={onLogout} />
      </div>
      {mobileOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50 }} onClick={onMobileClose} />
          <div className="sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, zIndex: 60 }}>
            <SidebarContent activePage={activePage} onNavigate={onNavigate} collapsed={false} onToggle={onToggle} onMobileClose={onMobileClose} onLogout={onLogout} />
          </div>
        </>
      )}
    </>
  );
}
