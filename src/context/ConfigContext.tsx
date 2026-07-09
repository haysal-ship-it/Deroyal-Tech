import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface Config {
  sidebarLogoUrl: string;
  sidebarName: string;
  loginImageUrl: string;
}

interface ConfigContextType {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const DEFAULT_CONFIG: Config = {
  sidebarLogoUrl: '',
  sidebarName: 'RepairTech',
  loginImageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2464&auto=format&fit=crop',
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as Config);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    }, (err) => {
      console.error("Error fetching config:", err);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig: Partial<Config>) => {
    try {
      const mergedConfig = { ...config, ...newConfig };
      await setDoc(doc(db, 'settings', 'branding'), mergedConfig, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const resetToDefault = async () => {
    try {
      await setDoc(doc(db, 'settings', 'branding'), DEFAULT_CONFIG);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetToDefault }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
