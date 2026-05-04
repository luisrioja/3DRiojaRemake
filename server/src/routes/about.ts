import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JSONStore } from '../store/JSONStore.js';
import { requireAuth } from '../middleware/auth.js';
import { AboutSection } from '../types/index.js';
import path from 'path';

const router = express.Router();
const store = new JSONStore<{ about: AboutSection[] }>(
  path.resolve('data/about.json'),
  { about: [] }
);

// GET /api/about
router.get('/', async (_req, res) => {
  try {
    const data = await store.read();
    const sorted = [...(data.about || [])].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching about sections' });
  }
});

// POST /api/about
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, order } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const data = await store.read();
    const about = data.about || [];

    const newSection: AboutSection = {
      id: uuidv4(),
      title,
      content,
      order: order !== undefined ? order : about.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    about.push(newSection);
    await store.write({ ...data, about });

    res.status(201).json({ success: true, data: newSection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error creating about section' });
  }
});

// PUT /api/about/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, order } = req.body;
    const { id } = req.params;

    const data = await store.read();
    const about = data.about || [];
    const index = about.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'About section not found' });
    }

    const updatedSection = {
      ...about[index],
      title: title ?? about[index].title,
      content: content ?? about[index].content,
      order: order ?? about[index].order,
      updatedAt: new Date().toISOString(),
    };

    about[index] = updatedSection;
    await store.write({ ...data, about });

    res.json({ success: true, data: updatedSection });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error updating about section' });
  }
});

// DELETE /api/about/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await store.read();
    const about = data.about || [];

    const filtered = about.filter((s) => s.id !== id);

    if (filtered.length === about.length) {
      return res.status(404).json({ success: false, error: 'About section not found' });
    }

    await store.write({ ...data, about: filtered });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting about section' });
  }
});

export default router;
