import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
  username: string; // we map this to email for Firebase
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
    // Setup initial admin if not exists
    

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // First time setup: create admin doc if it's the first user ever?
            // Actually, if document doesn't exist, log them out or setup basic user doc.
            // Setup initial admin if they match some condition, but here we just sign out
            setUser(null);
            await firebaseSignOut(auth);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      // In this app we used 'username', but firebase needs email. 
      // If the user inputs 'admin', we map it to 'admin@example.com'.
      let email = username;
      if (!email.includes('@')) {
         email = `${username}@example.com`;
      }
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found') {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr: any) {
             if (createErr.code === 'auth/operation-not-allowed') {
                throw new Error("Email/Password authentication is not enabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
             }
             if (createErr.code === 'auth/weak-password') {
                throw new Error("Password is too weak. Please use at least 6 characters (e.g., 'admin123').");
             }
             throw createErr;
          }
        } else {
          throw signInErr;
        }
      }
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Fallback for missing permissions
        if (!data.permissions && data.role === 'Admin') {
          data.permissions = { Dashboard: 'Full', Sales: 'Full', Repair: 'Full', Settings: 'Full' };
        }
        setUser({ uid: userCredential.user.uid, ...data } as User);
      } else {
        // Just in case it's the very first login and they created account via console
        const newUser: Omit<User, 'uid'> = {
          username,
          email,
          name: username,
          role: 'Admin', // Default to admin for first user setup
          permissions: {
            Dashboard: 'Full',
            Sales: 'Full',
            Repair: 'Full',
            Settings: 'Full'
          }
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
        setUser({ uid: userCredential.user.uid, ...newUser });
      }
      
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
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
