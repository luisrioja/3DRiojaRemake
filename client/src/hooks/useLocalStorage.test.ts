import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaultValue when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('missing-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('my-key', JSON.stringify('saved-value'));
    const { result } = renderHook(() => useLocalStorage('my-key', 'default'));
    expect(result.current[0]).toBe('saved-value');
  });

  it('writes value to localStorage and updates state', () => {
    const { result } = renderHook(() => useLocalStorage('my-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('my-key')!)).toBe('updated');
  });

  it('handles object values', () => {
    const defaultObj = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('obj-key', defaultObj));

    expect(result.current[0]).toEqual(defaultObj);

    const newObj = { name: 'updated', count: 42 };
    act(() => {
      result.current[1](newObj);
    });

    expect(result.current[0]).toEqual(newObj);
    expect(JSON.parse(localStorage.getItem('obj-key')!)).toEqual(newObj);
  });

  it('handles array values', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('arr-key', []));

    act(() => {
      result.current[1]([1, 2, 3]);
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('returns defaultValue when localStorage contains invalid JSON', () => {
    localStorage.setItem('bad-json', '{not valid json!!!');
    const { result } = renderHook(() => useLocalStorage('bad-json', 'safe-default'));
    expect(result.current[0]).toBe('safe-default');
  });

  it('handles boolean values', () => {
    localStorage.setItem('bool-key', JSON.stringify(true));
    const { result } = renderHook(() => useLocalStorage('bool-key', false));
    expect(result.current[0]).toBe(true);
  });

  it('handles numeric values', () => {
    const { result } = renderHook(() => useLocalStorage('num-key', 0));

    act(() => {
      result.current[1](99);
    });

    expect(result.current[0]).toBe(99);
    expect(JSON.parse(localStorage.getItem('num-key')!)).toBe(99);
  });
});
