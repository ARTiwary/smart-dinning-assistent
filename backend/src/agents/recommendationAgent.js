import { llm } from '../lib/ollama.js'
import { searchMenuItems, initMenuEmbeddings } from '../lib/chroma.js'

export async function recommendationAgent(userMessage, preferences, cartItems, sessionPrefs, timeOfDay) {
  const searchQuery = buildSearchQuery(userMessage, preferences)
  const results = await searchMenuItems(searchQuery, 15)

  const cartItemNames = cartItems.map(c => c.menuItem?.name?.toLowerCase())
  let filtered = results.filter(r => !cartItemNames.includes(r.metadata.name?.toLowerCase()))

  const lowerMsg = userMessage.toLowerCase()
  if (lowerMsg.includes('dessert') || lowerMsg.includes('sweet') || lowerMsg.includes('meetha')) {
    filtered = filtered.filter(r => r.metadata.tags?.includes('sweet') || r.metadata.category?.includes('Dessert'))
  }
  if (lowerMsg.includes('drink') || lowerMsg.includes('beverage')) {
    filtered = filtered.filter(r => r.metadata.category?.includes('Beverages'))
  }

  const allergensToAvoid = sessionPrefs?.allergensToAvoid || preferences?.allergens_to_avoid || []
  const safe = allergensToAvoid.length > 0
    ? filtered.filter(r => !allergensToAvoid.some(a => r.metadata.allergens?.includes(a)))
    : filtered

  const seen = new Set()
  const deduped = safe.filter(r => {
    if (seen.has(r.metadata.name)) return false
    seen.add(r.metadata.name)
    return true
  })

  const finalSelection = deduped.length > 0 ? deduped : results.slice(0, 10)

  const menuContext = finalSelection.slice(0, 8).map(r =>
    `- ID: ${r.metadata.id} | ${r.metadata.name} (₹${r.metadata.price}) [${r.metadata.tags}]: ${r.pageContent}`
  ).join('\n')

  const prompt = `You are Zara, a witty dining assistant at Spice Garden restaurant.
Time: ${timeOfDay}
User said: "${userMessage}"
User preferences: ${JSON.stringify(preferences)}
Current cart: ${cartItems.length > 0 ? cartItems.map(c => c.menuItem?.name).join(', ') : 'empty'}

Available menu items:
${menuContext}

Rules:
- Suggest at most 3 items from the list above ONLY
- Never suggest items already in cart
- Be warm, brief, max 2 sentences
- Respond in same language as user

Respond ONLY with this JSON, no markdown:
{
  "message": "your warm intro",
  "suggestions": [
    {"itemId": "exact ID from list", "name": "name", "price": 0, "reason": "one line"}
  ]
}`

  try {
    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (parsed.suggestions) {
      parsed.suggestions = parsed.suggestions.map(s => ({
        ...s,
        itemId: s.itemId || s.id,
        id: s.itemId || s.id
      }))
    }
    return parsed
  } catch {
    return {
      message: "Here are some great options for you!",
      suggestions: finalSelection.slice(0, 3).map(r => ({
        itemId: r.metadata.id,
        id: r.metadata.id,
        name: r.metadata.name,
        price: r.metadata.price,
        reason: 'Popular choice'
      }))
    }
  }
}

function buildSearchQuery(message, preferences) {
  let query = message
  if (preferences?.spicy) query += ' spicy'
  if (preferences?.light) query += ' light'
  if (preferences?.veg === true) query += ' vegetarian veg'
  if (preferences?.veg === false) query += ' non-veg chicken mutton'
  if (preferences?.sweet) query += ' sweet dessert'
  if (preferences?.filling) query += ' filling heavy main'
  return query
}