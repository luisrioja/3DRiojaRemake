import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import type { WindowState } from '../types';

// --- Action Types ---

export type WindowAction =
  | { type: 'OPEN'; payload: { id: string; title: string; icon?: string } }
  | { type: 'CLOSE'; payload: { id: string } }
  | { type: 'MINIMIZE'; payload: { id: string } }
  | { type: 'MAXIMIZE'; payload: { id: string } }
  | { type: 'RESTORE'; payload: { id: string } }
  | { type: 'MOVE'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'RESIZE'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'FOCUS'; payload: { id: string } };

// --- Context Value ---

export interface WindowContextValue {
  windows: WindowState[];
  dispatch: React.Dispatch<WindowAction>;
  getWindow: (id: string) => WindowState | undefined;
  openWindows: WindowState[];
  focusedWindowId: string | null;
}

// --- Helpers ---

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 400, height: 300 };

function getMaxZIndex(windows: WindowState[]): number {
  if (windows.length === 0) return 0;
  return Math.max(...windows.map((w) => w.zIndex));
}

// --- Reducer ---

export function windowReducer(state: WindowState[], action: WindowAction): WindowState[] {
  switch (action.type) {
    case 'OPEN': {
      const existing = state.find((w) => w.id === action.payload.id);
      if (existing) {
        // If window already exists, just focus it
        const newZ = getMaxZIndex(state) + 1;
        return state.map((w) =>
          w.id === action.payload.id
            ? { ...w, zIndex: newZ, isMinimized: false }
            : w,
        );
      }
      const newZ = getMaxZIndex(state) + 1;
      const newWindow: WindowState = {
        id: action.payload.id,
        title: action.payload.title,
        icon: action.payload.icon,
        position: { ...DEFAULT_POSITION },
        size: { ...DEFAULT_SIZE },
        isMinimized: false,
        isMaximized: false,
        zIndex: newZ,
      };
      return [...state, newWindow];
    }

    case 'CLOSE': {
      return state.filter((w) => w.id !== action.payload.id);
    }

    case 'MINIMIZE': {
      return state.map((w) =>
        w.id === action.payload.id ? { ...w, isMinimized: true } : w,
      );
    }

    case 'MAXIMIZE': {
      return state.map((w) =>
        w.id === action.payload.id
          ? { ...w, isMaximized: true, isMinimized: false }
          : w,
      );
    }

    case 'RESTORE': {
      return state.map((w) =>
        w.id === action.payload.id
          ? { ...w, isMinimized: false, isMaximized: false }
          : w,
      );
    }

    case 'MOVE': {
      return state.map((w) =>
        w.id === action.payload.id
          ? { ...w, position: action.payload.position }
          : w,
      );
    }

    case 'RESIZE': {
      return state.map((w) =>
        w.id === action.payload.id
          ? { ...w, size: action.payload.size }
          : w,
      );
    }

    case 'FOCUS': {
      const newZ = getMaxZIndex(state) + 1;
      return state.map((w) =>
        w.id === action.payload.id
          ? { ...w, zIndex: newZ, isMinimized: false }
          : w,
      );
    }

    default:
      return state;
  }
}

// --- Context ---

const WindowContext = createContext<WindowContextValue | null>(null);

// --- Provider ---

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [windows, dispatch] = useReducer(windowReducer, []);

  const getWindow = useCallback(
    (id: string) => windows.find((w) => w.id === id),
    [windows],
  );

  const openWindows = useMemo(
    () => windows.filter((w) => !w.isMinimized),
    [windows],
  );

  const focusedWindowId = useMemo(() => {
    if (windows.length === 0) return null;
    const sorted = [...windows].sort((a, b) => b.zIndex - a.zIndex);
    return sorted[0].id;
  }, [windows]);

  const value = useMemo<WindowContextValue>(
    () => ({ windows, dispatch, getWindow, openWindows, focusedWindowId }),
    [windows, dispatch, getWindow, openWindows, focusedWindowId],
  );

  return (
    <WindowContext.Provider value={value}>{children}</WindowContext.Provider>
  );
}

// --- Hook ---

export function useWindowContext(): WindowContextValue {
  const ctx = useContext(WindowContext);
  if (!ctx) {
    throw new Error('useWindowContext must be used within a WindowProvider');
  }
  return ctx;
}
