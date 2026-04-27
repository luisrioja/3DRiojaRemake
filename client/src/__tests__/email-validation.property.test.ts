import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidEmail } from '../utils/validation';

// ============================================================================
// Feature: 3drioja-win95-remake, Property 7: Validación de email acepta válidos y rechaza inválidos
// **Validates: Requirements 11.4, 11.5**
// ============================================================================

/** Arbitrary that generates valid email addresses (local@domain.tld) */
const validEmailArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789._-'.split('')), { minLength: 1, maxLength: 20 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 1, maxLength: 15 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 6 }),
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Arbitrary that generates random strings without '@' */
const stringWithoutAtArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789.!#$%^&*()_+-=[]{}|;:,<>?/~`'.split('')),
  { minLength: 1, maxLength: 50 },
).filter((s) => !s.includes('@'));

/** Arbitrary that generates strings containing at least one space */
const stringWithSpaceArb = fc.tuple(
  fc.string({ minLength: 0, maxLength: 20 }),
  fc.string({ minLength: 0, maxLength: 20 }),
).map(([a, b]) => `${a} ${b}`);

/** Arbitrary that generates strings with multiple '@' symbols */
const stringWithMultipleAtArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
).map(([a, b, c]) => `${a}@${b}@${c}`);

/** Arbitrary that generates emails where domain has no dot */
const emailNoDotDomainArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 15 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 1, maxLength: 15 }),
).filter(([_, domain]) => !domain.includes('.')).map(([local, domain]) => `${local}@${domain}`);

describe('Property 7: Validación de email acepta válidos y rechaza inválidos', () => {
  it('valid emails (local@domain.tld) are accepted', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('strings without @ are rejected', () => {
    fc.assert(
      fc.property(stringWithoutAtArb, (str) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('strings with spaces are rejected', () => {
    fc.assert(
      fc.property(stringWithSpaceArb, (str) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('strings with multiple @ are rejected', () => {
    fc.assert(
      fc.property(stringWithMultipleAtArb, (str) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('emails where domain has no dot are rejected', () => {
    fc.assert(
      fc.property(emailNoDotDomainArb, (email) => {
        expect(isValidEmail(email)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
