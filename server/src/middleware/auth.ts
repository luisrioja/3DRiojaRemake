import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-3drioja';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    const response: ApiResponse<never> = { success: false, error: 'No autenticado' };
    res.status(401).json(response);
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Token inválido' };
    res.status(401).json(response);
    return;
  }
}
