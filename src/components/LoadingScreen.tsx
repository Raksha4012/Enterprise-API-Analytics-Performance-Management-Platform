import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
  'Authenticating session…',
  'Loading API registry…',
  'Fetching analytics data…',
  'Initializing ML models…',
  'Ready',
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= steps.length - 1) { clearInterval(interval); setTimeout(onDone, 300); return s; }
        return s + 1;
      });
      setProgress(p => Math.min(100, p + 22));
    }, 420);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.10) 0%, transparent 65%), #0B1120',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
      }}
    >
      {/* Logo mark */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #1d4ed8, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(37,99,235,0.45)',
            animation: 'float 2.4s ease-in-out infinite',
          }}
        >
          <Zap size={32} color="white" />
        </div>
        {/* Orbit ring */}
        <div style={{
          position: 'absolute', inset: -12,
          borderRadius: '50%',
          border: '1px solid rgba(37,99,235,0.3)',
          animation: 'spin 3s linear infinite',
        }}>
          <div style={{
            position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
            width: 6, height: 6, borderRadius: '50%', background: '#2563EB',
            boxShadow: '0 0 8px #2563EB',
          }} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          ApiPulse Enterprise
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Performance Management Platform
        </div>
      </div>

      {/* Progress */}
      <div style={{ width: 280 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{steps[step]}</span>
          <span style={{ fontSize: 12, color: 'var(--text-4)' }} className="mono">{progress}%</span>
        </div>
        <div className="progress">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
              boxShadow: '0 0 8px rgba(37,99,235,0.6)',
            }}
          />
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i <= step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i <= step ? 'var(--primary)' : 'rgba(100,116,139,0.25)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
