import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { NavigationMode } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STORAGE_KEY = '3drioja-nav-mode';
const DEFAULT_MODE: NavigationMode = 'desktop';

export interface ModeContextValue {
  mode: NavigationMode;
  toggleMode: () => void;
  setMode: (mode: NavigationMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setStoredMode] = useLocalStorage<NavigationMode>(STORAGE_KEY, DEFAULT_MODE);

  const setMode = useCallback(
    (newMode: NavigationMode) => {
      setStoredMode(newMode);
    },
    [setStoredMode],
  );

  const toggleMode = useCallback(() => {
    setStoredMode(mode === 'desktop' ? 'classic' : 'desktop');
  }, [mode, setStoredMode]);

  const value = useMemo<ModeContextValue>(
    () => ({ mode, toggleMode, setMode }),
    [mode, toggleMode, setMode],
  );

  return (
    <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
  );
}

export function useModeContext(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }
  return ctx;
}
