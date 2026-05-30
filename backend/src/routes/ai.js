import { Router } from 'express'
import { orchestrate } from '../orchestrator/index.js'
import { initMenuEmbeddings } from '../lib/chroma.js'
import { prisma } from '../db/prisma.js'

const router = Router()
let embeddingsReady = false

async function ensureEmbeddings() {
  if (!embeddingsReady) {
    await initMenuEmbeddings()
    embeddingsReady = true
  }
}

router.post('/:sessionId/ai/chat', async (req, res) => {
  try {
    await ensureEmbeddings()
    const { message, isFirstMessage } = req.body
    const { sessionId } = req.params
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const result = await orchestrate(sessionId, message, isFirstMessage)
    res.json(result)
  } catch (err) {
    console.error('AI error:', err)
    res.status(500).json({ error: 'AI service error', details: err.message })
  }
})

export default router