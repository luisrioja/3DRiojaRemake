import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { PortfolioItem } from '../components/sections/PortfolioItem';
import type { PortfolioProject } from '../types';

// ============================================================================
// Feature: 3drioja-win95-remake, Property 13: Renderizado de galería de portfolio contiene toda la información
// **Validates: Requirements 9.1, 9.2**
// ============================================================================

const nonBlankString = (min: number, max: number) =>
  fc.string({ minLength: min, maxLength: max }).filter((s) => s.trim().length > 0);

const imageArb = fc.oneof(
  fc.webUrl(),
  nonBlankString(1, 100).map((s) => `/images/portfolio/${s}.jpg`),
);

const portfolioProjectArb: fc.Arbitrary<PortfolioProject> = fc.record({
  id: fc.uuid(),
  title: nonBlankString(1, 200),
  description: nonBlankString(1, 2000),
  image: imageArb,
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
});

describe('Property 13: Renderizado de galería de portfolio contiene toda la información', () => {
  it('rendered portfolio item contains the project title (h3), description (p) and image with correct src/alt', () => {
    fc.assert(
      fc.property(portfolioProjectArb, (project) => {
        const { container, unmount } = render(<PortfolioItem project={project} />);

        // Verify title is rendered in an h3
        const titleEl = container.querySelector('h3');
        expect(titleEl).not.toBeNull();
        expect(titleEl!.textContent).toBe(project.title);

        // Verify description is rendered in a p
        const descEl = container.querySelector('p');
        expect(descEl).not.toBeNull();
        expect(descEl!.textContent).toBe(project.description);

        // Verify image has correct src and alt
        const imgEl = container.querySelector('img');
        expect(imgEl).not.toBeNull();
        expect(imgEl!.getAttribute('src')).toBe(project.image);
        expect(imgEl!.getAttribute('alt')).toBe(project.title);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
