import { useState } from 'react';
import { Bell, Shield, User, Settings as SettingsIcon, Globe, Zap, Save, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TABS = [
  { id: 'profile',       label: 'Profile',        icon: <User size={14} /> },
  { id: 'security',      label: 'Security',        icon: <Shield size={14} /> },
  { id: 'notifications', label: 'Notifications',   icon: <Bell size={14} /> },
  { id: 'rate-limiting', label: 'Rate Limiting',   icon: <Zap size={14} /> },
  { id: 'integrations',  label: 'Integrations',    icon: <Globe size={14} /> },
  { id: 'theme',         label: 'Theme',           icon: <SettingsIcon size={14} /> },
];

const INTEGRATIONS = [
  { name:'Slack',          desc:'Alerts and reports to channels',              connected:true,  icon:'💬' },
  { name:'PagerDuty',      desc:'Escalate critical incidents to on-call',      connected:true,  icon:'🔔' },
  { name:'Datadog',        desc:'Forward metrics to Datadog APM',              connected:false, icon:'🐶' },
  { name:'Grafana',        desc:'Push to Grafana dashboards',                  connected:false, icon:'📊' },
  { name:'AWS CloudWatch', desc:'Export logs to CloudWatch Logs',              connected:true,  icon:'☁️' },
  { name:'Webhook',        desc:'Custom webhook endpoint',                     connected:false, icon:'🔗' },
];

const NOTIF_PREFS = [
  { label:'API Down Alert',     desc:'Immediately when an API goes Down',                email:true,  push:true,  slack:true  },
  { label:'High Error Rate',    desc:'Error rate exceeds SLA threshold',                email:true,  push:true,  slack:true  },
  { label:'Anomaly Detected',   desc:'Traffic spikes or suspicious activity',           email:true,  push:false, slack:true  },
  { label:'Daily Digest',       desc:'Previous day performance summary',               email:true,  push:false, slack:false },
  { label:'Weekly Report',      desc:'Auto-generated weekly analytics report',          email:true,  push:false, slack:true  },
  { label:'New User Joined',    desc:'Team member accepts invitation',                 email:false, push:false, slack:true  },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div className="toggle" onClick={onChange}>
      <div className={`toggle-track${on ? ' on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

const THEMES = [
  { l: 'Dark',  bg: '#0B1120', vars: { '--bg': '#0B1120', '--surface': 'rgba(15,23,42,0.8)', '--text-1': '#F1F5F9', '--text-2': '#CBD5E1', '--text-3': '#94A3B8', '--text-4': '#64748B', '--text-5': '#475569' } },
  { l: 'Light', bg: '#F8FAFC', vars: { '--bg': '#F8FAFC', '--surface': 'rgba(255,255,255,0.85)', '--text-1': '#0F172A', '--text-2': '#1E293B', '--text-3': '#334155', '--text-4': '#64748B', '--text-5': '#94A3B8' } },
];

const ACCENT_COLORS = ['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2'];
const DENSITY_MAP = { Compact: '12px', Default: '16px', Comfortable: '20px' };

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab]       = useState('profile');
  const [notifPrefs, setNotifPrefs]     = useState(NOTIF_PREFS);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [accent, setAccent]             = useState('#2563EB');
  const [themeMode, setThemeMode]       = useState('Dark');
  const [density, setDensity]           = useState('Default');
  const [saved, setSaved]               = useState(false);

  const applyAccent = (color: string) => {
    setAccent(color);
    const root = document.documentElement;
    root.style.setProperty('--primary', color);
    // Derive hover shade (slightly lighter)
    root.style.setProperty('--primary-hover', color + 'CC');
    // Update active nav item glow
    root.style.setProperty('--nav-active-color', color);
  };

  const applyTheme = (mode: string) => {
    setThemeMode(mode);
    const found = THEMES.find(t => t.l === mode);
    if (!found) return;
    const root = document.documentElement;
    Object.entries(found.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  };

  const applyDensity = (d: string) => {
    setDensity(d);
    const pad = DENSITY_MAP[d as keyof typeof DENSITY_MAP];
    document.documentElement.style.setProperty('--density-pad', pad);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast('success', 'Settings saved', 'Theme and preferences applied');
  };

  const toggleNotif = (i: number, field: 'email'|'push'|'slack') => {
    setNotifPrefs(p => p.map((n, j) => j === i ? { ...n, [field]: !n[field as keyof typeof n] } : n));
  };

  return (
    <div className="page" style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
      {/* Tab rail */}
      <div className="glass-card" style={{ padding: 8, width: 190, flexShrink: 0, alignSelf: 'flex-start' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-item${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ borderRadius: 8 }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
        {activeTab === 'profile' && (
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-title" style={{ marginBottom: 20 }}>Personal Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white' }}>AC</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Alexandra Chen</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 6 }}>Platform Administrator</div>
                <button className="btn btn-secondary" style={{ height: 28, fontSize: 11 }}>Change Photo</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['First Name','Alexandra'],['Last Name','Chen'],['Email','alex.chen@acme.com'],['Company','Acme Corporation'],['Job Title','Platform Engineer Lead'],['Timezone','UTC−8 (PST)']].map(([l,v]) => (
                <div key={l}><label>{l}</label><input defaultValue={v} /></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>Change Password</div>
              <div style={{ display: 'grid', gap: 12, maxWidth: 380 }}>
                {['Current Password','New Password','Confirm New Password'].map(l => (
                  <div key={l}><label>{l}</label><input type="password" placeholder="••••••••" /></div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>Two-Factor Authentication</div>
              {[{label:'Authenticator App (TOTP)',enabled:true},{label:'SMS / Text Message',enabled:false},{label:'Hardware Key (FIDO2)',enabled:false}].map(({ label, enabled }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{label}</div>
                    {enabled && <div style={{ fontSize:11, color:'#22C55E', marginTop:2 }}>Enabled</div>}
                  </div>
                  <button className={`btn ${enabled?'btn-danger':'btn-success'}`} style={{ height:30, fontSize:11 }}>
                    {enabled?'Disable':'Enable'}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>Active Sessions</div>
              {[{d:'MacBook Pro — Chrome 127',ip:'10.0.1.42',t:'Current session',c:true},{d:'iPhone 15 — Safari 17',ip:'10.0.1.89',t:'3 hours ago',c:false},{d:'Windows PC — Edge 125',ip:'192.168.1.12',t:'Yesterday',c:false}].map(({d,ip,t,c}) => (
                <div key={d} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, color:'var(--text-2)' }}>{d}</div>
                    <div style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>{ip} · {t}</div>
                  </div>
                  {c ? <span style={{ fontSize:11, color:'#22C55E', fontWeight:600 }}>● Active</span> : <button className="btn btn-danger" style={{ height:28, fontSize:11 }}>Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div className="section-title">Notification Preferences</div>
              <div style={{ display:'flex', gap:20, fontSize:11, color:'var(--text-4)' }}>
                {['Email','Push','Slack'].map(l => <span key={l} style={{ width:40, textAlign:'center' }}>{l}</span>)}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {notifPrefs.map((n, i) => (
                <div key={n.label} style={{ display:'flex', alignItems:'center', padding:'12px 14px', background:'rgba(11,17,32,0.4)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{n.label}</div>
                    <div style={{ fontSize:11, color:'var(--text-4)', marginTop:1 }}>{n.desc}</div>
                  </div>
                  <div style={{ display:'flex', gap:20 }}>
                    {(['email','push','slack'] as const).map(f => (
                      <div key={f} style={{ width:40, display:'flex', justifyContent:'center' }}>
                        <Toggle on={n[f]} onChange={() => toggleNotif(i, f)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rate-limiting' && (
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-title" style={{ marginBottom: 20 }}>API Rate Limiting</div>
            <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:480 }}>
              {[
                { label:'Global Request Limit', val:'10,000', unit:'req/min', desc:'Platform-wide ceiling' },
                { label:'Per-Client Limit',      val:'1,000',  unit:'req/min', desc:'Default per API key' },
                { label:'Burst Allowance',       val:'500',    unit:'requests', desc:'Short burst above limit' },
                { label:'Rate Limit Window',     val:'60',     unit:'seconds', desc:'Rolling window duration' },
              ].map(({ label, val, unit, desc }) => (
                <div key={label}>
                  <label>{label}</label>
                  <div style={{ fontSize:11, color:'var(--text-5)', marginBottom:6 }}>{desc}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input defaultValue={val} style={{ width:140 }} />
                    <span style={{ fontSize:12, color:'var(--text-4)' }}>{unit}</span>
                  </div>
                </div>
              ))}
              <div>
                <label>Throttle Strategy</label>
                <select style={{ width:200 }}>
                  <option>Return HTTP 429</option>
                  <option>Queue Request</option>
                  <option>Drop Silently</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-title" style={{ marginBottom: 18 }}>External Integrations</div>
            <div className="grid-auto">
              {integrations.map((ig, i) => (
                <div
                  key={ig.name}
                  className="glass"
                  style={{ borderRadius: 12, padding: 16, border: `1px solid ${ig.connected ? 'rgba(34,197,94,0.18)' : 'var(--border)'}` }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:24 }}>{ig.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)' }}>{ig.name}</div>
                      {ig.connected && <span style={{ fontSize:10, color:'#22C55E', fontWeight:700 }}>● CONNECTED</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--text-4)', marginBottom:12, lineHeight:1.45 }}>{ig.desc}</div>
                  <button
                    className={`btn ${ig.connected ? 'btn-danger' : 'btn-primary'}`}
                    style={{ height:30, fontSize:11.5, width:'100%' }}
                    onClick={() => setIntegrations(prev => prev.map((x,j) => j===i ? {...x, connected:!x.connected} : x))}
                  >
                    {ig.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="glass-card" style={{ padding: 24, display:'flex', flexDirection:'column', gap:22 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Color Theme</div>
              <div style={{ fontSize:11.5, color:'var(--text-4)', marginBottom:12 }}>Changes apply instantly across the entire platform</div>
              <div style={{ display:'flex', gap:12 }}>
                {THEMES.map(({ l, bg }) => {
                  const active = themeMode === l;
                  return (
                    <div key={l} onClick={() => applyTheme(l)}
                      style={{ borderRadius:10, overflow:'hidden', border:`2px solid ${active ? accent : 'var(--border)'}`, cursor:'pointer', width:90, transition:'border-color 0.2s', boxShadow: active ? `0 0 14px ${accent}40` : 'none' }}>
                      <div style={{ height:48, background: bg }} />
                      <div style={{ padding:'6px 0', textAlign:'center', fontSize:11.5, color: active ? accent : 'var(--text-3)', fontWeight: active ? 700 : 400 }}>{l}</div>
                    </div>
                  );
                })}
                <div onClick={() => {
                    const dark = THEMES[0];
                    const light = THEMES[1];
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    applyTheme(prefersDark ? 'Dark' : 'Light');
                  }}
                  style={{ borderRadius:10, overflow:'hidden', border:`2px solid ${themeMode==='Auto'?accent:'var(--border)'}`, cursor:'pointer', width:90 }}>
                  <div style={{ height:48, background:'linear-gradient(135deg, #0B1120 50%, #F8FAFC 50%)' }} />
                  <div style={{ padding:'6px 0', textAlign:'center', fontSize:11.5, color:'var(--text-3)' }}>Auto</div>
                </div>
              </div>
            </div>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Accent Color</div>
              <div style={{ fontSize:11.5, color:'var(--text-4)', marginBottom:12 }}>Updates buttons, highlights, and active states</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {ACCENT_COLORS.map(c => (
                  <div key={c} onClick={() => applyAccent(c)}
                    style={{ width:34, height:34, borderRadius:'50%', background:c, cursor:'pointer', border:`3px solid ${accent===c?'white':'transparent'}`, boxShadow:accent===c?`0 0 14px ${c}`:undefined, transition:'all 0.2s', position:'relative' }}>
                    {accent === c && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Density</div>
              <div style={{ fontSize:11.5, color:'var(--text-4)', marginBottom:10 }}>Controls card padding and spacing throughout the UI</div>
              <div style={{ display:'flex', gap:8 }}>
                {(['Compact','Default','Comfortable'] as const).map(d => {
                  const active = density === d;
                  return (
                    <button key={d} onClick={() => applyDensity(d)}
                      style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${active ? accent : 'var(--border)'}`, background: active ? `${accent}18` : 'rgba(15,23,42,0.6)', color: active ? accent : 'var(--text-3)', fontSize:12, cursor:'pointer', fontWeight: active ? 600 : 400, transition:'all 0.15s' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-primary" onClick={save} style={{ gap:7 }}>
            {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
