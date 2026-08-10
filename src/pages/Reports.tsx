import { useState } from 'react';
import { Download, FileText, Table2, FileSpreadsheet, Calendar, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { weeklyTraffic, trafficData, apis, responseTimeData, errorDistribution, anomalies } from '../data/mockData';
import { useToast } from '../context/ToastContext';

// ─── Template definitions ────────────────────────────────────────────────────

const TEMPLATES = [
  { id:'daily',    label:'Daily Summary',       desc:'Performance metrics for the past 24 hours',                  icon:'📊', last:'Today, 06:00 AM' },
  { id:'weekly',   label:'Weekly Report',        desc:'Trends, SLA compliance, and anomaly summary for 7 days',    icon:'📈', last:'Mon, 06:00 AM' },
  { id:'monthly',  label:'Monthly Executive',    desc:'High-level KPIs, cost analysis, and forecasts for 30 days', icon:'📋', last:'Aug 1, 2026' },
  { id:'sla',      label:'SLA Compliance',       desc:'Uptime, latency, and error-rate compliance per API',        icon:'✅', last:'Aug 3, 2026' },
  { id:'security', label:'Security Audit',       desc:'Auth failures, rate-limit events, and suspicious activity', icon:'🛡️', last:'Aug 4, 2026' },
  { id:'incident', label:'Incident Report',      desc:'All incidents, root causes, and MTTR for the period',       icon:'🚨', last:'Aug 2, 2026' },
];

const RECENT = [
  { name:'Daily Summary — Aug 4, 2026',  id:'daily',    size:'2.4 MB', format:'PDF',   generated:'06:00 AM' },
  { name:'Weekly Report — W31 2026',     id:'weekly',   size:'8.1 MB', format:'Excel', generated:'Aug 4' },
  { name:'SLA Compliance — Aug 2026',    id:'sla',      size:'1.2 MB', format:'PDF',   generated:'Aug 3' },
  { name:'Security Audit — Aug 1–3',     id:'security', size:'3.7 MB', format:'PDF',   generated:'Aug 4' },
  { name:'Monthly Executive — Jul 2026', id:'monthly',  size:'15.3 MB',format:'PDF',   generated:'Aug 1' },
];

const FMT_ICON: Record<string,React.ReactNode> = {
  PDF: <FileText size={12} />, CSV: <Table2 size={12} />, Excel: <FileSpreadsheet size={12} />,
};

// ─── CSV builders per template ───────────────────────────────────────────────

function csvRows(header: string[], rows: (string|number)[][]): string {
  const escape = (v: string|number) => typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v);
  return [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
}

const CSV_BUILDERS: Record<string, () => string> = {
  daily: () => csvRows(
    ['Time','Requests','Errors','P95 ms'],
    trafficData.map(d => [d.time, d.requests, d.errors, d.p95])
  ),
  weekly: () => csvRows(
    ['Week','Total Requests','Successful','Errors','Error Rate %'],
    weeklyTraffic.map(d => [d.week, d.requests, d.success, d.errors, ((d.errors/d.requests)*100).toFixed(2)])
  ),
  monthly: () => csvRows(
    ['Week','Total Requests','Successful','Errors','Growth %'],
    weeklyTraffic.map((d,i,arr) => {
      const prev = arr[i-1]?.requests ?? d.requests;
      return [d.week, d.requests, d.success, d.errors, (((d.requests-prev)/prev)*100).toFixed(1)];
    })
  ),
  sla: () => csvRows(
    ['API Name','Endpoint','Uptime %','Avg Response ms','P95 ms','Error Rate %','SLA Status'],
    apis.map(a => [
      a.name, a.endpoint, a.uptime, a.avgResponse,
      responseTimeData.find((_,i) => i === a.id % responseTimeData.length)?.p95 ?? '-',
      a.errorRate,
      a.uptime >= 99.9 && a.errorRate <= 1 ? 'PASS' : 'FAIL',
    ])
  ),
  security: () => csvRows(
    ['API Name','Category','Status','Error Rate %','Owner','Risk Level'],
    apis.map(a => [
      a.name, a.category, a.status, a.errorRate, a.owner,
      a.errorRate > 5 ? 'HIGH' : a.errorRate > 2 ? 'MEDIUM' : 'LOW',
    ])
  ),
  incident: () => csvRows(
    ['Time','Type','API','Severity','Description','Resolved'],
    anomalies.map(a => [a.time, a.type, a.api, a.severity, a.description, a.resolved ? 'Yes' : 'No'])
  ),
};

// ─── Plain-text PDF builders per template ────────────────────────────────────

function divider(char = '─', n = 62) { return char.repeat(n); }

const PDF_BUILDERS: Record<string, (label: string) => string> = {
  daily: (label) => {
    const total = trafficData.reduce((s,d) => s + d.requests, 0);
    const errors = trafficData.reduce((s,d) => s + d.errors, 0);
    const avgP95 = (trafficData.reduce((s,d) => s + d.p95, 0) / trafficData.length).toFixed(0);
    return [
      `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      divider(),
      '',
      'EXECUTIVE SUMMARY',
      divider('-'),
      `Total Requests (24h):  ${total.toLocaleString()}`,
      `Total Errors    (24h):  ${errors.toLocaleString()}`,
      `Error Rate:             ${((errors/total)*100).toFixed(2)}%`,
      `Average P95 Latency:    ${avgP95}ms`,
      '',
      'HOURLY BREAKDOWN',
      divider('-'),
      ...trafficData.map(d => `  ${d.time.padEnd(6)}  Requests: ${String(d.requests).padEnd(6)}  Errors: ${String(d.errors).padEnd(4)}  P95: ${d.p95}ms`),
    ].join('\n');
  },
  weekly: (label) => [
    `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider(),
    '',
    'WEEKLY TRAFFIC SUMMARY',
    divider('-'),
    ...weeklyTraffic.map(d =>
      `  ${d.week}  Requests: ${d.requests.toLocaleString().padEnd(8)}  Success: ${d.success.toLocaleString().padEnd(8)}  Errors: ${d.errors.toLocaleString()}`
    ),
    '',
    'SLA COMPLIANCE',
    divider('-'),
    ...apis.map(a => `  ${a.name.padEnd(30)} ${a.uptime}% uptime  ${a.status.toUpperCase()}`),
  ].join('\n'),
  monthly: (label) => [
    `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider(),
    '',
    'EXECUTIVE KPIs',
    divider('-'),
    `  Total APIs Monitored:    ${apis.length}`,
    `  Platform Health Score:   96.4 / 100`,
    `  Overall Uptime (30d):    99.97%`,
    `  Average Error Rate:      2.7%`,
    `  P95 Response Time:       312ms`,
    '',
    'MONTHLY TRAFFIC TREND',
    divider('-'),
    ...weeklyTraffic.map(d => `  ${d.week}  ${d.requests.toLocaleString()} requests`),
    '',
    'TOP PERFORMING APIS',
    divider('-'),
    ...apis.slice(0,5).map(a => `  ${a.name.padEnd(30)} ${(a.requests/1e6).toFixed(1)}M requests  ${a.uptime}% up`),
  ].join('\n'),
  sla: (label) => [
    `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider(),
    '',
    'SLA COMPLIANCE REPORT',
    divider('-'),
    `SLA Thresholds:  Uptime ≥ 99.9%  |  Error Rate ≤ 1%  |  P95 ≤ 500ms`,
    '',
    ...apis.map(a => {
      const pass = a.uptime >= 99.9 && a.errorRate <= 1;
      return [
        `  API:    ${a.name}`,
        `  Uptime: ${a.uptime}%   Errors: ${a.errorRate}%   Avg: ${a.avgResponse}ms`,
        `  Status: ${pass ? '✓ PASS' : '✗ FAIL'}`,
        '',
      ].join('\n');
    }),
  ].join('\n'),
  security: (label) => [
    `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider(),
    '',
    'SECURITY RISK ASSESSMENT',
    divider('-'),
    ...apis.map(a => {
      const risk = a.errorRate > 5 ? '⚠ HIGH' : a.errorRate > 2 ? '● MEDIUM' : '○ LOW';
      return `  ${risk.padEnd(10)}  ${a.name.padEnd(30)}  Error: ${a.errorRate}%  Owner: ${a.owner}`;
    }),
    '',
    'ANOMALY LOG',
    divider('-'),
    ...anomalies.map(a => `  ${a.time}  [${a.severity.toUpperCase()}]  ${a.api}  — ${a.description}`),
  ].join('\n'),
  incident: (label) => [
    `APIPULSE ENTERPRISE — ${label.toUpperCase()}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider(),
    '',
    `INCIDENT SUMMARY — ${anomalies.length} incidents detected`,
    divider('-'),
    '',
    ...anomalies.map((a, i) => [
      `  #${i+1}  ${a.time}  |  ${a.type}  |  ${a.severity.toUpperCase()}`,
      `       API:         ${a.api}`,
      `       Description: ${a.description}`,
      `       Resolved:    ${a.resolved ? 'Yes' : 'No — Pending'}`,
      '',
    ].join('\n')),
    divider('-'),
    `  Open incidents:     ${anomalies.filter(a => !a.resolved).length}`,
    `  Resolved incidents: ${anomalies.filter(a => a.resolved).length}`,
  ].join('\n'),
};

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerDownload(id: string, label: string, format: string) {
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  const builder = CSV_BUILDERS[id] ?? CSV_BUILDERS.daily;

  if (format === 'CSV') {
    downloadBlob(builder(), `${slug}-${date}.csv`, 'text/csv;charset=utf-8;');
  } else if (format === 'Excel') {
    downloadBlob(builder(), `${slug}-${date}.csv`, 'application/vnd.ms-excel');
  } else {
    const pdfBuilder = PDF_BUILDERS[id] ?? PDF_BUILDERS.daily;
    downloadBlob(pdfBuilder(label), `${slug}-${date}.txt`, 'text/plain;charset=utf-8;');
  }
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-4)', fontWeight:600, marginBottom:6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value.toLocaleString()}</div>
      ))}
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Reports() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string|null>(null);
  const [format, setFormat] = useState('PDF');

  const generate = (id: string, label: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      triggerDownload(id, label, format);
      const ext = format === 'PDF' ? '.txt' : '.csv';
      toast('success', `${label} downloaded`, `${format} saved as ${ext}`);
    }, 1600);
  };

  const downloadRecent = (r: typeof RECENT[number]) => {
    triggerDownload(r.id, r.name, r.format);
    toast('success', 'Download started', r.name);
  };

  return (
    <div className="page stagger">
      {/* Config */}
      <div className="glass-card" style={{ padding:20 }}>
        <div className="section-title" style={{ marginBottom:4 }}>Report Configuration</div>
        <div style={{ fontSize:11.5, color:'var(--text-4)', marginBottom:14 }}>
          Select a format below, then click Generate on any template to download that specific report.
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div style={{ minWidth:200 }}>
            <label>Date Range</label>
            <select>
              <option>Last 7 days</option><option>Last 30 days</option>
              <option>Last 90 days</option><option>Custom range</option>
            </select>
          </div>
          <div style={{ minWidth:180 }}>
            <label>API Scope</label>
            <select><option>All APIs</option><option>Commerce APIs</option><option>Security APIs</option></select>
          </div>
          <div>
            <label>Export Format</label>
            <div style={{ display:'flex', gap:6 }}>
              {(['PDF','CSV','Excel'] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'0 12px', height:36, borderRadius:8,
                    border:`1px solid ${f===format?'var(--primary)':'var(--border)'}`,
                    background:f===format?'rgba(37,99,235,0.15)':'rgba(15,23,42,0.6)',
                    color:f===format?'#60A5FA':'var(--text-3)', fontSize:12.5, fontWeight:f===format?600:400, cursor:'pointer',
                    transition:'all 0.15s',
                  }}>
                  {FMT_ICON[f]}{f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div>
        <div className="section-title" style={{ marginBottom:14 }}>Report Templates</div>
        <div className="grid-auto">
          {TEMPLATES.map(({ id, label, desc, icon, last }) => (
            <div key={id} className="glass-card hover-lift" style={{ padding:18 }}>
              <div style={{ display:'flex', gap:12 }}>
                <span style={{ fontSize:26, lineHeight:1 }}>{icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-1)', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:11.5, color:'var(--text-4)', lineHeight:1.45, marginBottom:8 }}>{desc}</div>
                  <div style={{ fontSize:10.5, color:'var(--text-5)' }}>Last: {last}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex:1, height:32, fontSize:12 }}
                  onClick={() => generate(id, label)}
                  disabled={generating === id}
                >
                  {generating === id
                    ? <><RefreshCw size={12} className="spin" /> Generating…</>
                    : <><Download size={12} /> Generate {format}</>
                  }
                </button>
                <button className="btn btn-secondary" style={{ height:32, fontSize:12 }}>
                  <Calendar size={12} /> Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview + recent */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:2 }}>Report Preview</div>
          <div className="section-sub" style={{ marginBottom:14 }}>Weekly traffic — sample of what will be exported</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyTraffic} margin={{ top:4, right:4, bottom:0, left:-16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="success" name="Success" fill="#22C55E" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="errors"  name="Errors"  fill="#EF4444" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Recent Reports</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {RECENT.map(r => (
              <div key={r.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'rgba(11,17,32,0.45)', borderRadius:10, border:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-4)', flexShrink:0 }}>{FMT_ICON[r.format]}</span>
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:12, color:'var(--text-2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-5)', marginTop:2 }}>{r.size} · {r.generated}</div>
                </div>
                <button className="btn-icon" style={{ width:26, height:26, flexShrink:0 }} onClick={() => downloadRecent(r)} title="Download">
                  <Download size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
