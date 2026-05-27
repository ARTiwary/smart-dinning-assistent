import { Router } from 'express';
import { orchestrate } from '../orchestrator/index.js';
import { initMenuEmbeddings } from '../lib/chroma.js';
import { prisma } from '../db/prisma.js';

const router = Router();

// Initialize embeddings on first request (lazy load)
let embeddingsReady = false;

async function ensureEmbeddings() {
  if (!embeddingsReady) {
    await initMenuEmbeddings();
    embeddingsReady = true;
  }
}

router.post('/:sessionId/ai/chat', async (req, res) => {
  try {
    await ensureEmbeddings();

    const { message, isFirstMessage } = req.body;
    const { sessionId } = req.params;

    // Validate session
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const result = await orchestrate(sessionId, message, isFirstMessage);
    res.json(result);

  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// SSE streaming endpoint
router.get('/:sessionId/ai/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { message } = req.query;
  const { sessionId } = req.params;

  try {
    await ensureEmbeddings();
    const result = await orchestrate(sessionId, message, false);
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  res.end();
});

export default router;