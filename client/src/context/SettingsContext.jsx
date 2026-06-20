import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(j => { if (j.success) setSettings(j.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settings) return;
    localStorage.setItem('runlog-theme', settings.theme || 'system');
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      return;
    }
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      return;
    }
    // system
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark) => {
      if (dark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings?.theme]);

  const updateSettings = async (patch) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json.success) setSettings(json.data);
    return json;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
