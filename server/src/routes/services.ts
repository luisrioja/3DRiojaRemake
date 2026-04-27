import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JSONStore } from '../store/JSONStore.js';
import { requireAuth } from '../middleware/auth.js';
import { validateServiceInput } from '../utils/validation.js';
import type { Service, ApiResponse } from '../types/index.js';

interface ServicesData {
  services: Service[];
}

const servicesStore = new JSONStore<ServicesData>(
  path.resolve('data/services.json'),
  { services: [] }
);

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const data = await servicesStore.read();
    const response: ApiResponse<Service[]> = { success: true, data: data.services };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al obtener los servicios' };
    res.status(500).json(response);
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const validation = validateServiceInput(req.body);
    if (!validation.valid) {
      const response: ApiResponse<never> = { success: false, error: validation.error };
      res.status(400).json(response);
      return;
    }

    const { title, description, icon } = req.body;
    const now = new Date().toISOString();
    const newService: Service = {
      id: uuidv4(),
      title,
      description,
      icon,
      createdAt: now,
      updatedAt: now,
    };

    const data = await servicesStore.read();
    data.services.push(newService);
    await servicesStore.write(data);

    const response: ApiResponse<Service> = { success: true, data: newService };
    res.status(201).json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al crear el servicio' };
    res.status(500).json(response);
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const validation = validateServiceInput(req.body);
    if (!validation.valid) {
      const response: ApiResponse<never> = { success: false, error: validation.error };
      res.status(400).json(response);
      return;
    }

    const data = await servicesStore.read();
    const index = data.services.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      const response: ApiResponse<never> = { success: false, error: 'Servicio no encontrado' };
      res.status(404).json(response);
      return;
    }

    const { title, description, icon } = req.body;
    const updated: Service = {
      ...data.services[index],
      title,
      description,
      icon,
      updatedAt: new Date().toISOString(),
    };
    data.services[index] = updated;
    await servicesStore.write(data);

    const response: ApiResponse<Service> = { success: true, data: updated };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al actualizar el servicio' };
    res.status(500).json(response);
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const data = await servicesStore.read();
    const index = data.services.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      const response: ApiResponse<never> = { success: false, error: 'Servicio no encontrado' };
      res.status(404).json(response);
      return;
    }

    data.services.splice(index, 1);
    await servicesStore.write(data);

    const response: ApiResponse<null> = { success: true, data: null };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al eliminar el servicio' };
    res.status(500).json(response);
  }
});

export default router;
