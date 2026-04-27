// Feature: 3drioja-win95-remake, Properties 5, 6, 14: CRUD consistency and auth protection
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { JSONStore } from '../store/JSONStore.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import app from '../index.js';
import type { PortfolioProject, Service } from '../types/index.js';

// --- Arbitraries for valid input data ---

const arbPortfolioInput = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  image: fc.string({ minLength: 1, maxLength: 200 }),
});

const arbServiceInput = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  icon: fc.string({ minLength: 1, maxLength: 100 }),
});

// CRUD operation types
type CrudOp<TInput> =
  | { type: 'create'; input: TInput }
  | { type: 'update'; index: number; input: TInput }
  | { type: 'delete'; index: number };

function arbCrudOps<TInput>(arbInput: fc.Arbitrary<TInput>): fc.Arbitrary<CrudOp<TInput>[]> {
  return fc.array(
    fc.oneof(
      fc.record({ type: fc.constant('create' as const), input: arbInput }),
      fc.record({ type: fc.constant('update' as const), index: fc.nat({ max: 20 }), input: arbInput }),
      fc.record({ type: fc.constant('delete' as const), index: fc.nat({ max: 20 }) }),
    ),
    { minLength: 1, maxLength: 20 },
  );
}

// --- Property 5: CRUD de Portfolio mantiene consistencia del almacén ---
// **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

describe('Property 5: CRUD de Portfolio mantiene consistencia del almacén', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'crud-portfolio-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('random CRUD sequences on Portfolio keep the store consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbCrudOps(arbPortfolioInput),
        async (ops) => {
          const filePath = join(tempDir, `portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
          const store = new JSONStore<{ projects: PortfolioProject[] }>(filePath, { projects: [] });

          // Mirror state to verify consistency
          const mirror: PortfolioProject[] = [];
          let nextId = 1;

          for (const op of ops) {
            const data = await store.read();

            if (op.type === 'create') {
              const now = new Date().toISOString();
              const newProject: PortfolioProject = {
                id: String(nextId++),
                title: op.input.title,
                description: op.input.description,
                image: op.input.image,
                createdAt: now,
                updatedAt: now,
              };
              data.projects.push(newProject);
              await store.write(data);
              mirror.push({ ...newProject });
            } else if (op.type === 'update') {
              if (data.projects.length === 0) continue;
              const idx = op.index % data.projects.length;
              const now = new Date().toISOString();
              const updated: PortfolioProject = {
                ...data.projects[idx],
                title: op.input.title,
                description: op.input.description,
                image: op.input.image,
                updatedAt: now,
              };
              data.projects[idx] = updated;
              await store.write(data);
              mirror[idx] = { ...updated };
            } else if (op.type === 'delete') {
              if (data.projects.length === 0) continue;
              const idx = op.index % data.projects.length;
              data.projects.splice(idx, 1);
              await store.write(data);
              mirror.splice(idx, 1);
            }
          }

          // Verify final consistency
          const finalData = await store.read();
          expect(finalData.projects.length).toBe(mirror.length);
          expect(finalData.projects).toEqual(mirror);

          // Verify from a fresh store instance
          const freshStore = new JSONStore<{ projects: PortfolioProject[] }>(filePath, { projects: [] });
          const freshData = await freshStore.read();
          expect(freshData.projects).toEqual(mirror);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// --- Property 6: CRUD de Servicios mantiene consistencia del almacén ---
// **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

describe('Property 6: CRUD de Servicios mantiene consistencia del almacén', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'crud-services-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('random CRUD sequences on Services keep the store consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbCrudOps(arbServiceInput),
        async (ops) => {
          const filePath = join(tempDir, `services-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
          const store = new JSONStore<{ services: Service[] }>(filePath, { services: [] });

          // Mirror state to verify consistency
          const mirror: Service[] = [];
          let nextId = 1;

          for (const op of ops) {
            const data = await store.read();

            if (op.type === 'create') {
              const now = new Date().toISOString();
              const newService: Service = {
                id: String(nextId++),
                title: op.input.title,
                description: op.input.description,
                icon: op.input.icon,
                createdAt: now,
                updatedAt: now,
              };
              data.services.push(newService);
              await store.write(data);
              mirror.push({ ...newService });
            } else if (op.type === 'update') {
              if (data.services.length === 0) continue;
              const idx = op.index % data.services.length;
              const now = new Date().toISOString();
              const updated: Service = {
                ...data.services[idx],
                title: op.input.title,
                description: op.input.description,
                icon: op.input.icon,
                updatedAt: now,
              };
              data.services[idx] = updated;
              await store.write(data);
              mirror[idx] = { ...updated };
            } else if (op.type === 'delete') {
              if (data.services.length === 0) continue;
              const idx = op.index % data.services.length;
              data.services.splice(idx, 1);
              await store.write(data);
              mirror.splice(idx, 1);
            }
          }

          // Verify final consistency
          const finalData = await store.read();
          expect(finalData.services.length).toBe(mirror.length);
          expect(finalData.services).toEqual(mirror);

          // Verify from a fresh store instance
          const freshStore = new JSONStore<{ services: Service[] }>(filePath, { services: [] });
          const freshData = await freshStore.read();
          expect(freshData.services).toEqual(mirror);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// --- Property 14: Rutas admin protegidas requieren autenticación ---
// **Validates: Requirements 13.4**

describe('Property 14: Rutas admin protegidas requieren autenticación', () => {
  // All protected routes that require auth
  const protectedRoutes: Array<{ method: 'post' | 'put' | 'delete'; path: string }> = [
    { method: 'post', path: '/api/portfolio' },
    { method: 'put', path: '/api/portfolio/some-id' },
    { method: 'delete', path: '/api/portfolio/some-id' },
    { method: 'post', path: '/api/services' },
    { method: 'put', path: '/api/services/some-id' },
    { method: 'delete', path: '/api/services/some-id' },
  ];

  // Arbitrary for picking a random protected route
  const arbProtectedRoute = fc.constantFrom(...protectedRoutes);

  // Arbitrary for random invalid tokens (not valid JWTs)
  const arbInvalidToken = fc.oneof(
    fc.constant(''),                                          // empty
    fc.constant(undefined as unknown as string),              // no token
    fc.string({ minLength: 1, maxLength: 200 }),              // random string
    fc.constant('eyJhbGciOiJIUzI1NiJ9.invalid.signature'),   // malformed JWT
  );

  // Arbitrary for random request body
  const arbBody = fc.oneof(
    fc.constant({}),
    fc.record({
      title: fc.string({ minLength: 0, maxLength: 100 }),
      description: fc.string({ minLength: 0, maxLength: 100 }),
      image: fc.string({ minLength: 0, maxLength: 100 }),
      icon: fc.string({ minLength: 0, maxLength: 100 }),
    }),
  );

  it('requests to protected routes without valid token return 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbProtectedRoute,
        arbInvalidToken,
        arbBody,
        async (route, token, body) => {
          const req = request(app)[route.method](route.path).send(body);

          // Set cookie only if token is a non-empty string
          if (token && typeof token === 'string' && token.length > 0) {
            req.set('Cookie', `token=${token}`);
          }
          // If token is empty or undefined, don't set cookie at all → no auth

          const res = await req;
          expect(res.status).toBe(401);
          expect(res.body.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
