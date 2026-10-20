import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export type Role = 'Admin' | 'Manager' | 'Sales Officer' | 'Technician';
export type AccessLevel = 'None' | 'View' | 'Full';

export interface Permissions {
  Dashboard: AccessLevel;
  Sales: AccessLevel;
  Repair: AccessLevel;
  Settings: AccessLevel;
}

export const ROLE_PERMISSION_TEMPLATES: Record<Role, Permissions> = {
  'Admin': {
    Dashboard: 'Full',
    Sales: 'Full',
    Repair: 'Full',
    Settings: 'Full'
  },
  'Manager': {
    Dashboard: 'Full',
    Sales: 'Full',
    Repair: 'Full',
    Settings: 'View'
  },
  'Sales Officer': {
    Dashboard: 'View',
    Sales: 'Full',
    Repair: 'View',
    Settings: 'None'
  },
  'Technician': {
    Dashboard: 'View',
    Sales: 'None',
    Repair: 'Full',
    Settings: 'None'
  }
};

export interface User {
  uid: string;
  username: string;
  name: string;
  role: Role;
  permissions: Permissions;
  active: boolean;
  email?: string;
  authEmail?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: any;
  lastLogin?: any;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists() && userDoc.data()?.active !== false) {
            const data = userDoc.data();
            // Provide role template fallback if missing
            const role = (data.role as Role) || 'Sales Officer';
            const permissions = data.permissions || ROLE_PERMISSION_TEMPLATES[role] || ROLE_PERMISSION_TEMPLATES['Sales Officer'];
            
            setUser({ 
              uid: firebaseUser.uid, 
              active: data.active ?? true, 
              ...data,
              role,
              permissions,
              mustChangePassword: !!data.mustChangePassword
            } as User);
          } else {
            setUser(null);
            await firebaseSignOut(auth);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state error:", err);
        setUser(null);
        await firebaseSignOut(auth);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  const login = async (usernameInput: string, passwordInput: string) => {
    setLoading(true);
    try {
      const cleanUsername = usernameInput.trim().toLowerCase();
      if (!cleanUsername) {
        throw new Error("Please enter your username.");
      }
      if (!passwordInput) {
        throw new Error("Please enter your password.");
      }

      // Step 1: Generate candidate email addresses for Firebase Auth
      const candidates: string[] = [];
      if (cleanUsername.includes('@')) {
        candidates.push(cleanUsername);
      } else {
        candidates.push(`${cleanUsername}@${auth.app.options.authDomain || 'internal.app'}`);
        candidates.push(`${cleanUsername}@example.com`);
      }

      // Step 2: Sign in with Firebase Auth using candidate email and password
      let userCredential = null;
      for (const emailCandidate of candidates) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, emailCandidate, passwordInput);
          if (userCredential) break;
        } catch (err: any) {
          // Continue to next candidate if not found
        }
      }

      if (!userCredential) {
        throw new Error("Invalid username or password");
      }

      // Step 3: Verify user document in Firestore and check active status
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      } catch (docErr: any) {
        await firebaseSignOut(auth);
        setUser(null);
        throw new Error("Your account is not active. Contact an administrator.");
      }

      if (!userDoc.exists() || userDoc.data()?.active === false) {
        await firebaseSignOut(auth);
        setUser(null);
        throw new Error("Your account is not active. Contact an administrator.");
      }

      const data = userDoc.data();
      const role = (data.role as Role) || 'Sales Officer';
      const permissions = data.permissions || ROLE_PERMISSION_TEMPLATES[role] || ROLE_PERMISSION_TEMPLATES['Sales Officer'];

      // Record login in background
      try {
        const token = await userCredential.user.getIdToken();
        fetch('/api/auth/record-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      } catch (_) {}

      setUser({ 
        uid: userCredential.user.uid, 
        active: data.active ?? true, 
        ...data,
        role,
        permissions,
        mustChangePassword: !!data.mustChangePassword
      } as User);
      
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), newData as any);
      setUser({ ...user, ...newData });
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to update user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, getIdToken }}>
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
