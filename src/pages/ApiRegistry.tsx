import { useState, useMemo } from 'react';
import {
  Search, Plus, Filter, ChevronUp, ChevronDown, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, X, Database, LayoutGrid, List,
  Zap, AlertTriangle, CheckCircle2, Activity, Clock, TrendingUp, Copy,
} from 'lucide-react';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { apis as SEED } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useUsers } from '../context/UserContext';
import PermissionGateModal from '../components/PermissionGateModal';

type ApiStatus = 'healthy' | 'warning' | 'slow' | 'down' | 'error';

interface ApiEntry {
  id: number;
  name: string;
  endpoint: string;
  method: string;
  version: string;
  owner: string;
  status: ApiStatus;
  category: string;
  description: string;
  requests: number;
  errorRate: number;
  avgResponse: number;
  uptime: number;
}

const METHODS   = ['All', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const STATUSES  = ['All', 'healthy', 'warning', 'slow', 'down'];
const CATEGORIES = ['Security', 'Finance', 'Commerce', 'Analytics', 'Messaging', 'Users', 'Search', 'Operations', 'Other'];
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const PAGE_SIZE = 8;

type SortField = 'name' | 'method' | 'status' | 'requests' | 'errorRate' | 'avgResponse' | 'uptime';

const STATUS_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  healthy: { color: '#00E599', bg: 'rgba(0,229,153,0.08)',  icon: <CheckCircle2 size={11} /> },
  warning: { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', icon: <AlertTriangle size={11} /> },
  slow:    { color: '#FF8C20', bg: 'rgba(255,140,32,0.08)', icon: <Clock size={11} /> },
  down:    { color: '#FF3B5C', bg: 'rgba(255,59,92,0.08)',  icon: <Activity size={11} /> },
  error:   { color: '#FF3B5C', bg: 'rgba(255,59,92,0.08)',  icon: <AlertTriangle size={11} /> },
};

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  GET:    { color: '#00E599', bg: 'rgba(0,229,153,0.08)'  },
  POST:   { color: '#00C8FF', bg: 'rgba(0,200,255,0.08)'  },
  PUT:    { color: '#FFB020', bg: 'rgba(255,176,32,0.08)' },
  PATCH:  { color: '#BF7FFF', bg: 'rgba(191,127,255,0.08)'},
  DELETE: { color: '#FF3B5C', bg: 'rgba(255,59,92,0.08)'  },
};

interface FormData {
  name: string; endpoint: string; method: string; version: string;
  owner: string; status: ApiStatus; category: string; description: string;
}

const emptyForm = (): FormData => ({
  name: '', endpoint: '', method: 'GET', version: 'v1.0.0',
  owner: '', status: 'healthy', category: 'Other', description: '',
});

function SortIco({ f, sortField, sortDir }: { f: string; sortField: string; sortDir: string }) {
  if (f !== sortField) return <ChevronDown size={10} style={{ opacity: 0.2, marginLeft: 2 }} />;
  return sortDir === 'asc'
    ? <ChevronUp size={10} style={{ color: '#00C8FF', marginLeft: 2 }} />
    : <ChevronDown size={10} style={{ color: '#00C8FF', marginLeft: 2 }} />;
}

interface ApiRegistryProps { onViewDetail: (id: number) => void; }

export default function ApiRegistry({ onViewDetail }: ApiRegistryProps) {
  const { toast } = useToast();
  const { currentUser, canAccess } = useUsers();
  const [gateOpen, setGateOpen] = useState(false);
  const [apiList, setApiList] = useState<ApiEntry[]>(() => {
    try {
      const saved = localStorage.getItem('apipulse_apis');
      return saved ? JSON.parse(saved) : SEED as ApiEntry[];
    } catch {
      return SEED as ApiEntry[];
    }
  });

  const generateApisCsv = (apis: ApiEntry[]) => {
    const headers = ['id', 'name', 'endpoint', 'method', 'version', 'owner', 'status', 'category', 'description', 'requests', 'errorRate', 'avgResponse', 'uptime'];
    const rows = apis.map(a => [
      a.id, `"${a.name}"`, a.endpoint, a.method, a.version, `"${a.owner}"`, a.status, a.category, `"${a.description.replace(/"/g, '""')}"`, a.requests, a.errorRate, a.avgResponse, a.uptime
    ]);
    return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  };

  const saveAndExportCsv = (newList: ApiEntry[], filename = 'apis.csv', download = false) => {
    try {
      localStorage.setItem('apipulse_apis', JSON.stringify(newList));
      const csvStr = generateApisCsv(newList);
      localStorage.setItem('apipulse_apis_csv', csvStr);

      fetch('/api/sync-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'data/apis.csv', csvContent: csvStr }),
      }).catch(err => console.error('Disk CSV sync error:', err));

      if (download) {
        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvStr);
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('CSV export failed:', e);
    }
  };

  const [search, setSearch]   = useState('');
  const [method, setMethod]   = useState('All');
  const [status, setStatus]   = useState('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage]       = useState(1);
  const [view, setView]       = useState<'table' | 'grid'>('table');
  const [modal, setModal]     = useState<'add' | 'edit' | 'delete' | null>(null);
  const [editTarget, setEditTarget] = useState<ApiEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiEntry | null>(null);
  const [form, setForm]       = useState<FormData>(emptyForm());
  const [formError, setFormError] = useState('');
  const [copied, setCopied]   = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return apiList.filter(a =>
      (!s || a.name.toLowerCase().includes(s) || a.endpoint.toLowerCase().includes(s) || a.owner.toLowerCase().includes(s) || a.category.toLowerCase().includes(s)) &&
      (method === 'All' || a.method === method) &&
      (status === 'All' || a.status === status)
    );
  }, [apiList, search, method, status]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = (a as any)[sortField] ?? '', bv = (b as any)[sortField] ?? '';
    if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
    setPage(1);
  };

  const openAdd = () => {
    if (!canAccess('apis')) { setGateOpen(true); return; }
    setForm(emptyForm()); setFormError(''); setModal('add');
  };
  const openEdit = (api: ApiEntry) => {
    if (!canAccess('apis')) { setGateOpen(true); return; }
    setEditTarget(api); setForm({ name: api.name, endpoint: api.endpoint, method: api.method, version: api.version, owner: api.owner, status: api.status, category: api.category, description: api.description }); setFormError(''); setModal('edit');
  };
  const openDelete = (api: ApiEntry) => {
    if (!canAccess('apis')) { setGateOpen(true); return; }
    setDeleteTarget(api); setModal('delete');
  };
  const closeModal = () => { setModal(null); setEditTarget(null); setDeleteTarget(null); };

  const pf = (k: keyof FormData, v: string) => { setForm(prev => ({ ...prev, [k]: v })); setFormError(''); };

  const validate = () => {
    if (!form.name.trim())     return 'API name is required.';
    if (!form.endpoint.trim()) return 'Endpoint URL is required.';
    if (!form.endpoint.startsWith('/')) return 'Endpoint must start with / (e.g. /api/v1/users).';
    if (!form.owner.trim())    return 'Owner team is required.';
    const dup = apiList.find(a => a.endpoint.toLowerCase() === form.endpoint.toLowerCase() && (modal === 'add' || a.id !== editTarget?.id));
    if (dup) return 'An API with this endpoint already exists.';
    return '';
  };

  const submitForm = () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    if (modal === 'add') {
      const next: ApiEntry = {
        id: Date.now(), name: form.name, endpoint: form.endpoint, method: form.method,
        version: form.version, owner: form.owner, status: form.status, category: form.category,
        description: form.description, requests: 0, errorRate: 0, avgResponse: 0, uptime: 100,
      };
      const updated = [next, ...apiList];
      setApiList(updated);
      saveAndExportCsv(updated, 'apis.csv', false);
      toast('success', 'API Registered', `${form.name} added to registry and saved.`);
      setPage(1);
    } else if (modal === 'edit' && editTarget) {
      const updated = apiList.map(a => a.id === editTarget.id ? { ...a, ...form } : a);
      setApiList(updated);
      saveAndExportCsv(updated, 'apis.csv', false);
      toast('info', 'API Updated', `${form.name} updated and saved to apis.csv.`);
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = apiList.filter(a => a.id !== deleteTarget.id);
    setApiList(updated);
    saveAndExportCsv(updated, 'apis.csv', false);
    toast('warning', 'API Deregistered', `${deleteTarget.name} removed from registry and apis.csv.`);
    closeModal();
  };

  const copyEndpoint = (api: ApiEntry) => {
    navigator.clipboard.writeText(api.endpoint).catch(() => {});
    setCopied(api.id);
    setTimeout(() => setCopied(null), 1500);
  };

  /* summary stats */
  const healthy = apiList.filter(a => a.status === 'healthy').length;
  const issues  = apiList.filter(a => a.status !== 'healthy').length;
  const avgUp   = apiList.length ? (apiList.reduce((s, a) => s + a.uptime, 0) / apiList.length).toFixed(2) : '—';

  const COLS: { label: string; f: SortField | '' }[] = [
    { label: 'API', f: 'name' }, { label: 'Endpoint', f: '' },
    { label: 'Method', f: 'method' }, { label: 'Version', f: '' },
    { label: 'Category', f: '' }, { label: 'Status', f: 'status' },
    { label: 'Requests', f: 'requests' }, { label: 'Error %', f: 'errorRate' },
    { label: 'Avg ms', f: 'avgResponse' }, { label: 'Actions', f: '' },
  ];

  return (
    <div className="page stagger">

      {/* ── Summary stats ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
        {[
          { label: 'TOTAL APIs',    value: apiList.length, color: '#00C8FF', icon: <Database size={13} /> },
          { label: 'HEALTHY',       value: healthy,         color: '#00E599', icon: <CheckCircle2 size={13} /> },
          { label: 'ISSUES',        value: issues,          color: issues > 0 ? '#FF3B5C' : '#304050', icon: <AlertTriangle size={13} /> },
          { label: 'AVG UPTIME',    value: `${avgUp}%`,    color: '#BF7FFF', icon: <TrendingUp size={13} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card" style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#304050', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ color, opacity: 0.7 }}>{icon}</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={12} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
          <input placeholder="Search APIs, endpoints, owners…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <Filter size={12} style={{ color: 'var(--text-4)' }} />
          <select value={method} onChange={e => { setMethod(e.target.value); setPage(1); }} style={{ width: 110, height: 34, fontSize: 12 }}>
            {METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 120, height: 34, fontSize: 12 }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(0,196,255,0.12)', borderRadius: 5, overflow: 'hidden' }}>
          {(['table', 'grid'] as const).map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === v ? 'rgba(0,196,255,0.12)' : 'transparent', color: view === v ? '#00C8FF' : 'var(--text-4)', borderRight: i === 0 ? '1px solid rgba(0,196,255,0.10)' : 'none', transition: 'all 0.12s' }}>
              {v === 'table' ? <List size={13} /> : <LayoutGrid size={13} />}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        <button
          className="btn btn-secondary"
          style={{ flexShrink: 0, gap: 6 }}
          onClick={() => {
            if (!canAccess('export')) {
              setGateOpen(true);
              return;
            }
            const headers = ['id', 'name', 'endpoint', 'method', 'version', 'owner', 'status', 'category', 'description', 'requests', 'errorRate', 'avgResponse', 'uptime'];
            const rows = apiList.map(a => [
              a.id, `"${a.name}"`, a.endpoint, a.method, a.version, `"${a.owner}"`, a.status, a.category, `"${a.description}"`, a.requests, a.errorRate, a.avgResponse, a.uptime
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'apis.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast('success', 'CSV Exported', 'Downloaded apis.csv successfully.');
          }}
        >
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={openAdd} style={{ flexShrink: 0, gap: 6 }}>
          <Plus size={13} /> Register API
        </button>
      </div>

      {/* ── TABLE VIEW ──────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {COLS.map(({ label, f }) => (
                    <th key={label} onClick={() => f && toggleSort(f as SortField)}
                      style={{ cursor: f ? 'pointer' : 'default', userSelect: 'none' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {label}{f ? <SortIco f={f} sortField={sortField} sortDir={sortDir} /> : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={COLS.length}><EmptyState icon={<Database size={22} />} title="No APIs match your filters" description="Try adjusting search or filters, or register a new API." /></td></tr>
                ) : paged.map(api => {
                  const sm = STATUS_META[api.status] ?? STATUS_META.healthy;
                  const mc = METHOD_COLORS[api.method] ?? METHOD_COLORS.GET;
                  return (
                    <tr key={api.id}>
                      <td style={{ minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, boxShadow: `0 0 6px ${sm.color}`, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>{api.name}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-4)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {api.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#00C8FF' }}>{api.endpoint}</span>
                          <button onClick={() => copyEndpoint(api)} title="Copy endpoint"
                            style={{ background: 'none', border: 'none', color: copied === api.id ? '#00E599' : 'var(--text-5)', cursor: 'pointer', padding: 2, transition: 'color 0.2s' }}>
                            <Copy size={10} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 3, background: mc.bg, color: mc.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
                          {api.method}
                        </span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>{api.version}</td>
                      <td>
                        <span style={{ fontSize: 11, background: 'rgba(0,196,255,0.06)', color: 'var(--text-3)', borderRadius: 3, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}>
                          {api.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 3, background: sm.bg, color: sm.color, fontSize: 10.5, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                          {sm.icon} {api.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>
                        {api.requests > 0 ? `${(api.requests / 1e6).toFixed(1)}M` : '—'}
                      </td>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: api.errorRate > 3 ? '#FF3B5C' : api.errorRate > 1 ? '#FFB020' : '#00E599' }}>
                          {api.errorRate}%
                        </span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: api.avgResponse > 500 ? '#FF3B5C' : api.avgResponse > 200 ? '#FFB020' : 'var(--text-2)' }}>
                        {api.avgResponse > 0 ? `${api.avgResponse}` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <ActionBtn icon={<Eye size={12} />}   color="#00C8FF" bg="rgba(0,200,255,0.08)"   title="View details" onClick={() => onViewDetail(api.id)} />
                          <ActionBtn icon={<Edit2 size={12} />} color="#FFB020" bg="rgba(255,176,32,0.08)"  title="Edit API"     onClick={() => openEdit(api)} />
                          <ActionBtn icon={<Trash2 size={12} />} color="#FF3B5C" bg="rgba(255,59,92,0.08)" title="Remove API"   onClick={() => openDelete(api)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onPage={setPage} />}
        </div>
      )}

      {/* ── GRID VIEW ────────────────────────────────────────────── */}
      {view === 'grid' && (
        <>
          {paged.length === 0 ? (
            <div className="glass-card" style={{ padding: 40 }}>
              <EmptyState icon={<Database size={22} />} title="No APIs match your filters" description="Try adjusting search or filters, or register a new API." />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {paged.map(api => {
                const sm = STATUS_META[api.status] ?? STATUS_META.healthy;
                const mc = METHOD_COLORS[api.method] ?? METHOD_COLORS.GET;
                return (
                  <div key={api.id} className="glass-card hover-lift" style={{ padding: 0, overflow: 'hidden', cursor: 'default' }}>
                    {/* Card top accent */}
                    <div style={{ height: 2, background: sm.color }} />
                    <div style={{ padding: '14px 16px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ flex: 1, marginRight: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{api.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-4)', lineHeight: 1.4 }}>{api.description || api.category}</div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 3, background: sm.bg, color: sm.color, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', flexShrink: 0 }}>
                          {sm.icon} {api.status.toUpperCase()}
                        </span>
                      </div>
                      {/* Endpoint */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '6px 10px', background: 'rgba(0,196,255,0.04)', borderRadius: 3, border: '1px solid rgba(0,196,255,0.08)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 2, background: mc.bg, color: mc.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700 }}>
                          {api.method}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00C8FF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {api.endpoint}
                        </span>
                        <button onClick={() => copyEndpoint(api)} style={{ background: 'none', border: 'none', color: copied === api.id ? '#00E599' : 'var(--text-5)', cursor: 'pointer', padding: 2 }}>
                          <Copy size={10} />
                        </button>
                      </div>
                      {/* Metrics row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                        {[
                          { label: 'REQUESTS', value: api.requests > 0 ? `${(api.requests/1e6).toFixed(1)}M` : '—', color: 'var(--text-1)' },
                          { label: 'ERROR RATE', value: `${api.errorRate}%`, color: api.errorRate > 3 ? '#FF3B5C' : api.errorRate > 1 ? '#FFB020' : '#00E599' },
                          { label: 'AVG RESP', value: api.avgResponse > 0 ? `${api.avgResponse}ms` : '—', color: api.avgResponse > 500 ? '#FF3B5C' : api.avgResponse > 200 ? '#FFB020' : 'var(--text-2)' },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-5)', letterSpacing: '0.10em', marginBottom: 3 }}>{label}</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{api.owner} · <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{api.version}</span></div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <ActionBtn icon={<Eye size={11} />}    color="#00C8FF" bg="rgba(0,200,255,0.08)" title="View details" onClick={() => onViewDetail(api.id)} />
                          <ActionBtn icon={<Edit2 size={11} />}  color="#FFB020" bg="rgba(255,176,32,0.08)" title="Edit API" onClick={() => openEdit(api)} />
                          <ActionBtn icon={<Trash2 size={11} />} color="#FF3B5C" bg="rgba(255,59,92,0.08)" title="Remove API" onClick={() => openDelete(api)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="glass-card" style={{ padding: '10px 16px' }}>
              <Pagination page={page} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onPage={setPage} />
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel scale-in" style={{ width: 520, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid rgba(0,196,255,0.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(0,196,255,0.25)', background: 'rgba(0,196,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {modal === 'add' ? <Plus size={14} style={{ color: '#00C8FF' }} /> : <Edit2 size={13} style={{ color: '#00C8FF' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{modal === 'add' ? 'Register New API' : 'Edit API'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: "'JetBrains Mono', monospace" }}>{modal === 'add' ? 'Add endpoint to registry' : editTarget?.endpoint}</div>
                </div>
              </div>
              <button className="btn-icon" onClick={closeModal}><X size={13} /></button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>API Name <Req /></label>
                  <input placeholder="User Authentication API" value={form.name} onChange={e => pf('name', e.target.value)} />
                </div>
                <div>
                  <label>Version</label>
                  <input placeholder="v1.0.0" value={form.version} onChange={e => pf('version', e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
              </div>

              <div>
                <label>Endpoint URL <Req /></label>
                <input placeholder="/api/v1/resource" value={form.endpoint} onChange={e => pf('endpoint', e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>HTTP Method</label>
                  <select value={form.method} onChange={e => pf('method', e.target.value)}>
                    {HTTP_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label>Category</label>
                  <select value={form.category} onChange={e => pf('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label>Owner Team <Req /></label>
                <input placeholder="Platform Team" value={form.owner} onChange={e => pf('owner', e.target.value)} />
              </div>

              <div>
                <label>Initial Status</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {(['healthy', 'warning', 'slow', 'down'] as ApiStatus[]).map(s => {
                    const meta = STATUS_META[s];
                    const sel = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => pf('status', s)}
                        style={{ flex: 1, padding: '7px 4px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${sel ? meta.color + '55' : 'rgba(0,196,255,0.10)'}`, background: sel ? meta.bg : 'transparent', color: sel ? meta.color : 'var(--text-4)', fontSize: 10.5, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {meta.icon} {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea placeholder="Brief description of this endpoint's purpose…" value={form.description} onChange={e => pf('description', e.target.value)} style={{ height: 68 }} />
              </div>

              {formError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 4, background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.20)', color: '#FF3B5C', fontSize: 12 }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {formError}
                </div>
              )}
            </div>

            <div style={{ padding: '13px 22px', borderTop: '1px solid rgba(0,196,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>
                {modal === 'add' ? <><Plus size={12} /> Register API</> : <><Edit2 size={12} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────── */}
      {modal === 'delete' && deleteTarget && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-panel scale-in" style={{ width: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: 6, border: '1px solid rgba(255,59,92,0.25)', background: 'rgba(255,59,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={20} style={{ color: '#FF3B5C' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Deregister API</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Remove <strong style={{ color: 'var(--text-1)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{deleteTarget.name}</strong> from the registry? Analytics data is retained for 90 days.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}><Trash2 size={12} /> Deregister</button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Gate Modal */}
      <PermissionGateModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        currentRole={currentUser?.role}
        actionName="Manage APIs & Endpoints"
      />
    </div>
  );
}

function ActionBtn({ icon, color, bg, title, onClick }: { icon: React.ReactNode; color: string; bg: string; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      style={{ width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, transition: 'opacity 0.12s, transform 0.12s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1';    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';   }}>
      {icon}
    </button>
  );
}

function Pagination({ page, totalPages, total, pageSize, onPage }: { page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
      <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: "'JetBrains Mono', monospace" }}>
        {(page-1)*pageSize+1}–{Math.min(page*pageSize, total)} of {total}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <PBtn label="←" disabled={page === 1} onClick={() => onPage(page - 1)} />
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <PBtn key={p} label={String(p)} active={p === page} onClick={() => onPage(p)} />
        ))}
        <PBtn label="→" disabled={page === totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
}

function PBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minWidth: 28, height: 28, borderRadius: 4, border: active ? '1px solid rgba(0,196,255,0.40)' : '1px solid rgba(0,196,255,0.10)', background: active ? 'rgba(0,196,255,0.12)' : 'transparent', color: active ? '#00C8FF' : 'var(--text-4)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: active ? 700 : 400, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1, transition: 'all 0.12s' }}>
      {label}
    </button>
  );
}

function Req() { return <span style={{ color: '#FF3B5C', marginLeft: 2 }}>*</span>; }
