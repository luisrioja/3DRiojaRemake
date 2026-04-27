import { useState, useCallback } from 'react';

/**
 * Hook for reading/writing typed values to localStorage with JSON serialization.
 * Gracefully handles parse errors by returning the default value.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key],
  );

  return [storedValue, setValue];
}
