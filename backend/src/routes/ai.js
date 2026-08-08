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
    await ensureEmbeddings()
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

router.get('/:sessionId/ai/time-picks', async (req, res) => {
  try {
    await ensureEmbeddings()
    const { sessionId } = req.params

    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const now = new Date()
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const hour = ist.getUTCHours()

    let timeSlot, tagFilters, message, emoji

    if (hour >= 7 && hour < 11) {
      timeSlot = 'Breakfast'
      tagFilters = ['light', 'quick-serve']
      message = "Good morning! Here's what's perfect for breakfast 🌅"
      emoji = '🌅'
    } else if (hour >= 11 && hour < 15) {
      timeSlot = 'Lunch'
      tagFilters = ['filling', 'bestseller']
      message = "It's lunch time! Here are today's top picks 🍽️"
      emoji = '☀️'
    } else if (hour >= 15 && hour < 18) {
      timeSlot = 'Evening Snacks'
      tagFilters = ['light', 'quick-serve', 'veg']
      message = "Evening snack time! Try these light bites ☕"
      emoji = '🌤️'
    } else if (hour >= 18 && hour < 22) {
      timeSlot = 'Dinner'
      tagFilters = ['filling', 'chef_special', 'bestseller']
      message = "Good evening! Tonight's chef specials are here 🌙"
      emoji = '🌙'
    } else {
      timeSlot = 'Late Night'
      tagFilters = ['light', 'quick-serve']
      message = "Late night cravings? We've got you covered 🌃"
      emoji = '🌃'
    }

    // Get items matching time slot
    const items = await prisma.menuItem.findMany({
      where: {
        available: true,
        OR: tagFilters.map(tag => ({ tags: { has: tag } }))
      },
      orderBy: { popularScore: 'desc' },
      take: 6
    })

    // Shuffle slightly for variety
    const shuffled = items.sort(() => Math.random() - 0.3).slice(0, 4)

    res.json({
      timeSlot,
      emoji,
      message,
      hour,
      items: shuffled.map(item => ({
        itemId: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        imageUrl: item.imageUrl,
        tags: item.tags,
        reason: getTimeReason(timeSlot, item)
      }))
    })
  } catch (e) {
    console.error('Time picks error:', e)
    res.status(500).json({ error: e.message })
  }
})

function getTimeReason(timeSlot, item) {
  const reasons = {
    'Breakfast': ['Perfect morning starter', 'Light and energizing', 'Quick breakfast option'],
    'Lunch': ['Popular lunch choice', 'Filling midday meal', 'Chef\'s lunch special'],
    'Evening Snacks': ['Perfect evening bite', 'Light and refreshing', 'Great with tea'],
    'Dinner': ['Tonight\'s special', 'Perfect dinner choice', 'Chef\'s recommendation'],
    'Late Night': ['Light late-night option', 'Quick and satisfying', 'Perfect for night owls']
  }
  const list = reasons[timeSlot] || ['Popular choice']
  return list[Math.floor(Math.random() * list.length)]
}

export default router