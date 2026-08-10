import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, UserCheck, UserX, X,
  ChevronUp, ChevronDown, ChevronsUpDown, Eye, EyeOff,
  Users, Crown, Code2, SlidersHorizontal, Filter,
  CheckCircle2, Clock, XCircle, Building2, Check,
} from 'lucide-react';
import { useUsers, AppUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import RbacMatrix from '../components/RbacMatrix';

const DEPARTMENTS = ['Platform', 'Payments', 'Commerce', 'Analytics', 'Data', 'Security', 'Search', 'Operations', 'DevOps', 'Infrastructure'];
const ROLES = ['Admin', 'Developer', 'Viewer'] as const;
const PAGE_SIZE = 8;

type SortKey = 'name' | 'role' | 'department' | 'status' | 'lastLogin' | 'apis';
type SortDir = 'asc' | 'desc';

const ROLE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Admin:     { icon: <Crown size={11} />,  color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  Developer: { icon: <Code2 size={11} />,  color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
  Viewer:    { icon: <Eye size={11} />,    color: '#94A3B8', bg: 'rgba(100,116,139,0.10)'},
};

const DEPT_COLORS: Record<string, string> = {
  Platform: '#60A5FA', Payments: '#4ADE80', Commerce: '#FB923C', Analytics: '#A78BFA',
  Data: '#34D399', Security: '#F87171', Search: '#FBBF24', Operations: '#38BDF8',
  DevOps: '#E879F9', Infrastructure: '#94A3B8',
};

const STATUS_META = {
  active:   { icon: <CheckCircle2 size={12} />, color: '#22C55E', bg: 'rgba(34,197,94,0.10)',    label: 'Active'   },
  inactive: { icon: <XCircle size={12} />,      color: '#94A3B8', bg: 'rgba(100,116,139,0.10)',  label: 'Inactive' },
  pending:  { icon: <Clock size={12} />,        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   label: 'Pending Approval' },
};

function avatarGradient(name: string) {
  const gradients = [
    'linear-gradient(135deg,#1d4ed8,#7c3aed)',
    'linear-gradient(135deg,#047857,#0891b2)',
    'linear-gradient(135deg,#b45309,#dc2626)',
    'linear-gradient(135deg,#7c3aed,#db2777)',
    'linear-gradient(135deg,#0891b2,#1d4ed8)',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

interface ModalState {
  mode: 'add' | 'edit' | 'delete' | null;
  user?: AppUser;
}

interface FormData {
  name: string; email: string; username: string; password: string;
  role: 'Admin' | 'Developer' | 'Viewer'; department: string; status: 'active' | 'inactive' | 'pending';
}

const emptyForm = (): FormData => ({
  name: '', email: '', username: '', password: '',
  role: 'Developer', department: 'Platform', status: 'active',
});

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} style={{ color: 'var(--text-5)', marginLeft: 3 }} />;
  return dir === 'asc'
    ? <ChevronUp size={11} style={{ color: '#60A5FA', marginLeft: 3 }} />
    : <ChevronDown size={11} style={{ color: '#60A5FA', marginLeft: 3 }} />;
}

export default function UserManagement() {
  const { users, currentUser, addUser, updateUser, deleteUser, approveUser, rejectUser } = useUsers();
  const { toast } = useToast();

  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter]     = useState('All');
  const [sortKey, setSortKey]           = useState<SortKey>('name');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const [page, setPage]                 = useState(1);
  const [modal, setModal]               = useState<ModalState>({ mode: null });
  const [form, setForm]                 = useState<FormData>(emptyForm());
  const [showPw, setShowPw]             = useState(false);
  const [formError, setFormError]       = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return users.filter(u =>
      (!s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.username.toLowerCase().includes(s) || u.department.toLowerCase().includes(s)) &&
      (roleFilter === 'All' || u.role === roleFilter) &&
      (statusFilter === 'All' || u.status === statusFilter) &&
      (deptFilter === 'All' || u.department === deptFilter)
    ).sort((a, b) => {
      let va = String(a[sortKey] ?? '');
      let vb = String(b[sortKey] ?? '');
      if (sortKey === 'apis') { va = String(a.apis); vb = String(b.apis); return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va); }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [users, search, roleFilter, statusFilter, deptFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
    setPage(1);
  };

  const openAdd = () => {
    setForm(emptyForm());
    setFormError('');
    setShowPw(false);
    setModal({ mode: 'add' });
  };

  const openEdit = (user: AppUser) => {
    setForm({ name: user.name, email: user.email, username: user.username, password: user.password, role: user.role, department: user.department, status: user.status });
    setFormError('');
    setShowPw(false);
    setModal({ mode: 'edit', user });
  };

  const openDelete = (user: AppUser) => setModal({ mode: 'delete', user });
  const closeModal = () => setModal({ mode: null });

  const validateForm = () => {
    if (!form.name.trim())     return 'Full name is required.';
    if (!form.email.trim())    return 'Email is required.';
    if (!form.username.trim()) return 'Username is required.';
    if (!form.password.trim()) return 'Password is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    const dupEmail = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && (modal.mode === 'add' || u.id !== modal.user?.id));
    if (dupEmail) return 'A user with this email already exists.';
    const dupUser = users.find(u => u.username.toLowerCase() === form.username.toLowerCase() && (modal.mode === 'add' || u.id !== modal.user?.id));
    if (dupUser) return 'This username is already taken.';
    return '';
  };

  const submitForm = () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    if (modal.mode === 'add') {
      addUser({ name: form.name, email: form.email, username: form.username, password: form.password, role: form.role, department: form.department, status: form.status });
      toast('success', 'User created', `${form.name} can now log in with their credentials.`);
    } else if (modal.mode === 'edit' && modal.user) {
      updateUser(modal.user.id, { name: form.name, email: form.email, username: form.username, password: form.password, role: form.role, department: form.department, status: form.status });
      toast('info', 'User updated', `${form.name}'s profile has been updated.`);
    }
    closeModal();
    setPage(1);
  };

  const confirmDelete = () => {
    if (!modal.user) return;
    deleteUser(modal.user.id);
    toast('warning', 'User removed', `${modal.user.name} has been deleted.`);
    closeModal();
  };

  const handleApprove = (user: AppUser) => {
    approveUser(user.id);
    toast('success', 'Access Request Approved', `${user.name} (${user.role}) is now active and can sign in.`);
  };

  const handleReject = (user: AppUser) => {
    rejectUser(user.id);
    toast('warning', 'Access Request Rejected', `Request for ${user.name} was rejected and removed.`);
  };

  const toggleStatus = (user: AppUser) => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { status: next });
    toast(next === 'active' ? 'success' : 'warning', next === 'active' ? `${user.name} activated` : `${user.name} deactivated`, '');
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: pendingUsers.length,
    admins: users.filter(u => u.role === 'Admin').length,
    developers: users.filter(u => u.role === 'Developer').length,
    viewers: users.filter(u => u.role === 'Viewer').length,
  };

  const depts = [...new Set(users.map(u => u.department))];

  const pf = (k: keyof typeof form, v: string) => { setForm(prev => ({ ...prev, [k]: v })); setFormError(''); };

  return (
    <div className="page stagger">

      {/* ── Pending Access Requests Admin Banner ─────────────────────── */}
      {pendingUsers.length > 0 && (
        <div className="glass-card scale-in" style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24',
              }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                  Pending Access Requests ({pendingUsers.length})
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  New user access requests require explicit Admin approval.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#FBBF24', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
              ADMIN REVIEW REQUIRED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingUsers.map(pu => (
              <div key={pu.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: avatarGradient(pu.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12,
                  }}>
                    {pu.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                      {pu.name}
                      <span style={{ marginLeft: 8, fontSize: 11, color: ROLE_META[pu.role]?.color, background: ROLE_META[pu.role]?.bg, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                        {pu.role} Requested
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'monospace' }}>
                      {pu.email} · {pu.department} · Registered {pu.createdAt}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApprove(pu)}
                    className="btn btn-primary"
                    style={{ height: 32, padding: '0 12px', fontSize: 12, gap: 5, background: '#22C55E', borderColor: '#16A34A' }}
                  >
                    <Check size={13} /> Approve Access
                  </button>
                  <button
                    onClick={() => handleReject(pu)}
                    className="btn btn-danger"
                    style={{ height: 32, padding: '0 10px', fontSize: 12, gap: 5 }}
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat row ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
        {[
          { label: 'Total Users',  value: stats.total,      color: '#60A5FA', icon: <Users size={14} /> },
          { label: 'Active Users', value: stats.active,     color: '#22C55E', icon: <CheckCircle2 size={14} /> },
          { label: 'Pending Req.', value: stats.pending,    color: '#F59E0B', icon: <Clock size={14} /> },
          { label: 'Admins',       value: stats.admins,     color: '#F87171', icon: <Crown size={14} /> },
          { label: 'Developers',   value: stats.developers, color: '#60A5FA', icon: <Code2 size={14} /> },
          { label: 'Viewers',      value: stats.viewers,    color: '#94A3B8', icon: <Eye size={14} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card hover-lift" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '8px 8px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{label}</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
          <input
            placeholder="Search name, email, username, department…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>
        <button
          className="btn btn-secondary"
          style={{ gap: 6, position: 'relative' }}
          onClick={() => setShowFilters(f => !f)}
        >
          <Filter size={13} /> Filters
          {(roleFilter !== 'All' || statusFilter !== 'All' || deptFilter !== 'All') && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' }} />
          )}
        </button>
        <button
          className="btn btn-secondary"
          style={{ gap: 6 }}
          onClick={() => {
            const headers = ['id', 'name', 'email', 'username', 'role', 'department', 'status', 'lastLogin', 'apis', 'createdAt'];
            const rows = users.map(u => [
              u.id, `"${u.name}"`, u.email, u.username, u.role, u.department, u.status, `"${u.lastLogin}"`, u.apis, u.createdAt
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'users.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast('success', 'CSV Exported', 'Downloaded users.csv successfully.');
          }}
        >
          Export CSV
        </button>
        {currentUser?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      {/* ── Filter pills ─────────────────────────────────────────────── */}
      {showFilters && (
        <div className="glass-card scale-in" style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={12} style={{ color: 'var(--text-4)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>Filter by:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-5)', marginBottom: 0 }}>Role</label>
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 120 }}>
              {['All', ...ROLES].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-5)', marginBottom: 0 }}>Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 120 }}>
              {['All', 'active', 'inactive', 'pending'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-5)', marginBottom: 0 }}>Department</label>
            <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }} style={{ height: 30, fontSize: 12, padding: '0 8px', minWidth: 140 }}>
              <option>All</option>
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {(roleFilter !== 'All' || statusFilter !== 'All' || deptFilter !== 'All') && (
            <button
              className="btn btn-secondary"
              style={{ height: 28, fontSize: 11, padding: '0 10px' }}
              onClick={() => { setRoleFilter('All'); setStatusFilter('All'); setDeptFilter('All'); setPage(1); }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{filtered.length}</span> users found
            {search && <span style={{ color: 'var(--text-4)' }}> for "{search}"</span>}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-5)' }}>
            Page {page} of {totalPages}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>User <SortIcon col="name" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => toggleSort('role')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>Role <SortIcon col="role" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => toggleSort('department')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>Department <SortIcon col="department" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>Status <SortIcon col="status" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => toggleSort('apis')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>APIs <SortIcon col="apis" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th onClick={() => toggleSort('lastLogin')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>Last Login <SortIcon col="lastLogin" sortKey={sortKey} dir={sortDir} /></span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>
                    <Users size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                    No users match the current filters.
                  </td>
                </tr>
              ) : paged.map(user => {
                const rm = ROLE_META[user.role];
                const sm = STATUS_META[user.status as keyof typeof STATUS_META] ?? STATUS_META.inactive;
                const dcolor = DEPT_COLORS[user.department] ?? '#94A3B8';
                return (
                  <tr key={user.id} style={{ transition: 'background 0.12s' }}>
                    <td style={{ minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: avatarGradient(user.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                        }}>
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-5)', fontFamily: 'monospace' }}>{user.username}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-5)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: rm.bg, color: rm.color, fontSize: 11.5, fontWeight: 600 }}>
                        {rm.icon} {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: `${dcolor}18`, color: dcolor, fontSize: 11.5, fontWeight: 500 }}>
                        <Building2 size={10} /> {user.department}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: sm.bg, color: sm.color, fontSize: 11.5, fontWeight: 500 }}>
                        {sm.icon} {sm.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 13 }}>{user.apis}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-5)', marginLeft: 3 }}>APIs</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{user.lastLogin}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {user.status === 'pending' ? (
                          <button
                            className="btn btn-primary"
                            style={{ height: 26, padding: '0 8px', fontSize: 11, gap: 4, background: '#22C55E', borderColor: '#16A34A' }}
                            onClick={() => handleApprove(user)}
                          >
                            <Check size={11} /> Approve
                          </button>
                        ) : (
                          <>
                            <ActionBtn icon={<Edit2 size={12} />} color="#FBB43A" bg="rgba(245,158,11,0.12)" title="Edit user" onClick={() => openEdit(user)} />
                            <ActionBtn
                              icon={user.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                              color={user.status === 'active' ? '#F87171' : '#4ADE80'}
                              bg={user.status === 'active' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'}
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                              onClick={() => toggleStatus(user)}
                            />
                          </>
                        )}
                        <ActionBtn icon={<Trash2 size={12} />} color="#F87171" bg="rgba(239,68,68,0.10)" title="Delete user" onClick={() => openDelete(user)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <PageBtn label="←" disabled={page === 1}       onClick={() => setPage(p => p - 1)} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PageBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(p)} />
              ))}
              <PageBtn label="→" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {/* ── RBAC Permissions Matrix Display ────────────────────────── */}
      <RbacMatrix highlightRole={currentUser?.role} />

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {(modal.mode === 'add' || modal.mode === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel scale-in" style={{ width: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(37,99,235,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {modal.mode === 'add' ? <Plus size={15} style={{ color: '#60A5FA' }} /> : <Edit2 size={14} style={{ color: '#60A5FA' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                    {modal.mode === 'add' ? 'Add New User' : 'Edit User'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-5)' }}>
                    {modal.mode === 'add' ? 'User will be able to log in immediately.' : `Editing ${modal.user?.name}`}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={closeModal}><X size={14} /></button>
            </div>

            {/* Form body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Full Name <Req /></label>
                  <input placeholder="Alexandra Chen" value={form.name} onChange={e => pf('name', e.target.value)} />
                </div>
                <div>
                  <label>Username <Req /></label>
                  <input placeholder="alex.chen" value={form.username} onChange={e => pf('username', e.target.value)} />
                </div>
              </div>

              <div>
                <label>Email Address <Req /></label>
                <input type="email" placeholder="alex.chen@acme.com" value={form.email} onChange={e => pf('email', e.target.value)} />
              </div>

              <div>
                <label>Password <Req /></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder={modal.mode === 'edit' ? 'Leave unchanged or enter new password' : 'Minimum 6 characters'}
                    value={form.password}
                    onChange={e => pf('password', e.target.value)}
                    style={{ paddingRight: 38 }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Role</label>
                  <select value={form.role} onChange={e => pf('role', e.target.value)}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <select value={form.department} onChange={e => pf('department', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label>Account Status</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['active', 'inactive', 'pending'] as const).map(s => {
                    const sm = STATUS_META[s];
                    const sel = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => pf('status', s)}
                        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel ? sm.color + '60' : 'var(--border)'}`, background: sel ? sm.bg : 'rgba(15,23,42,0.6)', color: sel ? sm.color : 'var(--text-3)', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {sm.icon} {sm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', color: '#F87171', fontSize: 12 }}>
                  <XCircle size={13} style={{ flexShrink: 0 }} /> {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>
                {modal.mode === 'add' ? <><Plus size={13} /> Create User</> : <><Edit2 size={13} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
      {modal.mode === 'delete' && modal.user && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel scale-in" style={{ width: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={22} style={{ color: '#F87171' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Delete User</div>
              <div style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--text-2)' }}>{modal.user.name}</strong>? This action cannot be undone.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, color, bg, title, onClick }: { icon: React.ReactNode; color: string; bg: string; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, transition: 'opacity 0.15s, transform 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1';    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';   }}
    >
      {icon}
    </button>
  );
}

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        minWidth: 30, height: 30, borderRadius: 7, border: active ? '1px solid rgba(37,99,235,0.5)' : '1px solid var(--border)',
        background: active ? 'rgba(37,99,235,0.18)' : 'rgba(30,41,59,0.6)', color: active ? '#60A5FA' : 'var(--text-3)',
        fontSize: 12, fontWeight: active ? 700 : 400, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function Req() {
  return <span style={{ color: '#F87171', marginLeft: 2 }}>*</span>;
}
