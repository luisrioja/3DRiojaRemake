import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const TEST_DATA_DIR = path.resolve('data/__test_services');
const TEST_FILE = path.join(TEST_DATA_DIR, 'services.json');
const JWT_SECRET = 'dev-secret-3drioja';

const sampleServices = [
  {
    id: 'svc-1',
    title: 'Impresión 3D',
    description: 'Servicio de impresión 3D personalizada',
    icon: 'printer-3d',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'svc-2',
    title: 'Consultoría 3D',
    description: 'Asesoramiento en fabricación aditiva',
    icon: 'consulting',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
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
  const { validateServiceInput } = await import('../utils/validation.js');

  type Service = {
    id: string;
    title: string;
    description: string;
    icon: string;
    createdAt: string;
    updatedAt: string;
  };

  const store = new JSONStore<{ services: Service[] }>(TEST_FILE, { services: [] });
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const data = await store.read();
      res.json({ success: true, data: data.services });
    } catch {
      res.status(500).json({ success: false, error: 'Error al obtener los servicios' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    try {
      const validation = validateServiceInput(req.body);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }
      const { title, description, icon } = req.body;
      const now = new Date().toISOString();
      const newService: Service = { id: uuidv4(), title, description, icon, createdAt: now, updatedAt: now };
      const data = await store.read();
      data.services.push(newService);
      await store.write(data);
      res.status(201).json({ success: true, data: newService });
    } catch {
      res.status(500).json({ success: false, error: 'Error al crear el servicio' });
    }
  });

  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const validation = validateServiceInput(req.body);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }
      const data = await store.read();
      const index = data.services.findIndex((s) => s.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Servicio no encontrado' });
        return;
      }
      const { title, description, icon } = req.body;
      const updated: Service = { ...data.services[index], title, description, icon, updatedAt: new Date().toISOString() };
      data.services[index] = updated;
      await store.write(data);
      res.json({ success: true, data: updated });
    } catch {
      res.status(500).json({ success: false, error: 'Error al actualizar el servicio' });
    }
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const data = await store.read();
      const index = data.services.findIndex((s) => s.id === req.params.id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Servicio no encontrado' });
        return;
      }
      data.services.splice(index, 1);
      await store.write(data);
      res.json({ success: true, data: null });
    } catch {
      res.status(500).json({ success: false, error: 'Error al eliminar el servicio' });
    }
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/services', router);
  return app;
}

describe('Services Routes', () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    await writeFile(TEST_FILE, JSON.stringify({ services: sampleServices }));
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  // --- GET tests ---

  it('GET / returns all services with success response', async () => {
    const app = await createTestApp();
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe('Impresión 3D');
    expect(res.body.data[1].title).toBe('Consultoría 3D');
  });

  it('GET / returns empty array when no services exist', async () => {
    await writeFile(TEST_FILE, JSON.stringify({ services: [] }));
    const app = await createTestApp();
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('GET / returns default data when file is missing', async () => {
    await rm(TEST_FILE, { force: true });
    const app = await createTestApp();
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  // --- POST tests ---

  it('POST / creates a new service when authenticated', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .post('/api/services')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Nuevo Servicio', description: 'Descripción nueva', icon: 'new-icon' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Nuevo Servicio');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();

    // Verify persistence
    const getRes = await request(app).get('/api/services');
    expect(getRes.body.data).toHaveLength(3);
  });

  it('POST / returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post('/api/services')
      .send({ title: 'Test', description: 'Test', icon: 'icon' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST / returns 400 for invalid input', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .post('/api/services')
      .set('Cookie', `token=${token}`)
      .send({ title: '', description: 'Desc', icon: 'icon' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  // --- PUT tests ---

  it('PUT /:id updates an existing service', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/services/svc-1')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Servicio Actualizado', description: 'Desc actualizada', icon: 'updated-icon' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Servicio Actualizado');
    expect(res.body.data.id).toBe('svc-1');
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
  });

  it('PUT /:id returns 404 for non-existent service', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/services/non-existent')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Test', description: 'Test', icon: 'icon' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Servicio no encontrado');
  });

  it('PUT /:id returns 400 for invalid input', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .put('/api/services/svc-1')
      .set('Cookie', `token=${token}`)
      .send({ title: 'Valid', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /:id returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app)
      .put('/api/services/svc-1')
      .send({ title: 'Test', description: 'Test', icon: 'icon' });
    expect(res.status).toBe(401);
  });

  // --- DELETE tests ---

  it('DELETE /:id removes a service', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .delete('/api/services/svc-1')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify removal
    const getRes = await request(app).get('/api/services');
    expect(getRes.body.data).toHaveLength(1);
    expect(getRes.body.data[0].id).toBe('svc-2');
  });

  it('DELETE /:id returns 404 for non-existent service', async () => {
    const app = await createTestApp();
    const token = generateAuthToken();
    const res = await request(app)
      .delete('/api/services/non-existent')
      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Servicio no encontrado');
  });

  it('DELETE /:id returns 401 without auth token', async () => {
    const app = await createTestApp();
    const res = await request(app).delete('/api/services/svc-1');
    expect(res.status).toBe(401);
  });
});
