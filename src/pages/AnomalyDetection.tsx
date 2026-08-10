import { useState } from 'react';
import { AlertTriangle, TrendingUp, Clock, Shield, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { anomalies, trafficData } from '../data/mockData';
import { useToast } from '../context/ToastContext';

const TYPE_GROUPS = [
  { type:'Traffic Spikes',     color:'#F59E0B', icon:<TrendingUp size={16}/>,    count:3 },
  { type:'Slow APIs',          color:'#F97316', icon:<Clock size={16}/>,         count:2 },
  { type:'High Error Rate',    color:'#EF4444', icon:<AlertTriangle size={16}/>, count:1 },
  { type:'Suspicious Activity',color:'#8B5CF6', icon:<Shield size={16}/>,        count:2 },
];

const SEVERITY_COLOR: Record<string,string> = { error:'#EF4444', warning:'#F59E0B', info:'#06B6D4' };
const SEVERITY_DOT: Record<string,string> = { error:'dot-error', warning:'dot-warning', info:'dot-info' };

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-4)', fontWeight:600, marginBottom:6 }}>{label}</div>
      {payload.map((p: any, i: number) => p.value != null && (
        <div key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value.toLocaleString()}</div>
      ))}
    </div>
  );
};

const timeline = trafficData.map((d, i) => ({ ...d, anomaly: i === 7 ? d.requests * 1.9 : undefined }));

export default function AnomalyDetection() {
  const { toast } = useToast();
  const [resolved, setResolvedList] = useState<number[]>(anomalies.filter(a => a.resolved).map(a => a.id));

  const resolve = (id: number) => {
    setResolvedList(r => [...r, id]);
    toast('success', 'Anomaly resolved', 'Incident marked as resolved');
  };

  return (
    <div className="page stagger">
      {/* Type summary */}
      <div className="grid-kpi">
        {TYPE_GROUPS.map(({ type, color, icon, count }) => (
          <div key={type} className="glass-card hover-lift" style={{ padding:20 }}>
            <div style={{ color, marginBottom:10 }}>{icon}</div>
            <div style={{ fontSize:30, fontWeight:800, color, marginBottom:4, letterSpacing:'-0.02em' }}>{count}</div>
            <div style={{ fontSize:12.5, color:'var(--text-3)' }}>{type}</div>
          </div>
        ))}
      </div>

      {/* Detection chart */}
      <div className="glass-card" style={{ padding:20 }}>
        <div className="section-title" style={{ marginBottom:2 }}>Anomaly Detection Timeline</div>
        <div className="section-sub" style={{ marginBottom:16 }}>Traffic vs rolling baseline — anomalies highlighted in red</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timeline} margin={{ top:4, right:4, bottom:0, left:-16 }}>
            <defs>
              {[['bg','#2563EB'],['ag','#EF4444']].map(([id,c]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TT />} />
            <ReferenceLine y={4000} stroke="rgba(245,158,11,0.45)" strokeDasharray="6 3" label={{ value:'Baseline', fill:'#F59E0B', fontSize:10 }} />
            <Area type="monotone" dataKey="requests" name="Traffic"  stroke="#2563EB" fill="url(#bg)" strokeWidth={2} />
            <Area type="monotone" dataKey="anomaly"  name="Anomaly"  stroke="#EF4444" fill="url(#ag)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alert cards + timeline */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div className="section-title">Active Alerts</div>
            <span style={{ fontSize:11, fontWeight:700, color:'#EF4444', background:'rgba(239,68,68,0.10)', padding:'2px 8px', borderRadius:5 }}>
              {anomalies.filter(a => !resolved.includes(a.id)).length} ACTIVE
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {anomalies.map(a => {
              const isResolved = resolved.includes(a.id);
              const c = isResolved ? '#64748B' : SEVERITY_COLOR[a.severity];
              return (
                <div
                  key={a.id}
                  className="alert-card"
                  style={{
                    borderColor:`${c}25`, background:`${c}07`,
                    opacity: isResolved ? 0.55 : 1, transition:'opacity 0.2s',
                  }}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      {!isResolved && <div className={`dot ${SEVERITY_DOT[a.severity]}`} style={a.severity==='error'?{animation:'pulse-dot 1.5s infinite'}:{}} />}
                      {isResolved && <Check size={12} style={{ color:'#22C55E' }} />}
                      <span style={{ fontSize:12, fontWeight:700, color:c }}>{a.type}</span>
                      <span style={{ fontSize:10, color:'var(--text-5)', marginLeft:'auto' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text-1)', marginBottom:2 }}>{a.api}</div>
                    <div style={{ fontSize:11.5, color:'var(--text-3)', lineHeight:1.4 }}>{a.description}</div>
                    {!isResolved && (
                      <div style={{ display:'flex', gap:6, marginTop:8 }}>
                        <button style={{ fontSize:11.5, background:`${c}15`, color:c, border:'none', borderRadius:6, padding:'4px 10px', fontWeight:600, cursor:'pointer' }}>Investigate</button>
                        <button onClick={() => resolve(a.id)} style={{ fontSize:11.5, background:'rgba(34,197,94,0.10)', color:'#22C55E', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>Resolve</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Incident Timeline</div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:10, top:0, bottom:0, width:1, background:'var(--border)' }} />
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {anomalies.map(a => {
                const isResolved = resolved.includes(a.id);
                const c = isResolved ? '#64748B' : SEVERITY_COLOR[a.severity];
                return (
                  <div key={a.id} style={{ display:'flex', gap:14 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${c}`, background:`${c}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:1 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:isResolved?'var(--text-4)':'var(--text-1)' }}>{a.type}</span>
                        {isResolved && <span style={{ fontSize:10, color:'#22C55E', background:'rgba(34,197,94,0.10)', padding:'1px 6px', borderRadius:4 }}>Resolved</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-5)', marginBottom:2 }}>{a.api} · {a.time}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-3)', lineHeight:1.4 }}>{a.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
