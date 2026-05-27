import { Router } from 'express';

const router = Router();

router.post('/:sessionId/ai/chat', async (req, res) => {
  res.json({ message: 'AI layer coming in Phase 3', suggestions: [] });
});

export default router;