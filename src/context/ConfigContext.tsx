import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
  sidebarLogoUrl: '', // Will use a default icon if empty
  sidebarName: 'RepairTech',
  loginImageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2464&auto=format&fit=crop',
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'branding'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as Config);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/branding');
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig: Partial<Config>) => {
    const configPath = 'settings/branding';
    try {
      const configRef = doc(db, 'settings', 'branding');
      await setDoc(configRef, { ...config, ...newConfig }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, configPath);
    }
  };

  const resetToDefault = async () => {
    const configPath = 'settings/branding';
    try {
      const configRef = doc(db, 'settings', 'branding');
      await setDoc(configRef, DEFAULT_CONFIG);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, configPath);
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
