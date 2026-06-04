import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  signInAnonymously,
  onAuthStateChanged, 
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

type Role = 'admin' | 'sales';

interface User {
  uid: string;
  name: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (role: Role) => {
    try {
      setLoading(true);
      // Use Anonymous Auth to get a session for Firestore rules
      const { user: firebaseUser } = await signInAnonymously(auth);
      const userPath = `users/${firebaseUser.uid}`;
      
      const userData: User = {
        uid: firebaseUser.uid,
        name: role === 'admin' ? 'Austin Martin' : 'Sarah Simpson',
        role: role,
        email: role === 'admin' ? 'austin@repairtech.com' : 'sarah@repairtech.com',
        firstName: role === 'admin' ? 'Austin' : 'Sarah',
        lastName: role === 'admin' ? 'Martin' : 'Simpson',
        phone: role === 'admin' ? '+09-345-346-46' : '+09-123-456-78',
        bio: role === 'admin' ? 'UI/UX Designer' : 'Sales Specialist',
        avatarUrl: role === 'admin' 
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2574&auto=format&fit=crop'
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      setUser(userData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser?.uid || 'unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    const userPath = `users/${user.uid}`;
    
    // Auto-update full name if first or last name changes
    const updatedData = { ...newData };
    if (updatedData.firstName !== undefined || updatedData.lastName !== undefined) {
      const newFirstName = updatedData.firstName ?? user.firstName ?? '';
      const newLastName = updatedData.lastName ?? user.lastName ?? '';
      updatedData.name = `${newFirstName} ${newLastName}`.trim();
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...user, ...updatedData }, { merge: true });
      setUser(prev => prev ? { ...prev, ...updatedData } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
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
