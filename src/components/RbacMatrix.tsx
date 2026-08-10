import React from 'react';
import { Code2, Eye, Shield } from 'lucide-react';

export type UserRole = 'Admin' | 'Developer' | 'Viewer';

export interface PermissionItem {
  key: string;
  label: string;
  admin: boolean;
  developer: boolean;
  viewer: boolean;
}

export const MATRIX_PERMISSIONS: PermissionItem[] = [
  { key: 'dashboards', label: 'View Dashboards',    admin: true,  developer: true,  viewer: true  },
  { key: 'analytics',  label: 'View Analytics',     admin: true,  developer: true,  viewer: true  },
  { key: 'apis',       label: 'Manage APIs',        admin: true,  developer: true,  viewer: false },
  { key: 'reports',    label: 'Create Reports',     admin: true,  developer: true,  viewer: false },
  { key: 'export',     label: 'Export Data',        admin: true,  developer: true,  viewer: false },
  { key: 'users',      label: 'Manage Users',       admin: true,  developer: false, viewer: false },
  { key: 'settings',   label: 'Configure Settings', admin: true,  developer: false, viewer: false },
  { key: 'billing',    label: 'Billing & Usage',    admin: true,  developer: false, viewer: false },
];

export function hasRolePermission(role: UserRole, key: string): boolean {
  const perm = MATRIX_PERMISSIONS.find(p => p.key === key);
  if (!perm) return false;
  if (role === 'Admin') return perm.admin;
  if (role === 'Developer') return perm.developer;
  if (role === 'Viewer') return perm.viewer;
  return false;
}

interface RbacMatrixProps {
  compact?: boolean;
  highlightRole?: UserRole;
  style?: React.CSSProperties;
}

export default function RbacMatrix({ compact = false, highlightRole, style }: RbacMatrixProps) {
  return (
    <div
      style={{
        background: '#070B14',
        border: '1px solid rgba(0, 196, 255, 0.12)',
        borderRadius: 12,
        padding: compact ? '16px' : '22px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: compact ? 16 : 20 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          border: '1.5px solid rgba(0, 200, 255, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(0, 200, 255, 0.25)',
        }}>
          <Shield size={13} color="#00C8FF" />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 800, color: '#00C8FF',
          letterSpacing: '0.14em', fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase', textShadow: '0 0 10px rgba(0, 200, 255, 0.3)',
        }}>
          RBAC PERMISSIONS MATRIX
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{
                textAlign: 'left', padding: '8px 12px 14px 4px',
                fontSize: 10, fontWeight: 700, color: '#4E6E84',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                PERMISSION
              </th>
              
              {/* DEVELOPER pill */}
              <th style={{ textAlign: 'center', padding: '8px 12px 14px', width: '35%' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 14px', borderRadius: 20,
                  background: highlightRole === 'Developer' ? 'rgba(37,99,235,0.25)' : 'rgba(37, 99, 235, 0.14)',
                  border: `1px solid ${highlightRole === 'Developer' ? '#3B82F6' : 'rgba(37, 99, 235, 0.35)'}`,
                  color: '#60A5FA', fontSize: 11, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
                  boxShadow: highlightRole === 'Developer' ? '0 0 14px rgba(59, 130, 246, 0.4)' : 'none',
                }}>
                  <Code2 size={11} /> DEVELOPER
                </div>
              </th>

              {/* VIEWER pill */}
              <th style={{ textAlign: 'center', padding: '8px 12px 14px', width: '35%' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 14px', borderRadius: 20,
                  background: highlightRole === 'Viewer' ? 'rgba(148,163,184,0.25)' : 'rgba(148, 163, 184, 0.10)',
                  border: `1px solid ${highlightRole === 'Viewer' ? '#94A3B8' : 'rgba(148, 163, 184, 0.25)'}`,
                  color: '#CBD5E1', fontSize: 11, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
                  boxShadow: highlightRole === 'Viewer' ? '0 0 14px rgba(148, 163, 184, 0.4)' : 'none',
                }}>
                  <Eye size={11} /> VIEWER
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_PERMISSIONS.map((perm, idx) => (
              <tr key={perm.key} style={{
                borderBottom: idx === MATRIX_PERMISSIONS.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
              }}>
                <td style={{
                  padding: '12px 12px 12px 4px', color: '#E2E8F0',
                  fontWeight: 500, fontSize: compact ? 12 : 13,
                }}>
                  {perm.label}
                </td>

                {/* Developer Check */}
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  {perm.developer ? (
                    <span style={{ color: '#00E599', fontWeight: 800, fontSize: 16 }}>✓</span>
                  ) : (
                    <span style={{ color: '#334155', fontSize: 16 }}>—</span>
                  )}
                </td>

                {/* Viewer Check */}
                <td style={{ textAlign: 'center', padding: '12px' }}>
                  {perm.viewer ? (
                    <span style={{ color: '#00E599', fontWeight: 800, fontSize: 16 }}>✓</span>
                  ) : (
                    <span style={{ color: '#334155', fontSize: 16 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
