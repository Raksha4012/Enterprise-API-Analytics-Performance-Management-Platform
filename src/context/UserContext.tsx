import { createContext, useContext, useState, ReactNode } from 'react';
import { hasRolePermission } from '../components/RbacMatrix';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'Admin' | 'Developer' | 'Viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  apis: number;
  createdAt: string;
}

export type AuthResultStatus = 'success' | 'pending' | 'inactive' | 'invalid';

export interface AuthResult {
  user?: AppUser;
  status: AuthResultStatus;
  message?: string;
}

const SEED: AppUser[] = [
  { id: 10, name: 'System Admin',     email: 'admin@acme.com',        username: 'admin',        password: 'admin',         role: 'Admin',     department: 'Executive',  status: 'active',   lastLogin: '2026-08-10 15:40', apis: 40, createdAt: '2025-01-01' },
  { id: 1,  name: 'Alexandra Chen',   email: 'alex.chen@acme.com',    username: 'alex.chen',    password: 'Admin@2026',    role: 'Admin',     department: 'Platform',   status: 'active',   lastLogin: '2026-08-04 09:42', apis: 24, createdAt: '2025-01-15' },
  { id: 2,  name: 'Marcus Johnson',   email: 'm.johnson@acme.com',     username: 'marcus.j',     password: 'Dev@2026!',     role: 'Developer', department: 'Payments',   status: 'active',   lastLogin: '2026-08-04 08:15', apis: 12, createdAt: '2025-02-20' },
  { id: 3,  name: 'Sarah Williams',   email: 's.williams@acme.com',    username: 'sarah.w',      password: 'Dev@2026!',     role: 'Developer', department: 'Commerce',   status: 'active',   lastLogin: '2026-08-03 17:33', apis: 8,  createdAt: '2025-03-11' },
  { id: 4,  name: 'David Park',       email: 'd.park@acme.com',        username: 'david.park',   password: 'View@2026!',    role: 'Viewer',    department: 'Analytics',  status: 'active',   lastLogin: '2026-08-04 10:01', apis: 0,  createdAt: '2025-04-05' },
  { id: 5,  name: 'Emma Rodriguez',   email: 'e.rodriguez@acme.com',   username: 'emma.rod',     password: 'Dev@2026!',     role: 'Developer', department: 'Data',       status: 'inactive', lastLogin: '2026-07-28 14:22', apis: 6,  createdAt: '2025-05-18' },
  { id: 6,  name: 'James Wilson',     email: 'j.wilson@acme.com',      username: 'james.w',      password: 'Admin@2026',    role: 'Admin',     department: 'Security',   status: 'active',   lastLogin: '2026-08-04 07:58', apis: 31, createdAt: '2025-01-08' },
  { id: 7,  name: 'Priya Patel',      email: 'p.patel@acme.com',       username: 'priya.p',      password: 'Dev@2026!',     role: 'Developer', department: 'Search',     status: 'active',   lastLogin: '2026-08-04 09:17', apis: 15, createdAt: '2025-06-22' },
  { id: 8,  name: 'Carlos Mendez',    email: 'c.mendez@acme.com',      username: 'carlos.m',     password: 'View@2026!',    role: 'Viewer',    department: 'Operations', status: 'active',   lastLogin: '2026-08-03 15:44', apis: 0,  createdAt: '2025-07-01' },
  { id: 9,  name: 'Yuki Tanaka',      email: 'y.tanaka@acme.com',      username: 'yuki.t',       password: 'Dev@2026!',     role: 'Developer', department: 'Platform',   status: 'pending',  lastLogin: '—',                apis: 0,  createdAt: '2026-08-04' },
];

interface UserContextValue {
  users: AppUser[];
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  addUser: (u: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin' | 'apis'>) => AppUser;
  requestAccess: (u: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin' | 'apis' | 'status'>) => AppUser;
  updateUser: (id: number, patch: Partial<AppUser>) => void;
  deleteUser: (id: number) => void;
  approveUser: (id: number) => void;
  rejectUser: (id: number) => void;
  recordLogin: (id: number) => void;
  findByCredential: (identifier: string, password: string) => AuthResult;
  switchUser: (id: number) => void;
  canAccess: (permissionKey: string) => boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

const generateUsersCsv = (usersList: AppUser[]) => {
  const headers = ['id', 'name', 'email', 'username', 'password', 'role', 'department', 'status', 'lastLogin', 'apis', 'createdAt'];
  const rows = usersList.map(u => [
    u.id, `"${u.name}"`, u.email, u.username, u.password, u.role, u.department, u.status, `"${u.lastLogin}"`, u.apis, u.createdAt
  ]);
  return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
};

const saveUsersToStorage = (usersList: AppUser[]) => {
  try {
    const csvStr = generateUsersCsv(usersList);
    localStorage.setItem('apipulse_users', JSON.stringify(usersList));
    localStorage.setItem('apipulse_users_csv', csvStr);

    fetch('/api/sync-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'data/users.csv', csvContent: csvStr }),
    }).catch(err => console.error('Disk CSV sync error:', err));
  } catch (e) {
    console.error('Failed saving users to storage:', e);
  }
};

const mergeUsersWithSeed = (saved: AppUser[]): AppUser[] => {
  const map = new Map<number, AppUser>();
  SEED.forEach(u => map.set(u.id, u));
  saved.forEach(u => map.set(u.id, u));
  return Array.from(map.values());
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('apipulse_users');
      return saved ? mergeUsersWithSeed(JSON.parse(saved)) : SEED;
    } catch {
      return SEED;
    }
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(users[0] || SEED[0]); // System Admin

  const addUser = (u: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin' | 'apis'>): AppUser => {
    const next: AppUser = {
      ...u,
      id: Date.now(),
      lastLogin: '—',
      apis: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextUsers = [next, ...users];
    setUsers(nextUsers);
    saveUsersToStorage(nextUsers);
    return next;
  };

  const requestAccess = (u: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin' | 'apis' | 'status'>): AppUser => {
    const next: AppUser = {
      ...u,
      status: 'pending',
      id: Date.now(),
      lastLogin: '—',
      apis: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextUsers = [next, ...users];
    setUsers(nextUsers);
    saveUsersToStorage(nextUsers);
    return next;
  };

  const updateUser = (id: number, patch: Partial<AppUser>) => {
    const nextUsers = users.map(u => u.id === id ? { ...u, ...patch } : u);
    setUsers(nextUsers);
    saveUsersToStorage(nextUsers);
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...patch } : null);
    }
  };

  const recordLogin = (id: number) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    updateUser(id, { lastLogin: nowStr });
  };

  const approveUser = (id: number) => {
    updateUser(id, { status: 'active' });
  };

  const rejectUser = (id: number) => {
    deleteUser(id);
  };

  const deleteUser = (id: number) => {
    const nextUsers = users.filter(u => u.id !== id);
    setUsers(nextUsers);
    saveUsersToStorage(nextUsers);
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
  };

  const switchUser = (id: number) => {
    const found = users.find(u => u.id === id);
    if (found) setCurrentUser(found);
  };

  const canAccess = (permissionKey: string): boolean => {
    if (!currentUser) return false;
    return hasRolePermission(currentUser.role, permissionKey);
  };

  const findByCredential = (identifier: string, password: string): AuthResult => {
    const id = identifier.toLowerCase().trim();
    const pw = password.trim();

    let user = users.find(u =>
      (u.email.toLowerCase() === id || u.username.toLowerCase() === id || (id === 'admin' && u.role === 'Admin')) &&
      (u.password === pw || (u.role === 'Admin' && (pw === 'admin' || pw === 'Admin@2026')))
    );

    // Fallback for admin
    if (!user && (id === 'admin' || id === 'admin@acme.com' || id === 'alex.chen') && (pw === 'admin' || pw === 'Admin@2026')) {
      user = SEED[0];
    }

    if (!user) {
      return { status: 'invalid', message: 'Invalid credentials or username.' };
    }

    if (user.status === 'pending') {
      return { user, status: 'pending', message: 'Your access request is currently pending Admin approval. Please contact your administrator.' };
    }

    if (user.status === 'inactive') {
      return { user, status: 'inactive', message: 'This account has been deactivated. Please contact your administrator.' };
    }

    return { user, status: 'success' };
  };

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      setCurrentUser,
      addUser,
      requestAccess,
      updateUser,
      deleteUser,
      approveUser,
      rejectUser,
      recordLogin,
      findByCredential,
      switchUser,
      canAccess,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used inside UserProvider');
  return ctx;
}
