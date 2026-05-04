import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseDragOptions {
  initialPosition: { x: number; y: number };
  handleRef: React.RefObject<HTMLElement>;
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  onDragEnd?: (position: { x: number; y: number }) => void;
}

export function useDrag(options: UseDragOptions): {
  position: { x: number; y: number };
  isDragging: boolean;
} {
  const { initialPosition, handleRef, bounds, onDragEnd } = options;

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Use refs to avoid stale closures in pointer event handlers
  const positionRef = useRef(position);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const boundsRef = useRef(bounds);
  const onDragEndRef = useRef(onDragEnd);

  // Keep refs in sync
  positionRef.current = position;
  boundsRef.current = bounds;
  onDragEndRef.current = onDragEnd;

  const clamp = useCallback(
    (pos: { x: number; y: number }) => {
      const b = boundsRef.current;
      if (!b) return pos;
      return {
        x: Math.min(Math.max(pos.x, b.minX), b.maxX),
        y: Math.min(Math.max(pos.y, b.minY), b.maxY),
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const handle = handleRef.current;
      if (!handle) return;

      // Don't start drag if clicking a button (e.g. minimize/maximize/close)
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('button')) return;

      offsetRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };

      handle.setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [handleRef],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const newPos = clamp({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      });

      positionRef.current = newPos;
      setPosition(newPos);
    },
    [clamp],
  );

    const handlePointerUp = useCallback(
      (e: PointerEvent) => {
        if (!isDraggingRef.current) return;

        const handle = handleRef.current;
        if (handle && e.pointerId) {
          try {
            handle.releasePointerCapture(e.pointerId);
          } catch (err) {
            // Ignore if capture was already lost
          }
        }

        isDraggingRef.current = false;
        setIsDragging(false);

        // e.clientX/Y might be undefined on some edge case events (like cancel), use last position if so
        const clientX = e.clientX ?? positionRef.current.x + offsetRef.current.x;
        const clientY = e.clientY ?? positionRef.current.y + offsetRef.current.y;

        const finalPos = clamp({
          x: clientX - offsetRef.current.x,
          y: clientY - offsetRef.current.y,
        });
        
        positionRef.current = finalPos;
        setPosition(finalPos);
        onDragEndRef.current?.(finalPos);
      },
      [handleRef, clamp],
    );

    useEffect(() => {
      const handle = handleRef.current;
      if (!handle) return;

      handle.addEventListener('pointerdown', handlePointerDown);
      handle.addEventListener('pointermove', handlePointerMove);
      handle.addEventListener('pointerup', handlePointerUp);
      handle.addEventListener('pointercancel', handlePointerUp);
      handle.addEventListener('lostpointercapture', handlePointerUp);
      
      // Fallback: listen on window to catch pointerup outside the window
      window.addEventListener('pointerup', handlePointerUp);

      return () => {
        handle.removeEventListener('pointerdown', handlePointerDown);
        handle.removeEventListener('pointermove', handlePointerMove);
        handle.removeEventListener('pointerup', handlePointerUp);
        handle.removeEventListener('pointercancel', handlePointerUp);
        handle.removeEventListener('lostpointercapture', handlePointerUp);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [handleRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  // Sync with external initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
    positionRef.current = initialPosition;
  }, [initialPosition.x, initialPosition.y]);

  return { position, isDragging };
}
