import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrag } from './useDrag';

// Helper to create a mock element with pointer event methods
function createMockHandle() {
  const listeners: Record<string, ((e: PointerEvent) => void)[]> = {};

  const element = {
    addEventListener: vi.fn((type: string, handler: (e: PointerEvent) => void) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: (e: PointerEvent) => void) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((h) => h !== handler);
      }
    }),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  } as unknown as HTMLElement;

  function dispatch(type: string, props: Partial<PointerEvent>) {
    const event = { pointerId: 1, ...props } as PointerEvent;
    listeners[type]?.forEach((h) => h(event));
  }

  return { element, dispatch };
}

describe('useDrag', () => {
  it('returns initial position and isDragging=false', () => {
    const { element } = createMockHandle();
    const ref = { current: element };

    const { result } = renderHook(() =>
      useDrag({ initialPosition: { x: 100, y: 200 }, handleRef: ref }),
    );

    expect(result.current.position).toEqual({ x: 100, y: 200 });
    expect(result.current.isDragging).toBe(false);
  });

  it('sets isDragging=true on pointerdown', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };

    const { result } = renderHook(() =>
      useDrag({ initialPosition: { x: 0, y: 0 }, handleRef: ref }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 10, clientY: 10 });
    });

    expect(result.current.isDragging).toBe(true);
    expect(element.setPointerCapture).toHaveBeenCalled();
  });

  it('updates position on pointermove while dragging', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };

    const { result } = renderHook(() =>
      useDrag({ initialPosition: { x: 50, y: 50 }, handleRef: ref }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 60, clientY: 60 });
    });

    act(() => {
      dispatch('pointermove', { clientX: 110, clientY: 110 });
    });

    // offset = (60-50, 60-50) = (10, 10)
    // new pos = (110-10, 110-10) = (100, 100)
    expect(result.current.position).toEqual({ x: 100, y: 100 });
  });

  it('does not update position on pointermove when not dragging', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };

    const { result } = renderHook(() =>
      useDrag({ initialPosition: { x: 50, y: 50 }, handleRef: ref }),
    );

    act(() => {
      dispatch('pointermove', { clientX: 200, clientY: 200 });
    });

    expect(result.current.position).toEqual({ x: 50, y: 50 });
    expect(result.current.isDragging).toBe(false);
  });

  it('sets isDragging=false and calls onDragEnd on pointerup', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };
    const onDragEnd = vi.fn();

    const { result } = renderHook(() =>
      useDrag({
        initialPosition: { x: 0, y: 0 },
        handleRef: ref,
        onDragEnd,
      }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 0, clientY: 0 });
    });

    act(() => {
      dispatch('pointermove', { clientX: 30, clientY: 40 });
    });

    act(() => {
      dispatch('pointerup', { clientX: 30, clientY: 40 });
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.position).toEqual({ x: 30, y: 40 });
    expect(onDragEnd).toHaveBeenCalledWith({ x: 30, y: 40 });
    expect(element.releasePointerCapture).toHaveBeenCalled();
  });

  it('clamps position to bounds', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };

    const { result } = renderHook(() =>
      useDrag({
        initialPosition: { x: 50, y: 50 },
        handleRef: ref,
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 50, clientY: 50 });
    });

    // Try to move beyond maxX/maxY
    act(() => {
      dispatch('pointermove', { clientX: 300, clientY: 300 });
    });

    expect(result.current.position).toEqual({ x: 100, y: 100 });

    // Try to move below minX/minY
    act(() => {
      dispatch('pointermove', { clientX: -200, clientY: -200 });
    });

    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('clamps final position on pointerup', () => {
    const { element, dispatch } = createMockHandle();
    const ref = { current: element };
    const onDragEnd = vi.fn();

    const { result } = renderHook(() =>
      useDrag({
        initialPosition: { x: 50, y: 50 },
        handleRef: ref,
        bounds: { minX: 10, minY: 10, maxX: 200, maxY: 200 },
        onDragEnd,
      }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 50, clientY: 50 });
    });

    act(() => {
      dispatch('pointerup', { clientX: 500, clientY: 500 });
    });

    expect(result.current.position).toEqual({ x: 200, y: 200 });
    expect(onDragEnd).toHaveBeenCalledWith({ x: 200, y: 200 });
  });

  it('removes event listeners on unmount', () => {
    const { element } = createMockHandle();
    const ref = { current: element };

    const { unmount } = renderHook(() =>
      useDrag({ initialPosition: { x: 0, y: 0 }, handleRef: ref }),
    );

    unmount();

    expect(element.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('syncs position when initialPosition changes', () => {
    const { element } = createMockHandle();
    const ref = { current: element };

    const { result, rerender } = renderHook(
      ({ pos }) => useDrag({ initialPosition: pos, handleRef: ref }),
      { initialProps: { pos: { x: 10, y: 20 } } },
    );

    expect(result.current.position).toEqual({ x: 10, y: 20 });

    rerender({ pos: { x: 300, y: 400 } });

    expect(result.current.position).toEqual({ x: 300, y: 400 });
  });
});
