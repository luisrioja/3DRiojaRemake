import { useState, useCallback, useEffect, useRef } from 'react';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const EDGE_THRESHOLD = 6; // pixels from edge to trigger resize

const DEFAULT_MIN_SIZE = { width: 200, height: 150 };

export interface UseResizeOptions {
  initialSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  elementRef: React.RefObject<HTMLElement>;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

export function useResize(options: UseResizeOptions): {
  size: { width: number; height: number };
  isResizing: boolean;
} {
  const { initialSize, minSize = DEFAULT_MIN_SIZE, elementRef, onResizeEnd } = options;

  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);

  // Refs to avoid stale closures in pointer event handlers
  const sizeRef = useRef(size);
  const isResizingRef = useRef(false);
  const directionRef = useRef<ResizeDirection>(null);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const minSizeRef = useRef(minSize);
  const onResizeEndRef = useRef(onResizeEnd);

  // Keep refs in sync
  sizeRef.current = size;
  minSizeRef.current = minSize;
  onResizeEndRef.current = onResizeEnd;

  const detectDirection = useCallback(
    (clientX: number, clientY: number): ResizeDirection => {
      const el = elementRef.current;
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      const nearTop = y < EDGE_THRESHOLD;
      const nearBottom = y > h - EDGE_THRESHOLD;
      const nearLeft = x < EDGE_THRESHOLD;
      const nearRight = x > w - EDGE_THRESHOLD;

      if (nearTop && nearLeft) return 'nw';
      if (nearTop && nearRight) return 'ne';
      if (nearBottom && nearLeft) return 'sw';
      if (nearBottom && nearRight) return 'se';
      if (nearTop) return 'n';
      if (nearBottom) return 's';
      if (nearLeft) return 'w';
      if (nearRight) return 'e';

      return null;
    },
    [elementRef],
  );

  const getCursorForDirection = useCallback((dir: ResizeDirection): string => {
    switch (dir) {
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'nw':
      case 'se':
        return 'nwse-resize';
      default:
        return '';
    }
  }, []);

  const clampSize = useCallback(
    (newSize: { width: number; height: number }) => {
      const min = minSizeRef.current;
      return {
        width: Math.max(newSize.width, min.width),
        height: Math.max(newSize.height, min.height),
      };
    },
    [],
  );

  const calculateNewSize = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - startPointerRef.current.x;
      const dy = clientY - startPointerRef.current.y;
      const dir = directionRef.current;
      const start = startSizeRef.current;

      let newWidth = start.width;
      let newHeight = start.height;

      if (dir?.includes('e')) newWidth = start.width + dx;
      if (dir?.includes('w')) newWidth = start.width - dx;
      if (dir?.includes('s')) newHeight = start.height + dy;
      if (dir?.includes('n')) newHeight = start.height - dy;

      return clampSize({ width: newWidth, height: newHeight });
    },
    [clampSize],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const dir = detectDirection(e.clientX, e.clientY);
      if (!dir) return;

      const el = elementRef.current;
      if (!el) return;

      directionRef.current = dir;
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = { ...sizeRef.current };

      el.setPointerCapture(e.pointerId);
      isResizingRef.current = true;
      setIsResizing(true);
    },
    [elementRef, detectDirection],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const el = elementRef.current;
      if (!el) return;

      if (!isResizingRef.current) {
        // Update cursor based on hover position
        const dir = detectDirection(e.clientX, e.clientY);
        const cursor = getCursorForDirection(dir);
        el.style.cursor = cursor || '';
        return;
      }

      const newSize = calculateNewSize(e.clientX, e.clientY);
      sizeRef.current = newSize;
      setSize(newSize);
    },
    [elementRef, detectDirection, getCursorForDirection, calculateNewSize],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isResizingRef.current) return;

      const el = elementRef.current;
      if (el) {
        el.releasePointerCapture(e.pointerId);
      }

      const finalSize = calculateNewSize(e.clientX, e.clientY);

      isResizingRef.current = false;
      directionRef.current = null;
      setIsResizing(false);
      sizeRef.current = finalSize;
      setSize(finalSize);
      onResizeEndRef.current?.(finalSize);
    },
    [elementRef, calculateNewSize],
  );

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
    };
  }, [elementRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  // Sync with external initialSize changes
  useEffect(() => {
    setSize(initialSize);
    sizeRef.current = initialSize;
  }, [initialSize.width, initialSize.height]);

  return { size, isResizing };
}
