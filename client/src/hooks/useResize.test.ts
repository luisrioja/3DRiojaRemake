import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResize } from './useResize';

// Helper to create a mock element with pointer event methods and a configurable bounding rect
function createMockElement(rect: { left: number; top: number; width: number; height: number }) {
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
    getBoundingClientRect: vi.fn(() => ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => {},
    })),
    style: { cursor: '' },
  } as unknown as HTMLElement;

  function dispatch(type: string, props: Partial<PointerEvent>) {
    const event = { pointerId: 1, ...props } as PointerEvent;
    listeners[type]?.forEach((h) => h(event));
  }

  return { element, dispatch };
}

describe('useResize', () => {
  const defaultRect = { left: 100, top: 100, width: 400, height: 300 };

  it('returns initial size and isResizing=false', () => {
    const { element } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    expect(result.current.size).toEqual({ width: 400, height: 300 });
    expect(result.current.isResizing).toBe(false);
  });

  it('starts resizing when pointerdown is near the right edge (E)', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Click near right edge: rect.left=100, rect.width=400, so right edge at x=500
    // clientX=498 → x relative to element = 498-100 = 398, which is > 400-6 = 394
    act(() => {
      dispatch('pointerdown', { clientX: 498, clientY: 250 });
    });

    expect(result.current.isResizing).toBe(true);
    expect(element.setPointerCapture).toHaveBeenCalled();
  });

  it('does not start resizing when pointerdown is in the center', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Click in center of element
    act(() => {
      dispatch('pointerdown', { clientX: 300, clientY: 250 });
    });

    expect(result.current.isResizing).toBe(false);
  });

  it('resizes from the right edge (E direction)', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near right edge
    act(() => {
      dispatch('pointerdown', { clientX: 498, clientY: 250 });
    });

    // Drag 50px to the right
    act(() => {
      dispatch('pointermove', { clientX: 548, clientY: 250 });
    });

    expect(result.current.size).toEqual({ width: 450, height: 300 });
  });

  it('resizes from the bottom edge (S direction)', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near bottom edge: rect.top=100, rect.height=300, bottom at y=400
    // clientY=398 → y relative = 298, which is > 300-6 = 294
    act(() => {
      dispatch('pointerdown', { clientX: 300, clientY: 398 });
    });

    // Drag 30px down
    act(() => {
      dispatch('pointermove', { clientX: 300, clientY: 428 });
    });

    expect(result.current.size).toEqual({ width: 400, height: 330 });
  });

  it('resizes from the SE corner', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near SE corner
    act(() => {
      dispatch('pointerdown', { clientX: 498, clientY: 398 });
    });

    // Drag 20px right and 10px down
    act(() => {
      dispatch('pointermove', { clientX: 518, clientY: 408 });
    });

    expect(result.current.size).toEqual({ width: 420, height: 310 });
  });

  it('enforces minimum size', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({
        initialSize: { width: 400, height: 300 },
        minSize: { width: 200, height: 150 },
        elementRef: ref,
      }),
    );

    // Pointerdown near right edge
    act(() => {
      dispatch('pointerdown', { clientX: 498, clientY: 250 });
    });

    // Drag far to the left (shrink below min)
    act(() => {
      dispatch('pointermove', { clientX: 98, clientY: 250 });
    });

    // Width should be clamped to minSize.width=200
    expect(result.current.size.width).toBe(200);
  });

  it('uses default minSize of 200x150 when not specified', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near bottom edge
    act(() => {
      dispatch('pointerdown', { clientX: 300, clientY: 398 });
    });

    // Drag far up (shrink below default min height of 150)
    act(() => {
      dispatch('pointermove', { clientX: 300, clientY: 198 });
    });

    expect(result.current.size.height).toBe(150);
  });

  it('calls onResizeEnd on pointerup with final size', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };
    const onResizeEnd = vi.fn();

    const { result } = renderHook(() =>
      useResize({
        initialSize: { width: 400, height: 300 },
        elementRef: ref,
        onResizeEnd,
      }),
    );

    act(() => {
      dispatch('pointerdown', { clientX: 498, clientY: 250 });
    });

    act(() => {
      dispatch('pointermove', { clientX: 548, clientY: 250 });
    });

    act(() => {
      dispatch('pointerup', { clientX: 548, clientY: 250 });
    });

    expect(result.current.isResizing).toBe(false);
    expect(onResizeEnd).toHaveBeenCalledWith({ width: 450, height: 300 });
    expect(element.releasePointerCapture).toHaveBeenCalled();
  });

  it('does not resize on pointermove when not resizing', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    act(() => {
      dispatch('pointermove', { clientX: 600, clientY: 600 });
    });

    expect(result.current.size).toEqual({ width: 400, height: 300 });
    expect(result.current.isResizing).toBe(false);
  });

  it('updates cursor on hover near edges', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Hover near right edge
    act(() => {
      dispatch('pointermove', { clientX: 498, clientY: 250 });
    });

    expect((element as unknown as { style: { cursor: string } }).style.cursor).toBe('ew-resize');

    // Hover in center (no edge)
    act(() => {
      dispatch('pointermove', { clientX: 300, clientY: 250 });
    });

    expect((element as unknown as { style: { cursor: string } }).style.cursor).toBe('');
  });

  it('removes event listeners on unmount', () => {
    const { element } = createMockElement(defaultRect);
    const ref = { current: element };

    const { unmount } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    unmount();

    expect(element.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(element.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('syncs size when initialSize changes', () => {
    const { element } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result, rerender } = renderHook(
      ({ sz }) => useResize({ initialSize: sz, elementRef: ref }),
      { initialProps: { sz: { width: 400, height: 300 } } },
    );

    expect(result.current.size).toEqual({ width: 400, height: 300 });

    rerender({ sz: { width: 600, height: 500 } });

    expect(result.current.size).toEqual({ width: 600, height: 500 });
  });

  it('resizes from the north edge', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near top edge: rect.top=100, clientY=103 → y relative = 3 < 6
    act(() => {
      dispatch('pointerdown', { clientX: 300, clientY: 103 });
    });

    // Drag 20px up → height increases by 20
    act(() => {
      dispatch('pointermove', { clientX: 300, clientY: 83 });
    });

    expect(result.current.size).toEqual({ width: 400, height: 320 });
  });

  it('resizes from the west edge', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near left edge: rect.left=100, clientX=103 → x relative = 3 < 6
    act(() => {
      dispatch('pointerdown', { clientX: 103, clientY: 250 });
    });

    // Drag 30px to the left → width increases by 30
    act(() => {
      dispatch('pointermove', { clientX: 73, clientY: 250 });
    });

    expect(result.current.size).toEqual({ width: 430, height: 300 });
  });

  it('resizes from the NW corner', () => {
    const { element, dispatch } = createMockElement(defaultRect);
    const ref = { current: element };

    const { result } = renderHook(() =>
      useResize({ initialSize: { width: 400, height: 300 }, elementRef: ref }),
    );

    // Pointerdown near NW corner
    act(() => {
      dispatch('pointerdown', { clientX: 103, clientY: 103 });
    });

    // Drag 10px left and 15px up
    act(() => {
      dispatch('pointermove', { clientX: 93, clientY: 88 });
    });

    expect(result.current.size).toEqual({ width: 410, height: 315 });
  });
});
