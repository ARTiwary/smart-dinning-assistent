import { Router } from 'express';
import { getOrCreateSession } from '../services/sessionService.js';

const router = Router();

router.get('/:tableId/session', async (req, res) => {
  const session = await getOrCreateSession(req.params.tableId);
  res.json(session);
});

router.patch('/:sessionId/phone', async (req, res) => {
  const { phone } = req.body
  const session = await prisma.session.update({
    where: { id: req.params.sessionId },
    data: { customerPhone: phone }
  })
  res.json(session)
});

export default router;