import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JSONStore } from '../store/JSONStore.js';
import { requireAuth } from '../middleware/auth.js';
import { validatePortfolioInput } from '../utils/validation.js';
import type { PortfolioProject, ApiResponse } from '../types/index.js';

interface PortfolioData {
  projects: PortfolioProject[];
}

const portfolioStore = new JSONStore<PortfolioData>(
  path.resolve('data/portfolio.json'),
  { projects: [] }
);

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const data = await portfolioStore.read();
    const response: ApiResponse<PortfolioProject[]> = { success: true, data: data.projects };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al obtener los proyectos' };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await portfolioStore.read();
    const project = data.projects.find((p) => p.id === req.params.id);
    if (!project) {
      const response: ApiResponse<never> = { success: false, error: 'Proyecto no encontrado' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse<PortfolioProject> = { success: true, data: project };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al obtener el proyecto' };
    res.status(500).json(response);
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const validation = validatePortfolioInput(req.body);
    if (!validation.valid) {
      const response: ApiResponse<never> = { success: false, error: validation.error };
      res.status(400).json(response);
      return;
    }

    const { title, description, image } = req.body;
    const now = new Date().toISOString();
    const newProject: PortfolioProject = {
      id: uuidv4(),
      title,
      description,
      image,
      createdAt: now,
      updatedAt: now,
    };

    const data = await portfolioStore.read();
    data.projects.push(newProject);
    await portfolioStore.write(data);

    const response: ApiResponse<PortfolioProject> = { success: true, data: newProject };
    res.status(201).json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al crear el proyecto' };
    res.status(500).json(response);
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const validation = validatePortfolioInput(req.body);
    if (!validation.valid) {
      const response: ApiResponse<never> = { success: false, error: validation.error };
      res.status(400).json(response);
      return;
    }

    const data = await portfolioStore.read();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      const response: ApiResponse<never> = { success: false, error: 'Proyecto no encontrado' };
      res.status(404).json(response);
      return;
    }

    const { title, description, image } = req.body;
    const updated: PortfolioProject = {
      ...data.projects[index],
      title,
      description,
      image,
      updatedAt: new Date().toISOString(),
    };
    data.projects[index] = updated;
    await portfolioStore.write(data);

    const response: ApiResponse<PortfolioProject> = { success: true, data: updated };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al actualizar el proyecto' };
    res.status(500).json(response);
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const data = await portfolioStore.read();
    const index = data.projects.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      const response: ApiResponse<never> = { success: false, error: 'Proyecto no encontrado' };
      res.status(404).json(response);
      return;
    }

    data.projects.splice(index, 1);
    await portfolioStore.write(data);

    const response: ApiResponse<null> = { success: true, data: null };
    res.json(response);
  } catch {
    const response: ApiResponse<never> = { success: false, error: 'Error al eliminar el proyecto' };
    res.status(500).json(response);
  }
});

export default router;
