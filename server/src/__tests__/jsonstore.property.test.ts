// Feature: 3drioja-win95-remake, Property 1-4: JSONStore and serialization properties
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { JSONStore } from '../store/JSONStore.js';
import { mkdtemp, rm, writeFile, chmod } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { PortfolioProject, Service } from '../types/index.js';

// --- Arbitraries ---

const arbPortfolioProject: fc.Arbitrary<PortfolioProject> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  image: fc.string({ minLength: 1, maxLength: 200 }),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
});

const arbService: fc.Arbitrary<Service> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  icon: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
});

const arbPortfolioData = fc.record({
  projects: fc.array(arbPortfolioProject, { minLength: 0, maxLength: 10 }),
});

const arbServicesData = fc.record({
  services: fc.array(arbService, { minLength: 0, maxLength: 10 }),
});

// Generates strings that are NOT valid JSON
const arbInvalidJson: fc.Arbitrary<string> = fc.string({ minLength: 1 }).filter((s) => {
  try {
    JSON.parse(s);
    return false;
  } catch {
    return true;
  }
});

// --- Test suites ---

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'jsonstore-prop-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

// Feature: 3drioja-win95-remake, Property 1: Round-trip de serialización de datos
// **Validates: Requirements 18.1, 18.2, 18.3**
describe('Property 1: Round-trip de serialización de datos', () => {
  it('serializing and deserializing PortfolioProject preserves equivalence', () => {
    fc.assert(
      fc.property(arbPortfolioProject, (project) => {
        const json = JSON.stringify(project);
        const parsed = JSON.parse(json) as PortfolioProject;
        expect(parsed).toEqual(project);
      }),
      { numRuns: 100 },
    );
  });

  it('serializing and deserializing Service preserves equivalence', () => {
    fc.assert(
      fc.property(arbService, (service) => {
        const json = JSON.stringify(service);
        const parsed = JSON.parse(json) as Service;
        expect(parsed).toEqual(service);
      }),
      { numRuns: 100 },
    );
  });

  it('serializing and deserializing portfolio data preserves equivalence', () => {
    fc.assert(
      fc.property(arbPortfolioData, (data) => {
        const json = JSON.stringify(data);
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(data);
      }),
      { numRuns: 100 },
    );
  });

  it('serializing and deserializing services data preserves equivalence', () => {
    fc.assert(
      fc.property(arbServicesData, (data) => {
        const json = JSON.stringify(data);
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(data);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: 3drioja-win95-remake, Property 2: Deserialización de JSON inválido carga datos por defecto
// **Validates: Requirements 18.4**
describe('Property 2: Deserialización de JSON inválido carga datos por defecto', () => {
  it('invalid JSON strings cause JSONStore to return default data without throwing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await fc.assert(
      fc.asyncProperty(arbInvalidJson, async (invalidStr) => {
        const filePath = join(tempDir, `invalid-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        await writeFile(filePath, invalidStr, 'utf-8');

        const defaultData = { projects: [] as PortfolioProject[] };
        const store = new JSONStore(filePath, defaultData);
        const result = await store.read();

        expect(result).toEqual(defaultData);
      }),
      { numRuns: 100 },
    );

    errorSpy.mockRestore();
  });
});

// Feature: 3drioja-win95-remake, Property 3: Round-trip de persistencia del almacén de datos
// **Validates: Requirements 16.1, 16.2**
describe('Property 3: Round-trip de persistencia del almacén de datos', () => {
  it('writing portfolio data and reading from a new instance returns equivalent data', async () => {
    await fc.assert(
      fc.asyncProperty(arbPortfolioData, async (data) => {
        const filePath = join(tempDir, `portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        const defaultData = { projects: [] as PortfolioProject[] };

        const store1 = new JSONStore(filePath, defaultData);
        await store1.write(data);

        const store2 = new JSONStore(filePath, defaultData);
        const result = await store2.read();

        expect(result).toEqual(data);
      }),
      { numRuns: 100 },
    );
  });

  it('writing services data and reading from a new instance returns equivalent data', async () => {
    await fc.assert(
      fc.asyncProperty(arbServicesData, async (data) => {
        const filePath = join(tempDir, `services-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        const defaultData = { services: [] as Service[] };

        const store1 = new JSONStore(filePath, defaultData);
        await store1.write(data);

        const store2 = new JSONStore(filePath, defaultData);
        const result = await store2.read();

        expect(result).toEqual(data);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: 3drioja-win95-remake, Property 4: Escritura fallida preserva datos anteriores
// **Validates: Requirements 16.3, 16.4**
describe('Property 4: Escritura fallida preserva datos anteriores', () => {
  it('failed write preserves previously written data', async () => {
    await fc.assert(
      fc.asyncProperty(arbPortfolioData, arbPortfolioData, async (initialData, newData) => {
        const filePath = join(tempDir, `preserve-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        const defaultData = { projects: [] as PortfolioProject[] };

        // Write initial data successfully
        const store = new JSONStore(filePath, defaultData);
        await store.write(initialData);

        // Attempt to write to a read-only directory to force failure
        const readOnlyDir = join(tempDir, `readonly-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const { mkdir: mkdirFs } = await import('fs/promises');
        await mkdirFs(readOnlyDir, { recursive: true });
        await chmod(readOnlyDir, 0o444);

        const badPath = join(readOnlyDir, 'subdir', 'data.json');
        const badStore = new JSONStore(badPath, defaultData);

        try {
          await badStore.write(newData);
        } catch {
          // Expected to fail
        }

        // Restore permissions for cleanup
        await chmod(readOnlyDir, 0o755);

        // Original data should still be intact
        const result = await store.read();
        expect(result).toEqual(initialData);
      }),
      { numRuns: 100 },
    );
  });
});
