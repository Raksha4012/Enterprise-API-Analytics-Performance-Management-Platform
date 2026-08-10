import { useState } from 'react';
import { Zap, Eye, EyeOff, ArrowRight, Shield, BarChart3, Brain, Check, AlertCircle, Clock, Code2 } from 'lucide-react';
import { useUsers } from '../context/UserContext';
import { UserRole } from '../components/RbacMatrix';

type Mode = 'login' | 'register' | 'forgot';

const ROLES: { id: UserRole; label: string; desc: string; color: string }[] = [
  { id: 'Developer', label: 'Developer', desc: 'API management, metrics & reports', color: '#2563EB' },
  { id: 'Viewer',    label: 'Viewer',    desc: 'Read-only access to dashboards',    color: '#94A3B8' },
];

const FEATURES = [
  { icon: BarChart3, title: '48M+ Requests Tracked', desc: 'Real-time observability across all endpoints' },
  { icon: Brain,     title: 'AI-Powered Forecasting', desc: 'Prophet, XGBoost, and Random Forest models' },
  { icon: Shield,    title: 'Anomaly Detection',      desc: 'Instant alerts for spikes and security events' },
];

const STATS = [
  { value: '247', label: 'APIs Monitored' },
  { value: '99.97%', label: 'Uptime SLA' },
  { value: '142ms', label: 'Avg Response' },
  { value: '96.4', label: 'Health Score' },
];

interface AuthPageProps { onLogin: () => void; }

export default function AuthPage({ onLogin }: AuthPageProps) {
  const { findByCredential, requestAccess, setCurrentUser, recordLogin } = useUsers();
  const [mode, setMode]                 = useState<Mode>('login');
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [loginError, setLoginError]     = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showRegPw, setShowRegPw]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [forgotSent, setForgotSent]     = useState(false);

  // Registration state
  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPassword, setRegPassword]   = useState('');
  const [company, setCompany]           = useState('');
  const [reqRole, setReqRole]           = useState<UserRole>('Developer');
  const [regError, setRegError]         = useState('');
  const [accessSubmitted, setAccessSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') { setForgotSent(true); return; }
    
    if (mode === 'register') {
      setRegError('');
      if (!firstName.trim() || !regEmail.trim() || !regPassword.trim()) {
        setRegError('Please fill in all required fields.');
        return;
      }
      if (regPassword.length < 6) {
        setRegError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const username = (firstName + (lastName ? '.' + lastName : '')).toLowerCase().replace(/[^a-z0-9.]/g, '');
        requestAccess({
          name: `${firstName} ${lastName}`.trim(),
          email: regEmail.trim(),
          username: username || regEmail.split('@')[0],
          password: regPassword,
          role: reqRole,
          department: company || 'Engineering',
        });
        setLoading(false);
        setAccessSubmitted(true);
      }, 1000);
      return;
    }

    setLoginError('');
    if (!identifier || !password) {
      setLoginError('Please enter your email/username and password.');
      return;
    }

    const authRes = findByCredential(identifier, password);

    if (authRes.status === 'invalid') {
      setLoginError('Invalid credentials or account does not exist.');
      return;
    }

    if (authRes.status === 'pending') {
      setLoginError('Access Pending: Your request is currently awaiting Admin approval.');
      return;
    }

    if (authRes.status === 'inactive') {
      setLoginError('Account Deactivated: Please contact your workspace administrator.');
      return;
    }

    if (authRes.status === 'success' && authRes.user) {
      setCurrentUser(authRes.user);
      recordLogin(authRes.user.id);
      setLoading(true);
      setTimeout(() => { setLoading(false); onLogin(); }, 1000);
    }
  };

  const loginWithDemo = (demoId: string, demoPw: string) => {
    setIdentifier(demoId);
    setPassword(demoPw);
    setLoginError('');
    const authRes = findByCredential(demoId, demoPw);

    if (authRes.status === 'invalid') {
      setLoginError('Invalid credentials or account does not exist.');
      return;
    }
    if (authRes.status === 'pending') {
      setLoginError('Access Pending: Your request is currently awaiting Admin approval.');
      return;
    }
    if (authRes.status === 'inactive') {
      setLoginError('Account Deactivated: Please contact your workspace administrator.');
      return;
    }
    if (authRes.status === 'success' && authRes.user) {
      setCurrentUser(authRes.user);
      recordLogin(authRes.user.id);
      setLoading(true);
      setTimeout(() => { setLoading(false); onLogin(); }, 600);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0B1120', overflow: 'hidden' }}>
      {/* Left panel */}
      <div
        className="hide-sm"
        style={{
          width: 520, flexShrink: 0, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #0F172A 0%, #0B1120 100%)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', padding: '36px 40px',
        }}
      >
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, position: 'relative' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #1d4ed8, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(37,99,235,0.4)',
          }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>ApiPulse</div>
            <div style={{ fontSize: 10, color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Enterprise Platform</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.18, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Full-stack API<br />
            <span style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              observability
            </span>
            <br />at enterprise scale.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 360 }}>
            Monitor, analyze, and optimize your entire API infrastructure with AI-powered insights and real-time anomaly detection.
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA',
              }}>
                <Icon size={15} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 1 }}>{title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-4)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{
              background: 'rgba(30,41,59,0.5)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-5)', marginTop: 'auto' }}>
          Role-Based Access Control (RBAC) · Admin Approval Required
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }} className="fade-in-up">
          {/* Mobile logo */}
          <div className="hide-md" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #1d4ed8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>ApiPulse Enterprise</div>
          </div>

          <div className="glass-card" style={{ padding: 32 }}>
            {mode === 'login' && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Welcome back
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-4)' }}>
                    Sign in to your enterprise workspace
                  </div>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label>Email or Username</label>
                    <input
                      type="text"
                      placeholder="admin or alex.chen@acme.com"
                      value={identifier}
                      onChange={e => { setIdentifier(e.target.value); setLoginError(''); }}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={() => setMode('forgot')}
                        style={{ fontSize: 12, color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                        style={{ paddingRight: 38 }}
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '10px 12px', borderRadius: 8,
                      background: loginError.includes('Pending') ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.10)',
                      border: loginError.includes('Pending') ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(239,68,68,0.20)',
                      color: loginError.includes('Pending') ? '#FBBF24' : '#F87171',
                      fontSize: 12, lineHeight: 1.5,
                    }}>
                      {loginError.includes('Pending') ? <Clock size={15} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />}
                      <div>{loginError}</div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: 42, fontSize: 14, fontWeight: 600, marginTop: 4, gap: 8 }}
                    disabled={loading}
                  >
                    {loading
                      ? <div style={{ width: 16, height: 16, borderTop: '2px solid white', borderRight: '2px solid rgba(255,255,255,0.3)', borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%' }} className="spin" />
                      : <><span>Sign In</span><ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                {/* Quick login hint for testing */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--text-4)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>One-Click Demo Logins:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                         onClick={() => loginWithDemo('admin', 'admin')}>
                      <span style={{ color: '#F87171', fontWeight: 700 }}>Admin:</span> admin
                    </div>
                    <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                         onClick={() => loginWithDemo('marcus.j', 'Dev@2026!')}>
                      <span style={{ color: '#60A5FA', fontWeight: 700 }}>Dev:</span> marcus.j
                    </div>
                    <div style={{ background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.25)', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                         onClick={() => loginWithDemo('david.park', 'View@2026!')}>
                      <span style={{ color: '#94A3B8', fontWeight: 700 }}>Viewer:</span> david.park
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '6px 9px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}
                         onClick={() => loginWithDemo('yuki.t', 'Dev@2026!')}>
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>Pending:</span> yuki.t
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-4)' }}>
                  Need workspace access?{' '}
                  <button onClick={() => setMode('register')}
                    style={{ color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Request access
                  </button>
                </div>
              </>
            )}

            {mode === 'register' && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Request Workspace Access
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-4)' }}>
                    All access requests require explicit approval from an Administrator.
                  </div>
                </div>

                {accessSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }} className="fade-in">
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: 'rgba(245,158,11,0.14)', border: '1.5px solid rgba(245,158,11,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px', color: '#FBBF24',
                    }}>
                      <Clock size={26} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
                      Access Request Pending Approval
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 20 }}>
                      Your request for <strong>{reqRole}</strong> access has been registered and is waiting for Admin approval. An administrator will review your account shortly.
                    </div>
                    <button
                      onClick={() => { setMode('login'); setAccessSubmitted(false); }}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label>First name *</label>
                        <input placeholder="Alex" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                      </div>
                      <div>
                        <label>Last name</label>
                        <input placeholder="Chen" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label>Work email *</label>
                      <input type="email" placeholder="you@company.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>

                    <div>
                      <label>Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showRegPw ? 'text' : 'password'}
                          placeholder="Create password (min 6 chars)"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          style={{ paddingRight: 38 }}
                          required
                        />
                        <button type="button" onClick={() => setShowRegPw(s => !s)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                          {showRegPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label>Company / Department</label>
                      <input placeholder="Acme Corporation (Platform)" value={company} onChange={e => setCompany(e.target.value)} />
                    </div>

                    {/* Requested Role selection */}
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Requested Role *</span>
                        <span style={{ fontSize: 11, color: '#60A5FA' }}>Requires Admin approval</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {ROLES.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setReqRole(r.id)}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                              border: `1px solid ${reqRole === r.id ? r.color + '70' : 'var(--border)'}`,
                              background: reqRole === r.id ? `${r.color}16` : 'rgba(15,23,42,0.6)',
                              color: reqRole === r.id ? r.color : 'var(--text-3)',
                              fontSize: 11.5, fontWeight: 700,
                              textAlign: 'center', transition: 'all 0.15s',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            }}
                          >
                            <span style={{ fontSize: 10 }}>
                              {r.id === 'Developer' ? <Code2 size={12} /> : <Eye size={12} />}
                            </span>
                            {r.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                        {ROLES.find(r => r.id === reqRole)?.desc}
                      </div>
                    </div>

                    {regError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', color: '#F87171', fontSize: 12 }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        {regError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: 42, fontWeight: 600, marginTop: 6 }}
                      disabled={loading}
                    >
                      {loading
                        ? <div style={{ width: 16, height: 16, borderTop: '2px solid white', borderRight: '2px solid rgba(255,255,255,0.3)', borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%' }} className="spin" />
                        : 'Submit Access Request'
                      }
                    </button>
                  </form>
                )}

                {!accessSubmitted && (
                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-4)' }}>
                    Already have access?{' '}
                    <button onClick={() => setMode('login')} style={{ color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign in</button>
                  </div>
                )}
              </>
            )}

            {mode === 'forgot' && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Reset Password</div>
                  <div style={{ fontSize: 13, color: 'var(--text-4)' }}>We'll send a reset link to your email</div>
                </div>
                {forgotSent ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Check size={24} style={{ color: '#22C55E' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Check your inbox</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-4)', marginBottom: 20 }}>Reset link sent to your email address</div>
                    <button onClick={() => { setMode('login'); setForgotSent(false); }} className="btn btn-secondary" style={{ width: '100%' }}>Back to sign in</button>
                  </div>
                ) : (
                  <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label>Email address</label><input type="email" placeholder="you@company.com" required /></div>
                    <button type="submit" className="btn btn-primary" style={{ height: 42, fontWeight: 600 }}>Send Reset Link</button>
                    <button type="button" onClick={() => setMode('login')} className="btn btn-secondary" style={{ height: 38 }}>Back to sign in</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
