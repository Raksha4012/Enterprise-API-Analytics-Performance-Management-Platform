import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center', gap: 12,
    }}>
      {icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-4)', marginBottom: 4,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{title}</div>
      {description && <div style={{ fontSize: 12.5, color: 'var(--text-4)', maxWidth: 280, lineHeight: 1.5 }}>{description}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
