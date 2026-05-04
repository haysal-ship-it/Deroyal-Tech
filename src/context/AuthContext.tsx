import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'admin' | 'sales';

interface User {
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: Role) => {
    if (role === 'admin') {
      setUser({ name: 'Julian D.', role: 'admin' });
    } else {
      setUser({ name: 'Sarah S.', role: 'sales' });
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
