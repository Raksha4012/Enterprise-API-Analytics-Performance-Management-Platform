import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { trafficData, weeklyTraffic, heatmapData } from '../data/mockData';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const cellColor = (v: number) => {
  const p = v / 8500;
  if (p > 0.8) return '#1d4ed8';
  if (p > 0.6) return '#2563EB';
  if (p > 0.4) return '#3b82f6';
  if (p > 0.2) return '#60A5FA';
  return 'rgba(37,99,235,0.14)';
};

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-4)', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color, fontWeight:600, marginBottom:2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</div>
      ))}
    </div>
  );
};

export default function TrafficAnalytics() {
  const grid = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) =>
      heatmapData.find(d => d.day === day && d.hour === hour)?.value ?? 0
    )
  );

  return (
    <div className="page stagger">
      {/* 24h */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 2 }}>API Traffic — 24 Hours</div>
        <div className="section-sub" style={{ marginBottom: 16 }}>Requests, error overlay, and P95 latency</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trafficData} margin={{ top:4, right:4, bottom:0, left:-16 }}>
            <defs>
              {[['ag','#2563EB'],['eg','#EF4444'],['pg','#22C55E']].map(([id,c]) => (
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
            <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
            <Area type="monotone" dataKey="requests" name="Requests" stroke="#2563EB" fill="url(#ag)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="p95"      name="P95 (ms)" stroke="#22C55E" fill="url(#pg)" strokeWidth={1.5} strokeDasharray="5 3" />
            <Area type="monotone" dataKey="errors"   name="Errors"   stroke="#EF4444" fill="url(#eg)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly + monthly */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Weekly Traffic</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Success vs error split by week</div>
          <ResponsiveContainer width="100%" height={200}>
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

        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Monthly Growth</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Request volume trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyTraffic} margin={{ top:4, right:4, bottom:0, left:-16 }}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#8B5CF6" fill="url(#mg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 2 }}>Hourly Traffic Heatmap</div>
        <div className="section-sub" style={{ marginBottom: 18 }}>Request intensity by day and hour — hover for details</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 660 }}>
            <div style={{ display:'grid', gridTemplateColumns:'44px repeat(24,1fr)', gap:2.5, alignItems:'center' }}>
              <div />
              {Array.from({ length:24 }, (_,h) => (
                <div key={h} style={{ fontSize:9, color:'var(--text-5)', textAlign:'center', paddingBottom:4 }}>
                  {h.toString().padStart(2,'0')}
                </div>
              ))}
              {DAYS.map((day, di) => (
                <React.Fragment key={di}>
                  <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:500, paddingRight:8, textAlign:'right' }}>{day}</div>
                  {Array.from({ length:24 }, (_,h) => {
                    const v = grid[di][h];
                    return (
                      <div
                        key={`${di}-${h}`}
                        title={`${day} ${h.toString().padStart(2,'0')}:00 — ${v.toLocaleString()} req`}
                        style={{
                          height:24, borderRadius:4, background:cellColor(v),
                          transition:'transform 0.12s, opacity 0.12s', cursor:'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.4)'; e.currentTarget.style.zIndex='10'; e.currentTarget.style.position='relative'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.zIndex='0'; }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, fontSize:11, color:'var(--text-4)' }}>
          <span>Low</span>
          {['rgba(37,99,235,0.14)','#60A5FA','#3b82f6','#2563EB','#1d4ed8'].map(c => (
            <div key={c} style={{ width:16, height:16, background:c, borderRadius:3 }} />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
