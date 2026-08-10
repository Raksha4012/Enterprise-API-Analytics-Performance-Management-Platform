import { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ReferenceLine,
} from 'recharts';
import { Brain, Clock, Zap, Play, RefreshCw, TrendingUp, Activity } from 'lucide-react';
import { mlPrediction, trafficData, responseTimeData } from '../data/mockData';

// ─── Tiny in-browser ML implementations ──────────────────────────────────────

function linReg(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = num / den;
  const intercept = my - slope * mx;
  const r2 = (() => {
    const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0);
    const ssRes = ys.reduce((s, y, i) => s + (y - (slope * xs[i] + intercept)) ** 2, 0);
    return 1 - ssRes / ssTot;
  })();
  return { slope, intercept, r2, predict: (x: number) => slope * x + intercept };
}

function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) =>
    i < window - 1 ? null : values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window
  );
}

function exponentialSmoothing(values: number[], alpha: number): number[] {
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function seasonalPattern(values: number[], period: number): number[] {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.map((_, i) => {
    const samePhase = values.filter((__, j) => j % period === i % period);
    const phaseAvg = samePhase.reduce((a, b) => a + b, 0) / samePhase.length;
    return phaseAvg / avg;
  });
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FORECASTS = [
  { period: 'Next Hour', value: '5,920',   change: '+4.2%', conf: '94%', color: '#22C55E' },
  { period: 'Today',     value: '142,800', change: '+12.3%',conf: '89%', color: '#2563EB' },
  { period: 'This Week', value: '891,200', change: '+8.7%', conf: '82%', color: '#8B5CF6' },
  { period: 'This Month',value: '3.8M',    change: '+15.2%',conf: '74%', color: '#F59E0B' },
];

const PEAK_HOURS = [
  { h:'00',v:22},{ h:'01',v:14},{ h:'02',v:11},{ h:'03',v:9},
  { h:'04',v:12},{ h:'05',v:18},{ h:'06',v:28},{ h:'07',v:45},
  { h:'08',v:72},{ h:'09',v:88},{ h:'10',v:95},{ h:'11',v:98},
  { h:'12',v:100},{ h:'13',v:97},{ h:'14',v:94},{ h:'15',v:91},
  { h:'16',v:88},{ h:'17',v:78},{ h:'18',v:65},{ h:'19',v:54},
  { h:'20',v:42},{ h:'21',v:36},{ h:'22',v:30},{ h:'23',v:25},
];

const RECS = [
  { icon: '⚡', title: 'Scale Auth service', desc: 'Predicted 340% spike 12:00–14:00. Recommend 8 replicas.', pri: 'high' },
  { icon: '💾', title: 'Increase DB pool', desc: 'Payment API P95 forecast exceeds 800ms at peak. Expand 20→40.', pri: 'medium' },
  { icon: '🔄', title: 'Pre-warm CDN cache', desc: 'Product catalog expects 2.1M requests. Predicted 85% cache hit.', pri: 'low' },
];

const PRI_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' } as Record<string,string>;

const combined = [
  ...trafficData.slice(-4).map(d => ({ time: d.time, actual: d.requests })),
  { time: 'Now', actual: 5680, predicted: 5680 },
  ...mlPrediction.slice(1).map(d => ({ time: d.time, predicted: d.predicted, lower: d.lower, upper: d.upper })),
];

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong" style={{ borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-4)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p: any, i: number) => p.value != null && (
        <div key={i} style={{ color: p.color || p.fill || '#60A5FA', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── ML Models panel ──────────────────────────────────────────────────────────

type ModelId = 'linear' | 'ma' | 'ema' | 'seasonal';

const MODEL_META: { id: ModelId; name: string; desc: string; color: string; badge: string }[] = [
  { id: 'linear',   name: 'Linear Regression', desc: 'OLS trend line fitted to recent 24h traffic. Extrapolates next 6 data points.', color: '#2563EB', badge: 'Parametric' },
  { id: 'ma',       name: 'Moving Average',     desc: '3-point and 7-point moving averages smooth out noise for cleaner trend signals.', color: '#22C55E', badge: 'Non-Parametric' },
  { id: 'ema',      name: 'Exp. Smoothing',     desc: 'Exponentially weighted average (α=0.35) giving recency-weighted predictions.', color: '#8B5CF6', badge: 'Time-Series' },
  { id: 'seasonal', name: 'Seasonal Decompose', desc: 'Extracts daily seasonality pattern from response-time data (period=7 days).', color: '#F59E0B', badge: 'Decomposition' },
];

function useModelData(activeModel: ModelId) {
  return useMemo(() => {
    const values = trafficData.map(d => d.requests);
    const xs     = values.map((_, i) => i);

    if (activeModel === 'linear') {
      const model = linReg(xs, values);
      const extended = [...values, ...Array.from({ length: 6 }, (_, i) => 0)];
      return extended.map((v, i) => {
        const pred = Math.round(model.predict(i));
        const label = i < trafficData.length ? trafficData[i].time : `+${i - trafficData.length + 1}h`;
        return { time: label, actual: i < trafficData.length ? v : undefined, predicted: pred, r2: model.r2 };
      });
    }

    if (activeModel === 'ma') {
      const ma3 = movingAverage(values, 3);
      const ma7 = movingAverage(values, 7);
      return values.map((v, i) => ({
        time: trafficData[i].time,
        actual: v,
        ma3: ma3[i] != null ? Math.round(ma3[i]!) : undefined,
        ma7: ma7[i] != null ? Math.round(ma7[i]!) : undefined,
      }));
    }

    if (activeModel === 'ema') {
      const ema035 = exponentialSmoothing(values, 0.35);
      const ema070 = exponentialSmoothing(values, 0.70);
      return values.map((v, i) => ({
        time: trafficData[i].time,
        actual: v,
        ema35: Math.round(ema035[i]),
        ema70: Math.round(ema070[i]),
      }));
    }

    // seasonal
    const rtValues = responseTimeData.map(d => d.avg);
    const factors  = seasonalPattern(rtValues, 7);
    const avgVal   = rtValues.reduce((a, b) => a + b, 0) / rtValues.length;
    return responseTimeData.map((d, i) => ({
      time: d.date,
      actual: d.avg,
      detrended: Math.round(d.avg / (factors[i] || 1)),
      seasonal: Math.round(avgVal * (factors[i] || 1)),
    }));
  }, [activeModel]);
}

function ModelChart({ model, data }: { model: ModelId; data: any[] }) {
  if (model === 'linear') return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top:4, right:4, bottom:0, left:-16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TT />} />
        <ReferenceLine x={trafficData[trafficData.length-1].time} stroke="rgba(100,116,139,0.4)" strokeDasharray="4 2" />
        <Line type="monotone" dataKey="actual"    name="Actual"     stroke="#2563EB" strokeWidth={2.5} dot={false} connectNulls={false} />
        <Line type="monotone" dataKey="predicted" name="LR Predict" stroke="#60A5FA" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );

  if (model === 'ma') return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top:4, right:4, bottom:0, left:-16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TT />} />
        <Bar dataKey="actual" name="Actual" fill="rgba(34,197,94,0.2)" radius={[2,2,0,0]} />
        <Line type="monotone" dataKey="ma3" name="MA-3" stroke="#22C55E" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="ma7" name="MA-7" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );

  if (model === 'ema') return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top:4, right:4, bottom:0, left:-16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TT />} />
        <Bar dataKey="actual" name="Actual" fill="rgba(139,92,246,0.18)" radius={[2,2,0,0]} />
        <Line type="monotone" dataKey="ema35" name="EMA α=0.35" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="ema70" name="EMA α=0.70" stroke="#C084FC" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top:4, right:4, bottom:0, left:-16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TT />} />
        <Bar dataKey="actual"    name="Actual (ms)"    fill="rgba(245,158,11,0.2)" radius={[2,2,0,0]} />
        <Line type="monotone" dataKey="detrended" name="Detrended" stroke="#F59E0B" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="seasonal"  name="Seasonal"  stroke="#FCD34D" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MLPredictions() {
  const [activeModel, setActiveModel] = useState<ModelId>('linear');
  const [running, setRunning]         = useState(false);
  const [ran, setRan]                 = useState(false);

  const modelData = useModelData(activeModel);

  const runModel = () => {
    setRunning(true);
    setRan(false);
    setTimeout(() => { setRunning(false); setRan(true); }, 1200);
  };

  const meta = MODEL_META.find(m => m.id === activeModel)!;

  // compute live stats for linear model R²
  const r2 = activeModel === 'linear'
    ? linReg(trafficData.map((_,i) => i), trafficData.map(d => d.requests)).r2
    : null;

  return (
    <div className="page stagger">
      {/* Forecast cards */}
      <div className="grid-kpi">
        {FORECASTS.map(({ period, value, change, conf, color }) => (
          <div key={period} className="glass-card hover-lift" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11.5, color: 'var(--text-4)' }}>
              <Clock size={12} />{period}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 10 }}>{change} vs last period</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="progress" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: conf, background: color }} />
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-4)', flexShrink: 0 }}>{conf} conf.</span>
            </div>
          </div>
        ))}
      </div>

      {/* XGBoost forecast chart */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="section-title">Traffic Forecast — Confidence Band</div>
            <div className="section-sub">XGBoost ensemble · 96.1% accuracy · Updated 2 min ago</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)' }}>
            {[['#2563EB','Actual'],['#8B5CF6','Predicted'],['rgba(139,92,246,0.15)','Confidence']].map(([c,l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: l === 'Confidence' ? 8 : 2, background: c, display: 'inline-block', borderRadius: 1 }} />{l}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={combined} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<TT />} />
            <ReferenceLine x="Now" stroke="rgba(100,116,139,0.4)" strokeDasharray="4 2" label={{ value:'Now', fill:'var(--text-4)', fontSize:10 }} />
            <Area type="monotone" dataKey="upper"     fill="url(#confGrad)" stroke="none" />
            <Area type="monotone" dataKey="lower"     fill="var(--bg)"      stroke="none" />
            <Line type="monotone" dataKey="actual"    stroke="#2563EB" strokeWidth={2.5} dot={false} name="Actual"    connectNulls={false} />
            <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={2}   dot={false} name="Predicted" strokeDasharray="6 3" connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Basic ML Models panel ── */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Activity size={15} style={{ color: '#60A5FA' }} />
              <div className="section-title">Basic ML Model Explorer</div>
              <span style={{ fontSize: 10.5, background: 'rgba(37,99,235,0.12)', color: '#60A5FA', padding: '1px 7px', borderRadius: 5, fontWeight: 700 }}>
                Live · In-Browser
              </span>
            </div>
            <div className="section-sub">Select a model, click Run, and see real predictions computed from your traffic data</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: 34, fontSize: 12, gap: 6 }}
            onClick={runModel}
            disabled={running}
          >
            {running
              ? <><RefreshCw size={12} className="spin" /> Running…</>
              : <><Play size={12} /> {ran ? 'Re-run Model' : 'Run Model'}</>
            }
          </button>
        </div>

        {/* Model selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {MODEL_META.map(m => (
            <button key={m.id} onClick={() => { setActiveModel(m.id); setRan(false); }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: activeModel === m.id ? 700 : 500,
                border: `1px solid ${activeModel === m.id ? m.color : 'var(--border)'}`,
                background: activeModel === m.id ? `${m.color}18` : 'rgba(15,23,42,0.6)',
                color: activeModel === m.id ? m.color : 'var(--text-3)',
                transition: 'all 0.15s',
              }}>
              {m.name}
            </button>
          ))}
        </div>

        {/* Model description + stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, background: `${meta.color}09`, borderRadius: 10, padding: '12px 16px', border: `1px solid ${meta.color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Brain size={14} style={{ color: meta.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{meta.name}</span>
              <span style={{ fontSize: 10, background: `${meta.color}20`, color: meta.color, padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{meta.badge}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{meta.desc}</div>
          </div>

          {ran && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {activeModel === 'linear' && r2 !== null && (
                <>
                  <div style={{ background: 'rgba(37,99,235,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(37,99,235,0.15)', textAlign: 'center', minWidth: 90 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#60A5FA', letterSpacing: '-0.02em' }}>{(r2 * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>R² Score</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center', minWidth: 90 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#22C55E', letterSpacing: '-0.02em' }}>
                      {Math.round(linReg(trafficData.map((_,i)=>i), trafficData.map(d=>d.requests)).predict(trafficData.length)).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Next Prediction</div>
                  </div>
                </>
              )}
              {activeModel === 'ma' && (
                <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#22C55E' }}>
                    {Math.round(trafficData.slice(-3).reduce((s,d) => s + d.requests, 0) / 3).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>MA-3 Latest</div>
                </div>
              )}
              {activeModel === 'ema' && (
                <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6' }}>
                    {Math.round(exponentialSmoothing(trafficData.map(d=>d.requests), 0.35).at(-1)!).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>EMA α=0.35</div>
                </div>
              )}
              {activeModel === 'seasonal' && (
                <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(245,158,11,0.15)', textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>7-day</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Period</div>
                </div>
              )}
              <div style={{ background: 'rgba(100,116,139,0.08)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(100,116,139,0.15)', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-2)' }}>{trafficData.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Data Points</div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ opacity: ran ? 1 : 0.5, transition: 'opacity 0.4s', filter: ran ? 'none' : 'blur(1px)' }}>
          <ModelChart model={activeModel} data={modelData} />
        </div>

        {!ran && !running && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-4)', marginTop: 10 }}>
            Click <strong style={{ color: 'var(--text-2)' }}>Run Model</strong> to compute predictions from live traffic data
          </div>
        )}
      </div>

      {/* Peak + model accuracy */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Predicted Peak Hours</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Expected load index by hour of day</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={PEAK_HOURS} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} unit="%" domain={[0,110]} />
              <Tooltip content={<TT />} />
              <defs>
                <linearGradient id="peakG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <Bar dataKey="v" name="Load %" fill="url(#peakG)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Ensemble Model Accuracy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { name: 'XGBoost',       acc: 96.1, color: '#2563EB', desc: 'Gradient boosting · η=0.05 · 500 estimators' },
              { name: 'Random Forest', acc: 94.2, color: '#22C55E', desc: 'Ensemble · 200 trees · max depth 8' },
              { name: 'Prophet',       acc: 91.8, color: '#8B5CF6', desc: 'Additive · daily + weekly seasonality' },
              { name: 'Linear Reg.',   acc: r2 != null ? Math.round(r2 * 1000) / 10 : 87.3, color: '#60A5FA', desc: 'OLS trend · computed live from 24h data' },
            ].map(({ name, acc, color, desc }) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                    <Brain size={13} style={{ color }} />{name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{acc}%</span>
                </div>
                <div className="progress" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${acc}%`, background: color }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-5)', marginTop: 3 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI recommendations */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} style={{ color: '#F59E0B' }} />
          </div>
          <div className="section-title">AI Recommendations</div>
          <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
            {RECS.length} actions
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECS.map(({ icon, title, desc, pri }) => {
            const c = PRI_COLOR[pri];
            return (
              <div key={title} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: `${c}07`, border: `1px solid ${c}18`, borderRadius: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pri}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{desc}</div>
                </div>
                <button className="btn btn-primary" style={{ height: 30, fontSize: 11.5, flexShrink: 0, alignSelf: 'flex-start' }}>Apply</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
