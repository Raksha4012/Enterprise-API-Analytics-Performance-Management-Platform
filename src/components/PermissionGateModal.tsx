import { ShieldAlert, X, Send } from 'lucide-react';
import RbacMatrix, { UserRole } from './RbacMatrix';
import { useToast } from '../context/ToastContext';

interface PermissionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: UserRole;
  currentRole?: UserRole;
  actionName?: string;
  onRequestUpgrade?: () => void;
}

export default function PermissionGateModal({
  isOpen,
  onClose,
  currentRole = 'Viewer',
  actionName = 'perform this action',
  onRequestUpgrade,
}: PermissionGateModalProps) {
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSendRequest = () => {
    if (onRequestUpgrade) {
      onRequestUpgrade();
    } else {
      toast('info', 'Upgrade Request Sent', `Your request to upgrade from ${currentRole} to Admin has been sent to system administrators.`);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999 }}>
      <div
        className="modal-panel scale-in"
        style={{
          width: 580,
          padding: 0,
          overflow: 'hidden',
          background: '#0B1120',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(239, 68, 68, 0.08)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F87171',
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                Access Restricted — Admin Approval Required
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
                Your current role (<span style={{ color: '#60A5FA', fontWeight: 600 }}>{currentRole}</span>) does not have permission to {actionName}.
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--text-4)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Matrix & Info */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Refer to the <strong>RBAC Permissions Matrix</strong> below to view the features accessible to each user role.
          </div>

          <RbacMatrix highlightRole={currentRole} compact />

          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 12.5,
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <strong style={{ color: '#60A5FA' }}>Need elevated permissions?</strong>
              <div style={{ color: 'var(--text-4)', fontSize: 11.5, marginTop: 2 }}>
                Submit a permission upgrade request to your workspace Administrator.
              </div>
            </div>
            <button
              onClick={handleSendRequest}
              className="btn btn-primary"
              style={{ flexShrink: 0, gap: 6, fontSize: 12, height: 36, padding: '0 14px' }}
            >
              <Send size={13} /> Request Upgrade
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
