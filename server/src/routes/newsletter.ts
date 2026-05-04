import { Router } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JSONStore } from '../store/JSONStore.js';
import { requireAuth } from '../middleware/auth.js';
import type { NewsletterEmail } from '../types/index.js';

interface NewsletterData {
  emails: NewsletterEmail[];
}

const newsletterStore = new JSONStore<NewsletterData>(
  path.resolve('data/newsletter.json'),
  { emails: [] }
);

const router = Router();

// POST /api/newsletter - Subscribe (Public)
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Email inválido' });
    }

    const data = await newsletterStore.read();
    
    // Check if already exists
    if (data.emails.find(e => e.email.toLowerCase() === email.toLowerCase())) {
      return res.json({ success: true, message: 'Ya estás suscrito' });
    }

    const newEntry: NewsletterEmail = {
      id: uuidv4(),
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString()
    };

    data.emails.push(newEntry);
    await newsletterStore.write(data);

    res.status(201).json({ success: true, data: newEntry });
  } catch {
    res.status(500).json({ success: false, error: 'Error al procesar la suscripción' });
  }
});

// GET /api/newsletter - List all (Admin)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const data = await newsletterStore.read();
    res.json({ success: true, data: data.emails });
  } catch {
    res.status(500).json({ success: false, error: 'Error al obtener emails' });
  }
});

// DELETE /api/newsletter/:id - Delete one (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const data = await newsletterStore.read();
    const index = data.emails.findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Email no encontrado' });
    }

    data.emails.splice(index, 1);
    await newsletterStore.write(data);

    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, error: 'Error al eliminar email' });
  }
});

// DELETE /api/newsletter - Delete all (Admin)
router.delete('/', requireAuth, async (_req, res) => {
  try {
    await newsletterStore.write({ emails: [] });
    res.json({ success: true, data: null });
  } catch {
    res.status(500).json({ success: false, error: 'Error al vaciar la lista' });
  }
});

export default router;
