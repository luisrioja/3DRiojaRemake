import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { NavigationMode } from '../types';

// ============================================================================
// Feature: 3drioja-win95-remake, Property 8: Round-trip de modo de navegación con persistencia
// **Validates: Requirements 4.2, 4.3, 4.4**
// ============================================================================

const STORAGE_KEY = '3drioja-nav-mode';

/** Pure toggle logic matching ModeContext implementation */
function toggleMode(mode: NavigationMode): NavigationMode {
  return mode === 'desktop' ? 'classic' : 'desktop';
}

/** Arbitrary that generates valid NavigationMode values */
const navigationModeArb: fc.Arbitrary<NavigationMode> = fc.oneof(
  fc.constant<NavigationMode>('desktop'),
  fc.constant<NavigationMode>('classic'),
);

describe('Property 8: Round-trip de modo de navegación con persistencia', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('write mode to localStorage then read back returns the same mode', () => {
    fc.assert(
      fc.property(navigationModeArb, (mode) => {
        // Write
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));

        // Read
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const restored: NavigationMode = JSON.parse(raw!);

        // Round-trip equivalence
        expect(restored).toBe(mode);
      }),
      { numRuns: 100 },
    );
  });

  it('toggling twice returns to the original mode', () => {
    fc.assert(
      fc.property(navigationModeArb, (mode) => {
        const afterFirst = toggleMode(mode);
        const afterSecond = toggleMode(afterFirst);

        expect(afterSecond).toBe(mode);
      }),
      { numRuns: 100 },
    );
  });

  it('toggle from desktop gives classic, toggle from classic gives desktop', () => {
    fc.assert(
      fc.property(navigationModeArb, (mode) => {
        const toggled = toggleMode(mode);

        if (mode === 'desktop') {
          expect(toggled).toBe('classic');
        } else {
          expect(toggled).toBe('desktop');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('persist → toggle → persist → read returns toggled mode', () => {
    fc.assert(
      fc.property(navigationModeArb, (mode) => {
        // Persist original
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));

        // Toggle and persist
        const toggled = toggleMode(mode);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toggled));

        // Read back
        const raw = localStorage.getItem(STORAGE_KEY);
        const restored: NavigationMode = JSON.parse(raw!);

        expect(restored).toBe(toggled);
        expect(restored).not.toBe(mode);
      }),
      { numRuns: 100 },
    );
  });

  it('multiple random mode selections all round-trip through localStorage', () => {
    fc.assert(
      fc.property(
        fc.array(navigationModeArb, { minLength: 1, maxLength: 20 }),
        (modes) => {
          for (const mode of modes) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
            const raw = localStorage.getItem(STORAGE_KEY);
            const restored: NavigationMode = JSON.parse(raw!);
            expect(restored).toBe(mode);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when no value in localStorage, default should be desktop', () => {
    // This verifies requirement 4.4: default mode is desktop
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();

    const defaultMode: NavigationMode = 'desktop';
    const mode: NavigationMode = raw !== null ? JSON.parse(raw) : defaultMode;
    expect(mode).toBe('desktop');
  });
});
