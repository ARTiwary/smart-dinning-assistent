import { Router } from 'express';
import { getOrCreateSession } from '../services/sessionService.js';

const router = Router();

router.get('/:tableId/session', async (req, res) => {
  const session = await getOrCreateSession(req.params.tableId);
  res.json(session);
});

export default router;