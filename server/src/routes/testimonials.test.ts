import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';

const TEST_DATA_DIR = path.resolve('data/__test_testimonials');
const TEST_FILE = path.join(TEST_DATA_DIR, 'testimonials.json');

const sampleTestimonials = [
  {
    id: 't-1',
    author: 'María García',
    text: 'Excelente servicio',
    rating: 5,
    date: '2025-02-10',
  },
  {
    id: 't-2',
    author: 'Carlos Martínez',
    text: 'Muy profesionales',
    rating: 4,
    date: '2025-01-25',
  },
];

async function createTestApp() {
  const { JSONStore } = await import('../store/JSONStore.js');
  const { Router } = await import('express');

  const store = new JSONStore(TEST_FILE, { testimonials: [] });

  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const data = await store.read();
      res.json({ success: true, data: (data as { testimonials: unknown[] }).testimonials });
    } catch {
      res.status(500).json({ success: false, error: 'Error al obtener los testimonios' });
    }
  });

  const app = express();
  app.use('/api/testimonials', router);
  return app;
}

describe('Testimonials Routes', () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
    await writeFile(TEST_FILE, JSON.stringify({ testimonials: sampleTestimonials }));
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  it('GET / returns all testimonials with success response', async () => {
    const app = await createTestApp();
    const res = await request(app).get('/api/testimonials');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].author).toBe('María García');
    expect(res.body.data[1].author).toBe('Carlos Martínez');
  });

  it('GET / returns empty array when no testimonials exist', async () => {
    await writeFile(TEST_FILE, JSON.stringify({ testimonials: [] }));
    const app = await createTestApp();
    const res = await request(app).get('/api/testimonials');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('GET / returns default data when file is missing (cached fallback)', async () => {
    await rm(TEST_FILE, { force: true });
    const app = await createTestApp();
    const res = await request(app).get('/api/testimonials');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });
});
