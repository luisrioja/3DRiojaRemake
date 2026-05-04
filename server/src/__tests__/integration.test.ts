import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { JSONStore } from '../store/JSONStore.js';
import { requireAuth } from '../middleware/auth.js';
import { validatePortfolioInput, validateServiceInput, validateLoginInput } from '../utils/validation.js';
import type { PortfolioProject, Service, Testimonial, ApiResponse } from '../types/index.js';

const JWT_SECRET = 'dev-secret-3drioja';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'VrjoNeFoNZoW3xC';

// --- Test App Factory ---
// Creates a fresh Express app with routes pointing to temp data directories

interface TestAppOptions {
  dataDir: string;
}

function createTestApp({ dataDir }: TestAppOptions) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // --- Portfolio routes ---
  const portfolioStore = new JSONStore<{ projects: PortfolioProject[] }>(
    join(dataDir, 'portfolio.json'),
    { projects: [] }
  );

  const portfolioRouter = express.Router();

  portfolioRouter.get('/', async (_req, res) => {
    const data = await portfolioStore.read();
    res.json({ success: true, data: data.projects } as ApiResponse<PortfolioProject[]>);
  });

  portfolioRouter.get('/:id', async (req, res) => {
    const data = await portfolioStore.read();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
      return;
    }
    res.json({ success: true, data: project } as ApiResponse<PortfolioProject>);
  });

  portfolioRouter.post('/', requireAuth, async (req, res) => {
    const validation = validatePortfolioInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    const { title, description, image } = req.body;
    const now = new Date().toISOString();
    const newProject: PortfolioProject = { id: uuidv4(), title, description, image, createdAt: now, updatedAt: now };
    const data = await portfolioStore.read();
    data.projects.push(newProject);
    await portfolioStore.write(data);
    res.status(201).json({ success: true, data: newProject } as ApiResponse<PortfolioProject>);
  });

  portfolioRouter.put('/:id', requireAuth, async (req, res) => {
    const validation = validatePortfolioInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    const data = await portfolioStore.read();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
      return;
    }
    const { title, description, image } = req.body;
    const updated: PortfolioProject = { ...data.projects[index], title, description, image, updatedAt: new Date().toISOString() };
    data.projects[index] = updated;
    await portfolioStore.write(data);
    res.json({ success: true, data: updated } as ApiResponse<PortfolioProject>);
  });

  portfolioRouter.delete('/:id', requireAuth, async (req, res) => {
    const data = await portfolioStore.read();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
      return;
    }
    data.projects.splice(index, 1);
    await portfolioStore.write(data);
    res.json({ success: true, data: null } as ApiResponse<null>);
  });

  // --- Services routes ---
  const servicesStore = new JSONStore<{ services: Service[] }>(
    join(dataDir, 'services.json'),
    { services: [] }
  );

  const servicesRouter = express.Router();

  servicesRouter.get('/', async (_req, res) => {
    const data = await servicesStore.read();
    res.json({ success: true, data: data.services } as ApiResponse<Service[]>);
  });

  servicesRouter.post('/', requireAuth, async (req, res) => {
    const validation = validateServiceInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    const { title, description, icon } = req.body;
    const now = new Date().toISOString();
    const newService: Service = { id: uuidv4(), title, description, icon, createdAt: now, updatedAt: now };
    const data = await servicesStore.read();
    data.services.push(newService);
    await servicesStore.write(data);
    res.status(201).json({ success: true, data: newService } as ApiResponse<Service>);
  });

  servicesRouter.put('/:id', requireAuth, async (req, res) => {
    const validation = validateServiceInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    const data = await servicesStore.read();
    const index = data.services.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Servicio no encontrado' });
      return;
    }
    const { title, description, icon } = req.body;
    const updated: Service = { ...data.services[index], title, description, icon, updatedAt: new Date().toISOString() };
    data.services[index] = updated;
    await servicesStore.write(data);
    res.json({ success: true, data: updated } as ApiResponse<Service>);
  });

  servicesRouter.delete('/:id', requireAuth, async (req, res) => {
    const data = await servicesStore.read();
    const index = data.services.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Servicio no encontrado' });
      return;
    }
    data.services.splice(index, 1);
    await servicesStore.write(data);
    res.json({ success: true, data: null } as ApiResponse<null>);
  });

  // --- Testimonials route ---
  const testimonialsStore = new JSONStore<{ testimonials: Testimonial[] }>(
    join(dataDir, 'testimonials.json'),
    { testimonials: [] }
  );

  const testimonialsRouter = express.Router();

  testimonialsRouter.get('/', async (_req, res) => {
    const data = await testimonialsStore.read();
    res.json({ success: true, data: data.testimonials } as ApiResponse<Testimonial[]>);
  });

  // --- Auth routes ---
  const authRouter = express.Router();

  authRouter.post('/login', (req, res) => {
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    const { username, password } = req.body as { username: string; password: string };
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      return;
    }
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: { message: 'Login exitoso' } });
  });

  authRouter.post('/logout', (_req, res) => {
    res.clearCookie('token', { path: '/' });
    res.json({ success: true, data: { message: 'Logout exitoso' } });
  });

  authRouter.get('/verify', (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }
    try {
      jwt.verify(token, JWT_SECRET);
      res.json({ success: true, data: { valid: true } });
    } catch {
      res.status(401).json({ success: false, error: 'Token inválido' });
    }
  });

  // Mount routes
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/testimonials', testimonialsRouter);
  app.use('/api/auth', authRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
  });

  return app;
}

// --- Helper: login and get auth cookie ---
async function loginAgent(app: express.Express): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
  const cookies = res.headers['set-cookie'];
  const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
  return cookieStr || '';
}

// ============================================================
// Integration Tests
// ============================================================

describe('Integration Tests', () => {
  let tempDir: string;
  let app: express.Express;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'integration-'));
    app = createTestApp({ dataDir: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // --- 1. CRUD flow for Portfolio ---
  describe('Portfolio CRUD flow', () => {
    it('login → create → GET all → update → GET by id → delete → GET all', async () => {
      const cookie = await loginAgent(app);

      // Create a project
      const createRes = await request(app)
        .post('/api/portfolio')
        .set('Cookie', cookie)
        .send({ title: 'Proyecto Test', description: 'Descripción test', image: '/img/test.jpg' });
      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const projectId = createRes.body.data.id;
      expect(projectId).toBeDefined();

      // GET all — verify new project exists
      const getAllRes = await request(app).get('/api/portfolio');
      expect(getAllRes.status).toBe(200);
      expect(getAllRes.body.data).toHaveLength(1);
      expect(getAllRes.body.data[0].title).toBe('Proyecto Test');

      // Update the project
      const updateRes = await request(app)
        .put(`/api/portfolio/${projectId}`)
        .set('Cookie', cookie)
        .send({ title: 'Proyecto Actualizado', description: 'Desc actualizada', image: '/img/updated.jpg' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Proyecto Actualizado');

      // GET by id — verify updated
      const getByIdRes = await request(app).get(`/api/portfolio/${projectId}`);
      expect(getByIdRes.status).toBe(200);
      expect(getByIdRes.body.data.title).toBe('Proyecto Actualizado');
      expect(getByIdRes.body.data.description).toBe('Desc actualizada');

      // Delete the project
      const deleteRes = await request(app)
        .delete(`/api/portfolio/${projectId}`)
        .set('Cookie', cookie);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // GET all — verify removed
      const finalGetRes = await request(app).get('/api/portfolio');
      expect(finalGetRes.status).toBe(200);
      expect(finalGetRes.body.data).toHaveLength(0);
    });
  });

  // --- 2. CRUD flow for Services ---
  describe('Services CRUD flow', () => {
    it('login → create → GET all → update → GET all → delete → GET all', async () => {
      const cookie = await loginAgent(app);

      // Create a service
      const createRes = await request(app)
        .post('/api/services')
        .set('Cookie', cookie)
        .send({ title: 'Impresión 3D', description: 'Servicio de impresión', icon: 'printer-3d' });
      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      const serviceId = createRes.body.data.id;

      // GET all — verify new service exists
      const getAllRes = await request(app).get('/api/services');
      expect(getAllRes.status).toBe(200);
      expect(getAllRes.body.data).toHaveLength(1);
      expect(getAllRes.body.data[0].title).toBe('Impresión 3D');

      // Update the service
      const updateRes = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Cookie', cookie)
        .send({ title: 'Consultoría 3D', description: 'Servicio de consultoría', icon: 'consult' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Consultoría 3D');

      // GET all — verify updated
      const getUpdatedRes = await request(app).get('/api/services');
      expect(getUpdatedRes.status).toBe(200);
      expect(getUpdatedRes.body.data[0].title).toBe('Consultoría 3D');

      // Delete the service
      const deleteRes = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Cookie', cookie);
      expect(deleteRes.status).toBe(200);

      // GET all — verify removed
      const finalGetRes = await request(app).get('/api/services');
      expect(finalGetRes.status).toBe(200);
      expect(finalGetRes.body.data).toHaveLength(0);
    });
  });

  // --- 3. Auth flow ---
  describe('Auth flow', () => {
    it('login → verify returns valid → logout → verify returns 401', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      const cookie = loginRes.headers['set-cookie'];
      expect(cookie).toBeDefined();

      const cookieStr = Array.isArray(cookie) ? cookie[0] : cookie;

      // Verify — should be valid
      const verifyRes = await request(app)
        .get('/api/auth/verify')
        .set('Cookie', cookieStr);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(true);

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookieStr);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify after logout — should return 401
      // Note: supertest doesn't automatically clear cookies, so we send without cookie
      const verifyAfterLogout = await request(app)
        .get('/api/auth/verify');
      expect(verifyAfterLogout.status).toBe(401);
      expect(verifyAfterLogout.body.success).toBe(false);
    });

    it('login with invalid credentials returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'wrong', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales incorrectas');
    });
  });

  // --- 4. Testimonials: cached data ---
  describe('Testimonials cached data', () => {
    it('GET /api/testimonials returns cached data from file', async () => {
      // Seed testimonials data file
      const testimonials = [
        { id: 't1', author: 'María García', text: 'Excelente servicio', rating: 5, date: '2025-02-10' },
        { id: 't2', author: 'Carlos Martínez', text: 'Muy profesionales', rating: 4, date: '2025-01-25' },
      ];
      await writeFile(
        join(tempDir, 'testimonials.json'),
        JSON.stringify({ testimonials }),
        'utf-8'
      );

      const res = await request(app).get('/api/testimonials');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].author).toBe('María García');
      expect(res.body.data[1].author).toBe('Carlos Martínez');
    });

    it('GET /api/testimonials returns empty array when no data file exists', async () => {
      // No testimonials.json seeded — store returns default
      const res = await request(app).get('/api/testimonials');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  // --- 5. Protected routes without auth return 401 ---
  describe('Protected routes without auth', () => {
    const protectedRoutes = [
      { method: 'post' as const, path: '/api/portfolio', body: { title: 'T', description: 'D', image: 'I' } },
      { method: 'put' as const, path: '/api/portfolio/fake-id', body: { title: 'T', description: 'D', image: 'I' } },
      { method: 'delete' as const, path: '/api/portfolio/fake-id', body: {} },
      { method: 'post' as const, path: '/api/services', body: { title: 'T', description: 'D', icon: 'I' } },
      { method: 'put' as const, path: '/api/services/fake-id', body: { title: 'T', description: 'D', icon: 'I' } },
      { method: 'delete' as const, path: '/api/services/fake-id', body: {} },
    ];

    for (const route of protectedRoutes) {
      it(`${route.method.toUpperCase()} ${route.path} returns 401 without auth`, async () => {
        const res = await request(app)[route.method](route.path).send(route.body);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    }
  });

  // --- 6. Live data: admin changes reflected in public endpoints ---
  describe('Live data: admin changes reflected in public endpoints', () => {
    it('portfolio changes via admin are visible on public GET', async () => {
      const cookie = await loginAgent(app);

      // Public GET — initially empty
      const emptyRes = await request(app).get('/api/portfolio');
      expect(emptyRes.body.data).toHaveLength(0);

      // Admin creates a project
      const createRes = await request(app)
        .post('/api/portfolio')
        .set('Cookie', cookie)
        .send({ title: 'Nuevo Proyecto', description: 'Visible públicamente', image: '/img/new.jpg' });
      const projectId = createRes.body.data.id;

      // Public GET — now has the project
      const afterCreateRes = await request(app).get('/api/portfolio');
      expect(afterCreateRes.body.data).toHaveLength(1);
      expect(afterCreateRes.body.data[0].title).toBe('Nuevo Proyecto');

      // Admin updates the project
      await request(app)
        .put(`/api/portfolio/${projectId}`)
        .set('Cookie', cookie)
        .send({ title: 'Proyecto Editado', description: 'Actualizado', image: '/img/edit.jpg' });

      // Public GET — reflects update
      const afterUpdateRes = await request(app).get('/api/portfolio');
      expect(afterUpdateRes.body.data[0].title).toBe('Proyecto Editado');

      // Admin deletes the project
      await request(app)
        .delete(`/api/portfolio/${projectId}`)
        .set('Cookie', cookie);

      // Public GET — empty again
      const afterDeleteRes = await request(app).get('/api/portfolio');
      expect(afterDeleteRes.body.data).toHaveLength(0);
    });

    it('services changes via admin are visible on public GET', async () => {
      const cookie = await loginAgent(app);

      // Admin creates a service
      const createRes = await request(app)
        .post('/api/services')
        .set('Cookie', cookie)
        .send({ title: 'Servicio Nuevo', description: 'Público', icon: 'star' });
      const serviceId = createRes.body.data.id;

      // Public GET — has the service
      const afterCreateRes = await request(app).get('/api/services');
      expect(afterCreateRes.body.data).toHaveLength(1);
      expect(afterCreateRes.body.data[0].title).toBe('Servicio Nuevo');

      // Admin updates
      await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Cookie', cookie)
        .send({ title: 'Servicio Editado', description: 'Actualizado', icon: 'edit' });

      // Public GET — reflects update
      const afterUpdateRes = await request(app).get('/api/services');
      expect(afterUpdateRes.body.data[0].title).toBe('Servicio Editado');

      // Admin deletes
      await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Cookie', cookie);

      // Public GET — empty
      const afterDeleteRes = await request(app).get('/api/services');
      expect(afterDeleteRes.body.data).toHaveLength(0);
    });
  });
});
