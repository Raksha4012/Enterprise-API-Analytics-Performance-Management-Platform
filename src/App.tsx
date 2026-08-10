import { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { UserProvider, useUsers } from './context/UserContext';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PermissionGateModal from './components/PermissionGateModal';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ApiRegistry from './pages/ApiRegistry';
import ApiDetail from './pages/ApiDetail';
import ResponseTimeAnalytics from './pages/ResponseTimeAnalytics';
import ErrorAnalytics from './pages/ErrorAnalytics';
import ApiHealth from './pages/ApiHealth';
import MLPredictions from './pages/MLPredictions';
import AnomalyDetection from './pages/AnomalyDetection';
import TrafficAnalytics from './pages/TrafficAnalytics';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

type Page =
  | 'dashboard' | 'health' | 'traffic' | 'response-time' | 'errors'
  | 'ml-predictions' | 'anomaly' | 'registry' | 'api-detail'
  | 'reports' | 'users' | 'settings';

function AppShell() {
  const { currentUser, canAccess } = useUsers();
  const [authed, setAuthed]             = useState(() => localStorage.getItem('apipulse_authed') === 'true');
  const [loading, setLoading]           = useState(false);
  const [activePage, setActivePage]     = useState<Page>('dashboard');
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [selectedApi, setSelectedApi]   = useState(1);
  const [refreshKey, setRefreshKey]     = useState(0);

  // Restricted Access Modal state
  const [gateOpen, setGateOpen]         = useState(false);
  const [gateAction, setGateAction]     = useState('');

  const handleLogin = () => {
    localStorage.setItem('apipulse_authed', 'true');
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('apipulse_authed');
    setAuthed(false);
    setLoading(false);
    setActivePage('dashboard');
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  if (!authed && !loading) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (loading) {
    return <LoadingScreen onDone={() => { setLoading(false); setAuthed(true); }} />;
  }

  const navigate = (page: string) => {
    if ((page === 'registry' || page === 'api-detail') && !canAccess('apis')) {
      setGateAction('access API Registry & Management');
      setGateOpen(true);
      return;
    }
    if (page === 'reports' && !canAccess('reports')) {
      setGateAction('create or view Reports');
      setGateOpen(true);
      return;
    }
    if (page === 'users' && !canAccess('users')) {
      setGateAction('access User Management');
      setGateOpen(true);
      return;
    }
    if (page === 'settings' && !canAccess('settings')) {
      setGateAction('access Configure Settings');
      setGateOpen(true);
      return;
    }
    setActivePage(page as Page);
    setMobileOpen(false);
  };

  const viewDetail = (id: number) => {
    setSelectedApi(id);
    setActivePage('api-detail');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':     return <Dashboard />;
      case 'health':        return <ApiHealth />;
      case 'traffic':       return <TrafficAnalytics />;
      case 'response-time': return <ResponseTimeAnalytics />;
      case 'errors':        return <ErrorAnalytics />;
      case 'ml-predictions':return <MLPredictions />;
      case 'anomaly':       return <AnomalyDetection />;
      case 'registry':      return <ApiRegistry onViewDetail={viewDetail} />;
      case 'api-detail':    return <ApiDetail apiId={selectedApi} onBack={() => setActivePage('registry')} />;
      case 'reports':       return <Reports />;
      case 'users':         return <UserManagement />;
      case 'settings':      return <Settings />;
      default:              return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}
      className="gradient-bg">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar
          activePage={activePage}
          onMobileMenuOpen={() => setMobileOpen(true)}
          onRefresh={handleRefresh}
        />
        <div
          key={`${activePage}-${refreshKey}`}
          className="scroll-area fade-in"
          style={{ flex: 1 }}
        >
          {renderPage()}
        </div>
      </div>

      {/* Permission Gate Modal */}
      <PermissionGateModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        currentRole={currentUser?.role}
        actionName={gateAction}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <AppShell />
      </UserProvider>
    </ToastProvider>
  );
}
