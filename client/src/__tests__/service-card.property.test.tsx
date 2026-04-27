import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ServiceCard } from '../components/sections/ServiceCard';
import type { Service } from '../types';

// ============================================================================
// Feature: 3drioja-win95-remake, Property 12: Renderizado de tarjetas de servicio contiene toda la información
// **Validates: Requirements 8.1, 8.2**
// ============================================================================

// Generate non-whitespace-only strings to avoid getByText normalization issues
const nonBlankString = (min: number, max: number) =>
  fc.string({ minLength: min, maxLength: max }).filter((s) => s.trim().length > 0);

const serviceArb: fc.Arbitrary<Service> = fc.record({
  id: fc.uuid(),
  title: nonBlankString(1, 200),
  description: nonBlankString(1, 2000),
  icon: nonBlankString(1, 10),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
});

describe('Property 12: Renderizado de tarjetas de servicio contiene toda la información', () => {
  it('rendered card contains the service title, description and icon', () => {
    fc.assert(
      fc.property(serviceArb, (service) => {
        const { container, unmount } = render(<ServiceCard service={service} />);

        const titleEl = container.querySelector('h3');
        expect(titleEl).not.toBeNull();
        expect(titleEl!.textContent).toBe(service.title);

        const descEl = container.querySelector('p');
        expect(descEl).not.toBeNull();
        expect(descEl!.textContent).toBe(service.description);

        const iconEl = container.querySelector('[role="img"]');
        expect(iconEl).not.toBeNull();
        expect(iconEl!.textContent).toBe(service.icon);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
