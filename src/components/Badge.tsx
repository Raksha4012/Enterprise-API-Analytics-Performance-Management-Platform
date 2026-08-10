const STATUS = {
  healthy:  { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', dot: '#22C55E',  label: 'Healthy' },
  active:   { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', dot: '#22C55E',  label: 'Active' },
  warning:  { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', dot: '#F59E0B',  label: 'Warning' },
  slow:     { bg: 'rgba(249,115,22,0.12)', color: '#F97316', dot: '#F97316',  label: 'Slow' },
  error:    { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', dot: '#EF4444',  label: 'Error' },
  down:     { bg: 'rgba(239,68,68,0.14)',  color: '#EF4444', dot: '#EF4444',  label: 'Down' },
  inactive: { bg: 'rgba(100,116,139,0.12)',color: '#94A3B8', dot: '#94A3B8',  label: 'Inactive' },
  info:     { bg: 'rgba(6,182,212,0.12)',  color: '#06B6D4', dot: '#06B6D4',  label: 'Info' },
  resolved: { bg: 'rgba(100,116,139,0.12)',color: '#94A3B8', dot: '#94A3B8',  label: 'Resolved' },
};

const METHOD = {
  GET:    { bg: 'rgba(34,197,94,0.10)',   color: '#4ADE80' },
  POST:   { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
  PUT:    { bg: 'rgba(245,158,11,0.10)',  color: '#FBB43A' },
  PATCH:  { bg: 'rgba(139,92,246,0.12)', color: '#A78BFA' },
  DELETE: { bg: 'rgba(239,68,68,0.10)',  color: '#F87171' },
};

const ROLE = {
  Admin:     { bg: 'rgba(239,68,68,0.10)',  color: '#F87171' },
  Developer: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA' },
  Viewer:    { bg: 'rgba(100,116,139,0.10)',color: '#94A3B8' },
};

interface BadgeProps {
  type?: 'status' | 'method' | 'role';
  value: string;
  dot?: boolean;
}

export default function Badge({ type = 'status', value, dot = true }: BadgeProps) {
  let bg = 'rgba(100,116,139,0.10)';
  let color = '#94A3B8';
  let dotColor = '#94A3B8';
  let label = value;

  if (type === 'status') {
    const cfg = STATUS[value.toLowerCase() as keyof typeof STATUS] || STATUS.inactive;
    bg = cfg.bg; color = cfg.color; dotColor = cfg.dot; label = cfg.label;
  } else if (type === 'method') {
    const cfg = METHOD[value.toUpperCase() as keyof typeof METHOD];
    if (cfg) { bg = cfg.bg; color = cfg.color; }
    label = value.toUpperCase();
  } else if (type === 'role') {
    const cfg = ROLE[value as keyof typeof ROLE] || ROLE.Viewer;
    bg = cfg.bg; color = cfg.color;
  }

  return (
    <span className="badge" style={{ background: bg, color }}>
      {dot && type === 'status' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
      )}
      {label}
    </span>
  );
}
