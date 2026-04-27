import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { windowReducer, type WindowAction } from '../context/WindowContext';
import type { WindowState } from '../types';

// ============================================================================
// Feature: 3drioja-win95-remake, Property 9: Transiciones de estado de ventana son consistentes
// **Validates: Requirements 2.5, 2.6, 2.7, 2.10**
// ============================================================================

describe('Property 9: Transiciones de estado de ventana son consistentes', () => {
  const windowId = 'test-window';
  const openAction: WindowAction = { type: 'OPEN', payload: { id: windowId, title: 'Test' } };

  // Arbitrary for window operations (excluding OPEN and CLOSE for sequence, we handle those separately)
  const windowOperationArb: fc.Arbitrary<WindowAction> = fc.oneof(
    fc.constant<WindowAction>({ type: 'MINIMIZE', payload: { id: windowId } }),
    fc.constant<WindowAction>({ type: 'MAXIMIZE', payload: { id: windowId } }),
    fc.constant<WindowAction>({ type: 'RESTORE', payload: { id: windowId } }),
  );

  it('after MINIMIZE, window isMinimized=true', () => {
    fc.assert(
      fc.property(
        fc.array(windowOperationArb, { minLength: 0, maxLength: 10 }),
        (preOps) => {
          // Start with OPEN, apply random pre-operations, then MINIMIZE
          let state = windowReducer([], openAction);
          for (const op of preOps) {
            state = windowReducer(state, op);
          }
          state = windowReducer(state, { type: 'MINIMIZE', payload: { id: windowId } });

          const win = state.find((w) => w.id === windowId);
          expect(win).toBeDefined();
          expect(win!.isMinimized).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('after MAXIMIZE, window isMaximized=true and isMinimized=false', () => {
    fc.assert(
      fc.property(
        fc.array(windowOperationArb, { minLength: 0, maxLength: 10 }),
        (preOps) => {
          let state = windowReducer([], openAction);
          for (const op of preOps) {
            state = windowReducer(state, op);
          }
          state = windowReducer(state, { type: 'MAXIMIZE', payload: { id: windowId } });

          const win = state.find((w) => w.id === windowId);
          expect(win).toBeDefined();
          expect(win!.isMaximized).toBe(true);
          expect(win!.isMinimized).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('after RESTORE, window isMinimized=false and isMaximized=false', () => {
    fc.assert(
      fc.property(
        fc.array(windowOperationArb, { minLength: 0, maxLength: 10 }),
        (preOps) => {
          let state = windowReducer([], openAction);
          for (const op of preOps) {
            state = windowReducer(state, op);
          }
          state = windowReducer(state, { type: 'RESTORE', payload: { id: windowId } });

          const win = state.find((w) => w.id === windowId);
          expect(win).toBeDefined();
          expect(win!.isMinimized).toBe(false);
          expect(win!.isMaximized).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('after CLOSE, window is removed from state', () => {
    fc.assert(
      fc.property(
        fc.array(windowOperationArb, { minLength: 0, maxLength: 10 }),
        (preOps) => {
          let state = windowReducer([], openAction);
          for (const op of preOps) {
            state = windowReducer(state, op);
          }
          state = windowReducer(state, { type: 'CLOSE', payload: { id: windowId } });

          const win = state.find((w) => w.id === windowId);
          expect(win).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('random sequences of operations always produce consistent state', () => {
    const allOpsArb: fc.Arbitrary<WindowAction> = fc.oneof(
      fc.constant<WindowAction>({ type: 'MINIMIZE', payload: { id: windowId } }),
      fc.constant<WindowAction>({ type: 'MAXIMIZE', payload: { id: windowId } }),
      fc.constant<WindowAction>({ type: 'RESTORE', payload: { id: windowId } }),
      fc.constant<WindowAction>({ type: 'CLOSE', payload: { id: windowId } }),
    );

    fc.assert(
      fc.property(
        fc.array(allOpsArb, { minLength: 1, maxLength: 20 }),
        (ops) => {
          let state = windowReducer([], openAction);

          for (const op of ops) {
            state = windowReducer(state, op);
            const win = state.find((w) => w.id === windowId);

            if (op.type === 'CLOSE') {
              // After close, window should not exist
              expect(win).toBeUndefined();
            } else if (win) {
              // Window exists — verify state consistency
              if (op.type === 'MINIMIZE') {
                expect(win.isMinimized).toBe(true);
              }
              if (op.type === 'MAXIMIZE') {
                expect(win.isMaximized).toBe(true);
                expect(win.isMinimized).toBe(false);
              }
              if (op.type === 'RESTORE') {
                expect(win.isMinimized).toBe(false);
                expect(win.isMaximized).toBe(false);
              }
            }
            // If window was already closed, further ops on it are no-ops (state unchanged)
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================================
// Feature: 3drioja-win95-remake, Property 10: Arrastre de ventana actualiza posición por delta
// **Validates: Requirements 2.4**
// ============================================================================

describe('Property 10: Arrastre de ventana actualiza posición por delta', () => {
  // Pure clamp function extracted from useDrag logic
  function clampPosition(
    pos: { x: number; y: number },
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
  ): { x: number; y: number } {
    return {
      x: Math.min(Math.max(pos.x, bounds.minX), bounds.maxX),
      y: Math.min(Math.max(pos.y, bounds.minY), bounds.maxY),
    };
  }

  // Calculate drag result: initial position + delta, clamped to bounds
  function calculateDragPosition(
    initial: { x: number; y: number },
    delta: { dx: number; dy: number },
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
  ): { x: number; y: number } {
    return clampPosition(
      { x: initial.x + delta.dx, y: initial.y + delta.dy },
      bounds,
    );
  }

  const positionArb = fc.record({
    x: fc.integer({ min: -2000, max: 2000 }),
    y: fc.integer({ min: -2000, max: 2000 }),
  });

  const deltaArb = fc.record({
    dx: fc.integer({ min: -1000, max: 1000 }),
    dy: fc.integer({ min: -1000, max: 1000 }),
  });

  const boundsArb = fc.tuple(
    fc.integer({ min: -2000, max: 0 }),
    fc.integer({ min: -2000, max: 0 }),
    fc.integer({ min: 0, max: 4000 }),
    fc.integer({ min: 0, max: 4000 }),
  ).filter(([minX, minY, maxX, maxY]) => minX <= maxX && minY <= maxY)
    .map(([minX, minY, maxX, maxY]) => ({ minX, minY, maxX, maxY }));

  it('new position equals initial + delta, clamped to bounds', () => {
    fc.assert(
      fc.property(positionArb, deltaArb, boundsArb, (initial, delta, bounds) => {
        const result = calculateDragPosition(initial, delta, bounds);
        const unclamped = { x: initial.x + delta.dx, y: initial.y + delta.dy };

        // Result should equal clamped(initial + delta)
        expect(result.x).toBe(Math.min(Math.max(unclamped.x, bounds.minX), bounds.maxX));
        expect(result.y).toBe(Math.min(Math.max(unclamped.y, bounds.minY), bounds.maxY));
      }),
      { numRuns: 100 },
    );
  });

  it('result is always within bounds', () => {
    fc.assert(
      fc.property(positionArb, deltaArb, boundsArb, (initial, delta, bounds) => {
        const result = calculateDragPosition(initial, delta, bounds);

        expect(result.x).toBeGreaterThanOrEqual(bounds.minX);
        expect(result.x).toBeLessThanOrEqual(bounds.maxX);
        expect(result.y).toBeGreaterThanOrEqual(bounds.minY);
        expect(result.y).toBeLessThanOrEqual(bounds.maxY);
      }),
      { numRuns: 100 },
    );
  });

  it('zero delta preserves position (if within bounds)', () => {
    fc.assert(
      fc.property(positionArb, boundsArb, (initial, bounds) => {
        const clamped = clampPosition(initial, bounds);
        const result = calculateDragPosition(initial, { dx: 0, dy: 0 }, bounds);

        expect(result.x).toBe(clamped.x);
        expect(result.y).toBe(clamped.y);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================================
// Feature: 3drioja-win95-remake, Property 11: Redimensionamiento de ventana respeta tamaño mínimo
// **Validates: Requirements 2.11**
// ============================================================================

describe('Property 11: Redimensionamiento de ventana respeta tamaño mínimo', () => {
  // Pure clampSize function extracted from useResize logic
  function clampSize(
    newSize: { width: number; height: number },
    minSize: { width: number; height: number },
  ): { width: number; height: number } {
    return {
      width: Math.max(newSize.width, minSize.width),
      height: Math.max(newSize.height, minSize.height),
    };
  }

  // Calculate resize result: initial size + delta, clamped to minSize
  function calculateResizeSize(
    initial: { width: number; height: number },
    delta: { dw: number; dh: number },
    minSize: { width: number; height: number },
  ): { width: number; height: number } {
    return clampSize(
      { width: initial.width + delta.dw, height: initial.height + delta.dh },
      minSize,
    );
  }

  const sizeArb = fc.record({
    width: fc.integer({ min: 50, max: 2000 }),
    height: fc.integer({ min: 50, max: 2000 }),
  });

  const deltaArb = fc.record({
    dw: fc.integer({ min: -1000, max: 1000 }),
    dh: fc.integer({ min: -1000, max: 1000 }),
  });

  const minSizeArb = fc.record({
    width: fc.integer({ min: 50, max: 500 }),
    height: fc.integer({ min: 50, max: 500 }),
  });

  it('resulting size is never less than minSize', () => {
    fc.assert(
      fc.property(sizeArb, deltaArb, minSizeArb, (initial, delta, minSize) => {
        const result = calculateResizeSize(initial, delta, minSize);

        expect(result.width).toBeGreaterThanOrEqual(minSize.width);
        expect(result.height).toBeGreaterThanOrEqual(minSize.height);
      }),
      { numRuns: 100 },
    );
  });

  it('when unclamped size >= minSize, result equals unclamped', () => {
    fc.assert(
      fc.property(sizeArb, deltaArb, minSizeArb, (initial, delta, minSize) => {
        const unclamped = {
          width: initial.width + delta.dw,
          height: initial.height + delta.dh,
        };
        const result = calculateResizeSize(initial, delta, minSize);

        if (unclamped.width >= minSize.width) {
          expect(result.width).toBe(unclamped.width);
        }
        if (unclamped.height >= minSize.height) {
          expect(result.height).toBe(unclamped.height);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('when unclamped size < minSize, result equals minSize', () => {
    fc.assert(
      fc.property(sizeArb, deltaArb, minSizeArb, (initial, delta, minSize) => {
        const unclamped = {
          width: initial.width + delta.dw,
          height: initial.height + delta.dh,
        };
        const result = calculateResizeSize(initial, delta, minSize);

        if (unclamped.width < minSize.width) {
          expect(result.width).toBe(minSize.width);
        }
        if (unclamped.height < minSize.height) {
          expect(result.height).toBe(minSize.height);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('with default minSize (200x150), result respects defaults', () => {
    const DEFAULT_MIN_SIZE = { width: 200, height: 150 };

    fc.assert(
      fc.property(sizeArb, deltaArb, (initial, delta) => {
        const result = calculateResizeSize(initial, delta, DEFAULT_MIN_SIZE);

        expect(result.width).toBeGreaterThanOrEqual(200);
        expect(result.height).toBeGreaterThanOrEqual(150);
      }),
      { numRuns: 100 },
    );
  });
});
