import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<Config>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, ...newConfig })
      });
      if (res.ok) {
        setConfig({ ...config, ...newConfig });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetToDefault = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_CONFIG)
      });
      if (res.ok) {
        setConfig(DEFAULT_CONFIG);
      }
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
