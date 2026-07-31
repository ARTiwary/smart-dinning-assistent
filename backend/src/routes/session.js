import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getOrCreateSession } from '../services/sessionService.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/:tableId/session', async (req, res) => {
  try {
    const session = await getOrCreateSession(req.params.tableId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:sessionId/phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const session = await prisma.session.update({
      where: { id: req.params.sessionId },
      data: { customerPhone: phone }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;