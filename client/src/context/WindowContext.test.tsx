import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { windowReducer, WindowProvider, useWindowContext } from './WindowContext';
import type { WindowState } from '../types';

// --- Pure reducer tests ---

describe('windowReducer', () => {
  const emptyState: WindowState[] = [];

  it('OPEN adds a new window with default position/size and highest zIndex', () => {
    const result = windowReducer(emptyState, {
      type: 'OPEN',
      payload: { id: 'w1', title: 'Test' },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'w1',
      title: 'Test',
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
    });
    expect(result[0].position).toEqual({ x: 100, y: 100 });
    expect(result[0].size).toEqual({ width: 400, height: 300 });
  });

  it('OPEN with existing id focuses the window instead of duplicating', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: true, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, {
      type: 'OPEN',
      payload: { id: 'w1', title: 'A' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].zIndex).toBe(2);
    expect(result[0].isMinimized).toBe(false);
  });

  it('CLOSE removes the window', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'CLOSE', payload: { id: 'w1' } });
    expect(result).toHaveLength(0);
  });

  it('MINIMIZE sets isMinimized to true', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'MINIMIZE', payload: { id: 'w1' } });
    expect(result[0].isMinimized).toBe(true);
  });

  it('MAXIMIZE sets isMaximized=true and isMinimized=false', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: true, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'MAXIMIZE', payload: { id: 'w1' } });
    expect(result[0].isMaximized).toBe(true);
    expect(result[0].isMinimized).toBe(false);
  });

  it('RESTORE sets isMinimized=false and isMaximized=false', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: true, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'RESTORE', payload: { id: 'w1' } });
    expect(result[0].isMinimized).toBe(false);
    expect(result[0].isMaximized).toBe(false);
  });

  it('MOVE updates position', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'MOVE', payload: { id: 'w1', position: { x: 50, y: 75 } } });
    expect(result[0].position).toEqual({ x: 50, y: 75 });
  });

  it('RESIZE updates size', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: false, zIndex: 1 },
    ];
    const result = windowReducer(state, { type: 'RESIZE', payload: { id: 'w1', size: { width: 500, height: 400 } } });
    expect(result[0].size).toEqual({ width: 500, height: 400 });
  });

  it('FOCUS brings window to front and un-minimizes', () => {
    const state: WindowState[] = [
      { id: 'w1', title: 'A', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: true, isMaximized: false, zIndex: 1 },
      { id: 'w2', title: 'B', position: { x: 0, y: 0 }, size: { width: 200, height: 200 }, isMinimized: false, isMaximized: false, zIndex: 2 },
    ];
    const result = windowReducer(state, { type: 'FOCUS', payload: { id: 'w1' } });
    expect(result[0].zIndex).toBe(3);
    expect(result[0].isMinimized).toBe(false);
    expect(result[1].zIndex).toBe(2); // unchanged
  });

  it('zIndex increments correctly across multiple opens', () => {
    let state = windowReducer(emptyState, { type: 'OPEN', payload: { id: 'w1', title: 'A' } });
    state = windowReducer(state, { type: 'OPEN', payload: { id: 'w2', title: 'B' } });
    state = windowReducer(state, { type: 'OPEN', payload: { id: 'w3', title: 'C' } });
    expect(state[0].zIndex).toBe(1);
    expect(state[1].zIndex).toBe(2);
    expect(state[2].zIndex).toBe(3);
  });
});

// --- Hook / Provider integration tests ---

describe('useWindowContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WindowProvider>{children}</WindowProvider>
  );

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useWindowContext());
    }).toThrow('useWindowContext must be used within a WindowProvider');
  });

  it('provides initial empty state', () => {
    const { result } = renderHook(() => useWindowContext(), { wrapper });
    expect(result.current.windows).toEqual([]);
    expect(result.current.openWindows).toEqual([]);
    expect(result.current.focusedWindowId).toBeNull();
  });

  it('getWindow returns undefined for non-existent id', () => {
    const { result } = renderHook(() => useWindowContext(), { wrapper });
    expect(result.current.getWindow('nope')).toBeUndefined();
  });

  it('dispatch OPEN adds window and updates derived state', () => {
    const { result } = renderHook(() => useWindowContext(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'OPEN', payload: { id: 'w1', title: 'Win' } });
    });
    expect(result.current.windows).toHaveLength(1);
    expect(result.current.getWindow('w1')?.title).toBe('Win');
    expect(result.current.openWindows).toHaveLength(1);
    expect(result.current.focusedWindowId).toBe('w1');
  });

  it('openWindows excludes minimized windows', () => {
    const { result } = renderHook(() => useWindowContext(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'OPEN', payload: { id: 'w1', title: 'A' } });
      result.current.dispatch({ type: 'OPEN', payload: { id: 'w2', title: 'B' } });
    });
    act(() => {
      result.current.dispatch({ type: 'MINIMIZE', payload: { id: 'w1' } });
    });
    expect(result.current.openWindows).toHaveLength(1);
    expect(result.current.openWindows[0].id).toBe('w2');
  });

  it('focusedWindowId is the window with highest zIndex', () => {
    const { result } = renderHook(() => useWindowContext(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'OPEN', payload: { id: 'w1', title: 'A' } });
      result.current.dispatch({ type: 'OPEN', payload: { id: 'w2', title: 'B' } });
    });
    expect(result.current.focusedWindowId).toBe('w2');
    act(() => {
      result.current.dispatch({ type: 'FOCUS', payload: { id: 'w1' } });
    });
    expect(result.current.focusedWindowId).toBe('w1');
  });
});
