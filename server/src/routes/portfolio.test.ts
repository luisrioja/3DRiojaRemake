import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const TEST_DATA_DIR = path.resolve('data/__test_portfolio');
const TEST_FILE = path.join(TEST_DATA_DIR, 'portfolio.json');
const JWT_SECRET = 'dev-secret-3drioja';

const sampleProjects = [
  {
    id: 'test-id-1',
    title: 'Proyecto Test 1',
    description: 'Descripción test 1',
    image: '/images/test1.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'test-id-2',
    title: 'Proyecto Test 2',
    description: 'Descripción test 2',
    image: '/images/test2.jpg',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
  },
];

function generateAuthToken(): string {
  return jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}

async function createTestApp() {
  const { JSONStore } = await import('../store/JSONStore.js');
  const { Router } = await import('express');
  const { v4: uuidv4 } = await import('uuid');
  const { requireAuth } = await import('../middleware/auth.js');
  const { validatePortfolioInput } = await import('../utils/validation.js');

  type PortfolioProject = {
    id: string;
    title: string;
    description: string;
    image: string;
    createdAt: string;
    updatedAt: string;
  };

  const store = new JSONStore<{ projects: PortfolioProject[] }>(TEST_FILE, { projects: [] });
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const data = await store.read();
      res.json({ success: true, data: data.projects });
    } catch {
      res.status(500).json({ success: false, error: 'Error al obtener los proyectos' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const data = await store.read();
      const project = data.projects.find((p) => p.id === req.params.id);
      if (!project) {
        res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        return;
      }
      res.json({ success: true, data: project });
    } catch {
      res.status(500).json({ success: false, error: 'Error al obtener el proyecto' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    try {
      const validation = validatePortfolioInput(req.body);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }
      const { title, description, image } = req.body;
      const now = new Date().toISOString();
      const newProject: PortfolioProject = { id: uuidv4(), title, description, image, createdAt: now, updatedAt: now };
      const data = await store.read();
      data.projects.push(newProject);
      await store.write(data);
      res.status(201).json({ success: true, data: newProject });
    } catch {
      res.status(500).json({ success: false, error: 'Error al crear el proyecto' });
    }
  });

  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const validation = validatePortfolioInput(req.body);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }
      const data = await store.read();
      const index = data.projects.findIndex((p) => p.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        return;
      }
      const { title, description, image } = req.body;
      const updated: PortfolioProject = { ...data.projects[index], title, description, image, updatedAt: new Date().toISOString() };
      data.projects[index] = updated;
      await store.write(data);
      res.json({ success: true, data: updated });
    } catch {
      res.status(500).json({ success: false, error: 'Error al actualizar el proyecto' });
    }
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const data = await store.read();
      const index = data.projects.findIndex((p) => p.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        return;
      }
      data.projects.splice(index, 1);
      await store.write(data);
      res.json({ success: true, data: null });
    } catch {
      res.status(500).json({ success: false, error: 'Error al eliminar el proyecto' });
    }
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/portfolio', router);
  return app;
}

describe('Portfolio Routes', () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    await writeFile(TEST_FILE, JSON.stringify({ projects: sampleProjects }));
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  // --- GET tests ---

  it('GET / returns all projects with success response', async () => {
    const app = await createTestApp();
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe('test-id-1');
    expect(res.body.data[1].id).toBe('test-id-2');
  });

  it('GET / returns empty array when no projects exist', async () => {
    await writeFile(TEST_FILE, JSON.stringify({ projects: [] }));
    const app = await createTestApp();
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('GET /:id returns a single project', async () => {
    const app = await createTestApp();
    const res = await request(app).get('/api/portfolio/test-id-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-id-1');
    expect(res.body.data.title).toBe('Proyecto Test 1');
  });

  it('GET /:id returns 404 for non-existent project', async () => {
    const app = await createTestApp();
    const res = await request(app).get('/api/portfolio/non-existent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Proyecto no encontrado');
  });

  it('GET / returns default data when file is missing', async () => {
    await rm(TEST_FILE, { force: true });
    const app = await createTestApp();
    const res = await request(app).get('/api/portfolio');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  // --- POST tests ---

  it('POST / creates a new project when authenticated', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .post('/api/portfolio')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Nuevo Proyecto', description: 'Descripción nueva', image: '/images/new.jpg' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Nuevo Proyecto');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();

    // Verify it was persisted
    const getRes = await request(app).get('/api/portfolio');
    expect(getRes.body.data).toHaveLength(3);
  });

  it('POST / returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post('/api/portfolio')
      .send({ title: 'Test', description: 'Test', image: '/img.jpg' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST / returns 400 for invalid input', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .post('/api/portfolio')
      .set('Cookie', `token=${token}`)
      .send({ title: '', description: 'Desc', image: '/img.jpg' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  // --- PUT tests ---

  it('PUT /:id updates an existing project', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/portfolio/test-id-1')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Título Actualizado', description: 'Desc actualizada', image: '/images/updated.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Título Actualizado');
    expect(res.body.data.id).toBe('test-id-1');
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
  });

  it('PUT /:id returns 404 for non-existent project', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/portfolio/non-existent')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Test', description: 'Test', image: '/img.jpg' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Proyecto no encontrado');
  });

  it('PUT /:id returns 400 for invalid input', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/portfolio/test-id-1')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Valid', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /:id returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app)
      .put('/api/portfolio/test-id-1')
      .send({ title: 'Test', description: 'Test', image: '/img.jpg' });
    expect(res.status).toBe(401);
  });

  // --- DELETE tests ---

  it('DELETE /:id removes a project', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .delete('/api/portfolio/test-id-1')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it was removed
    const getRes = await request(app).get('/api/portfolio');
    expect(getRes.body.data).toHaveLength(1);
    expect(getRes.body.data[0].id).toBe('test-id-2');
  });

  it('DELETE /:id returns 404 for non-existent project', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .delete('/api/portfolio/non-existent')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Proyecto no encontrado');
  });

  it('DELETE /:id returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app).delete('/api/portfolio/test-id-1');
    expect(res.status).toBe(401);
  });
});
