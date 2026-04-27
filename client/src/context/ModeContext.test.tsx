import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ModeProvider, useModeContext } from './ModeContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ModeProvider>{children}</ModeProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('ModeContext', () => {
  it('defaults to desktop mode when no localStorage value', () => {
    const { result } = renderHook(() => useModeContext(), { wrapper });
    expect(result.current.mode).toBe('desktop');
  });

  it('reads persisted mode from localStorage', () => {
    localStorage.setItem('3drioja-nav-mode', JSON.stringify('classic'));
    const { result } = renderHook(() => useModeContext(), { wrapper });
    expect(result.current.mode).toBe('classic');
  });

  it('setMode updates mode and persists to localStorage', () => {
    const { result } = renderHook(() => useModeContext(), { wrapper });

    act(() => {
      result.current.setMode('classic');
    });

    expect(result.current.mode).toBe('classic');
    expect(JSON.parse(localStorage.getItem('3drioja-nav-mode')!)).toBe('classic');
  });

  it('toggleMode switches from desktop to classic', () => {
    const { result } = renderHook(() => useModeContext(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('classic');
    expect(JSON.parse(localStorage.getItem('3drioja-nav-mode')!)).toBe('classic');
  });

  it('toggleMode switches from classic to desktop', () => {
    localStorage.setItem('3drioja-nav-mode', JSON.stringify('classic'));
    const { result } = renderHook(() => useModeContext(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('desktop');
  });

  it('double toggle returns to original mode', () => {
    const { result } = renderHook(() => useModeContext(), { wrapper });
    const original = result.current.mode;

    act(() => {
      result.current.toggleMode();
    });
    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe(original);
  });

  it('throws when used outside ModeProvider', () => {
    expect(() => {
      renderHook(() => useModeContext());
    }).toThrow('useModeContext must be used within a ModeProvider');
  });

  it('falls back to desktop when localStorage has invalid JSON', () => {
    localStorage.setItem('3drioja-nav-mode', 'not-valid-json');
    const { result } = renderHook(() => useModeContext(), { wrapper });
    expect(result.current.mode).toBe('desktop');
  });
});
