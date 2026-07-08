import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Role = 'Admin' | 'Sales Officer';
export type AccessLevel = 'None' | 'View' | 'Full';

export interface Permissions {
  Dashboard: AccessLevel;
  Sales: AccessLevel;
  Repair: AccessLevel;
  Settings: AccessLevel;
}

export interface User {
  uid: string;
  username: string;
  name: string;
  role: Role;
  permissions: Permissions;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Setup initial admin if not exists
        await fetch('/api/auth/setup', { method: 'POST' });
        
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, ...newData })
      });
      if (res.ok) {
        setUser({ ...user, ...newData });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user');
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
