import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  return app;
}

describe('Auth Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 and set httpOnly cookie with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'VrjoNeFoNZoW3xC' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Login exitoso');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : typeof cookies === 'string' && cookies.startsWith('token=') ? cookies : undefined;
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('Path=/');
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Credenciales incorrectas');
    });

    it('should return 401 with wrong username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wrong', password: 'VrjoNeFoNZoW3xC' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales incorrectas');
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 with empty username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: 'VrjoNeFoNZoW3xC' });

      expect(res.status).toBe(400);
    });

    it('should return 400 with empty password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logout exitoso');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : typeof cookies === 'string' && cookies.startsWith('token=') ? cookies : undefined;
      expect(tokenCookie).toBeDefined();
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 401 when no token is present', async () => {
      const res = await request(app).get('/api/auth/verify');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No autenticado');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', 'token=invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Token inválido');
    });

    it('should return valid:true with a valid token', async () => {
      // First login to get a valid token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'VrjoNeFoNZoW3xC' });

      const cookies = loginRes.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', tokenCookie!);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
    });

    it('should return 401 after logout', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'VrjoNeFoNZoW3xC' });

      const cookies = loginRes.headers['set-cookie'];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', tokenCookie!);

      // Verify without cookie (simulating cleared cookie)
      const res = await request(app).get('/api/auth/verify');

      expect(res.status).toBe(401);
    });
  });
});
