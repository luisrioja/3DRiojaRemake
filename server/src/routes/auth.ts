import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { validateLoginInput } from '../utils/validation.js';
import type { ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-3drioja';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VrjoNeFoNZoW3xC';

const router = Router();

router.post('/login', (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.valid) {
    const response: ApiResponse<never> = { success: false, error: validation.error };
    res.status(400).json(response);
    return;
  }

  const { username, password } = req.body as { username: string; password: string };

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    const response: ApiResponse<never> = { success: false, error: 'Credenciales incorrectas' };
    res.status(401).json(response);
    return;
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Login exitoso' },
  };
  res.json(response);
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Logout exitoso' },
  };
  res.json(response);
});

router.get('/verify', (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    const response: ApiResponse<never> = { success: false, error: 'No autenticado' };
    res.status(401).json(response);
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    const response: ApiResponse<{ valid: boolean }> = { success: true, data: { valid: true } };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Token inválido' };
    res.status(401).json(response);
    return;
  }
});

export default router;
