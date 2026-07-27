import { Router } from 'express'
import { orchestrate } from '../orchestrator/index.js'
import { initMenuEmbeddings } from '../lib/chroma.js'
import { prisma } from '../db/prisma.js'
import { llm } from '../lib/ollama.js'

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
router.post('/:sessionId/ai/combo', async (req, res) => {
  try {
    const { budget, preference } = req.body
    const { sessionId } = req.params

    const items = await prisma.menuItem.findMany({ where: { available: true } })

    const starters = items.filter(i => i.category.includes('Starters'))
    const mains = items.filter(i => i.category.includes('Mains'))
    const breads = items.filter(i => i.category.includes('Breads'))
    const drinks = items.filter(i => i.category.includes('Beverages'))
    const desserts = items.filter(i => i.category.includes('Desserts'))

    const isVeg = preference === 'veg'

    const filteredStarters = starters.filter(i => !isVeg || i.tags.includes('veg'))
    const filteredMains = mains.filter(i => !isVeg || i.tags.includes('veg'))

    const prompt = `You are Zara, a smart dining assistant at Spice Garden.
Customer budget: ₹${budget}
Preference: ${preference}

Available items:
STARTERS: ${filteredStarters.map(i => `${i.name}(₹${i.price},id:${i.id})`).join(', ')}
MAINS: ${filteredMains.map(i => `${i.name}(₹${i.price},id:${i.id})`).join(', ')}
BREADS: ${breads.map(i => `${i.name}(₹${i.price},id:${i.id})`).join(', ')}
DRINKS: ${drinks.map(i => `${i.name}(₹${i.price},id:${i.id})`).join(', ')}
DESSERTS: ${desserts.map(i => `${i.name}(₹${i.price},id:${i.id})`).join(', ')}

Build the BEST complete meal combo within ₹${budget} budget.
Pick 1 starter + 1 main + 1 bread + 1 drink. Optionally 1 dessert if budget allows.
Total must be under ₹${budget}.

Respond ONLY with JSON, no markdown:
{
  "message": "warm intro about this combo",
  "totalPrice": 0,
  "savings": 0,
  "items": [
    {"itemId": "id", "name": "name", "price": 0, "category": "Starter/Main/Bread/Drink/Dessert", "reason": "why this"}
  ]
}`

    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.json(parsed)
  } catch (e) {
    console.error('Combo error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router