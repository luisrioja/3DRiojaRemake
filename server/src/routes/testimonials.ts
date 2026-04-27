import { Router } from 'express';
import path from 'path';
import { JSONStore } from '../store/JSONStore.js';
import type { Testimonial, ApiResponse } from '../types/index.js';

interface TestimonialsData {
  testimonials: Testimonial[];
}

const testimonialsStore = new JSONStore<TestimonialsData>(
  path.resolve('data/testimonials.json'),
  { testimonials: [] }
);

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const data = await testimonialsStore.read();
    const response: ApiResponse<Testimonial[]> = { success: true, data: data.testimonials };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al obtener los testimonios' };
    res.status(500).json(response);
  }
});

export default router;
