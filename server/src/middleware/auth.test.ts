import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { requireAuth } from './auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-3drioja';

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.get('/protected', requireAuth, (_req, res) => {
    res.json({ success: true, data: { message: 'ok' } });
  });

  return app;
}

describe('requireAuth middleware', () => {
  it('returns 401 with "No autenticado" when no token cookie is present', async () => {
    const app = createApp();
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'No autenticado' });
  });

  it('returns 401 with "Token inválido" when token is invalid', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/protected')
      .set('Cookie', 'token=invalid-jwt-token');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Token inválido' });
  });

  it('returns 401 with "Token inválido" when token is expired', async () => {
    const app = createApp();
    const expiredToken = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '0s' });

    // Small delay to ensure token is expired
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .get('/protected')
      .set('Cookie', `token=${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Token inválido' });
  });

  it('calls next() and allows access when token is valid', async () => {
    const app = createApp();
    const validToken = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .get('/protected')
      .set('Cookie', `token=${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { message: 'ok' } });
  });

  it('returns 401 when token is signed with a different secret', async () => {
    const app = createApp();
    const wrongToken = jwt.sign({ username: 'admin' }, 'wrong-secret', { expiresIn: '1h' });

    const res = await request(app)
      .get('/protected')
      .set('Cookie', `token=${wrongToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Token inválido' });
  });
});
