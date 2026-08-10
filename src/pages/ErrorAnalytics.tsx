import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { errorDistribution, trafficData, apis } from '../data/mockData';

const ROOT_CAUSES = [
  { cause:'Database Timeout',       count:1240, pct:28 },
  { cause:'Invalid Auth Token',     count:890,  pct:20 },
  { cause:'Rate Limit Exceeded',    count:678,  pct:15 },
  { cause:'Resource Not Found',     count:560,  pct:13 },
  { cause:'Upstream Service Down',  count:456,  pct:10 },
  { cause:'Payload Too Large',      count:312,  pct:7  },
  { cause:'Other',                  count:320,  pct:7  },
];

const ERROR_STATS = [
  { code:'400', label:'Bad Request',      count:1240, color:'#F59E0B', delta:'+12%' },
  { code:'401', label:'Unauthorized',     count:890,  color:'#EF4444', delta:'-5%'  },
  { code:'403', label:'Forbidden',        count:456,  color:'#DC2626', delta:'+3%'  },
  { code:'404', label:'Not Found',        count:2180, color:'#F97316', delta:'+8%'  },
  { code:'500', label:'Server Error',     count:678,  color:'#991B1B', delta:'-18%' },
  { code:'503', label:'Unavailable',      count:234,  color:'#7C3AED', delta:'+45%' },
];

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-4)', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}</div>
      ))}
    </div>
  );
};

const topFailing = [...apis].filter(a => a.errorRate > 1).sort((a,b) => b.errorRate - a.errorRate);

export default function ErrorAnalytics() {
  return (
    <div className="page stagger">
      {/* Code cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
        {ERROR_STATS.map(({ code, label, count, color, delta }) => (
          <div key={code} className="glass-card hover-lift" style={{ padding:18 }}>
            <div className="mono" style={{ fontSize:24, fontWeight:800, color, marginBottom:2 }}>{code}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8 }}>{label}</div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text-1)' }}>{count.toLocaleString()}</div>
            <div style={{ fontSize:10.5, color:delta.startsWith('+')?'#EF4444':'#22C55E', marginTop:3, fontWeight:600 }}>{delta} today</div>
          </div>
        ))}
      </div>

      {/* Timeline + donut */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:2 }}>Error Timeline — 24h</div>
          <div className="section-sub" style={{ marginBottom:14 }}>Errors vs total requests</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trafficData} margin={{ top:4, right:4, bottom:0, left:-16 }}>
              <defs>
                {[['eg','#EF4444'],['rg','#2563EB']].map(([id,c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.01} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#2563EB" fill="url(#rg)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="errors"   name="Errors"   stroke="#EF4444" fill="url(#eg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Error Distribution</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={errorDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                {errorDistribution.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
            {errorDistribution.map(e => (
              <div key={e.name} style={{ display:'flex', justifyContent:'space-between', fontSize:11, alignItems:'center' }}>
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:2, background:e.color, display:'inline-block' }} />
                  <span style={{ color:'var(--text-3)' }}>{e.name}</span>
                </span>
                <span style={{ color:'var(--text-2)', fontWeight:700 }}>{e.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Root cause + top failing */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:2 }}>Root Cause Analysis</div>
          <div className="section-sub" style={{ marginBottom:14 }}>Primary failure categories</div>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {ROOT_CAUSES.map(({ cause, count, pct }) => (
              <div key={cause}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12.5, color:'var(--text-2)' }}>{cause}</span>
                  <span style={{ fontSize:12, color:'var(--text-3)', fontWeight:700 }}>{count.toLocaleString()}</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#EF4444,#F97316)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding:20 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Top Failing APIs</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {topFailing.map((api, i) => {
              const c = api.errorRate > 5 ? '#EF4444' : '#F59E0B';
              return (
                <div key={api.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${c}15`, color:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{api.name}</div>
                    <div className="mono" style={{ fontSize:10, color:'var(--text-5)' }}>{api.endpoint}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:c }}>{api.errorRate}%</div>
                    <div style={{ fontSize:10, color:'var(--text-4)' }}>error rate</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
