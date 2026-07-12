import { llm } from '../lib/ollama.js'
import { searchMenuItems } from '../lib/chroma.js'

export async function recommendationAgent(userMessage, preferences, cartItems, sessionPrefs, timeOfDay) {
  const searchQuery = buildSearchQuery(userMessage, preferences)

  // Real RAG — semantic vector search
  const results = await searchMenuItems(searchQuery, 15)

  const cartItemNames = cartItems.map(c => c.menuItem?.name?.toLowerCase())
  let filtered = results.filter(r => !cartItemNames.includes(r.metadata.name?.toLowerCase()))

  // Category filter
  const lowerMsg = userMessage.toLowerCase()
  if (lowerMsg.includes('dessert') || lowerMsg.includes('sweet') || lowerMsg.includes('meetha')) {
    const desserts = filtered.filter(r => r.metadata.category?.includes('Dessert') || r.metadata.tags?.includes('sweet'))
    if (desserts.length > 0) filtered = desserts
  }
  if (lowerMsg.includes('drink') || lowerMsg.includes('beverage') || lowerMsg.includes('chai') || lowerMsg.includes('coffee')) {
    const drinks = filtered.filter(r => r.metadata.category?.includes('Beverages'))
    if (drinks.length > 0) filtered = drinks
  }

  // Allergen filter
  const allergensToAvoid = sessionPrefs?.allergensToAvoid || preferences?.allergens_to_avoid || []
  const safe = allergensToAvoid.length > 0
    ? filtered.filter(r => !allergensToAvoid.some(a => r.metadata.allergens?.includes(a)))
    : filtered

  // Deduplicate
  const seen = new Set()
  const deduped = safe.filter(r => {
    if (seen.has(r.metadata.name)) return false
    seen.add(r.metadata.name)
    return true
  })

  const finalSelection = deduped.length > 0 ? deduped : results.slice(0, 8)

  const menuContext = finalSelection.slice(0, 8).map(r =>
    `- ID: ${r.metadata.id} | ${r.metadata.name} (₹${r.metadata.price}) [${r.metadata.tags}] similarity: ${r.metadata.similarity?.toFixed(2) || 'n/a'}: ${r.pageContent}`
  ).join('\n')

  const prompt = `You are Zara, a witty dining assistant at Spice Garden restaurant.
Time: ${timeOfDay}
User said: "${userMessage}"
User preferences: ${JSON.stringify(preferences)}
Current cart: ${cartItems.length > 0 ? cartItems.map(c => c.menuItem?.name).join(', ') : 'empty'}

Available menu items (ranked by semantic similarity to user request):
${menuContext}

Rules:
- Suggest at most 3 items from the list above ONLY
- Never suggest items already in cart
- Be warm, brief, max 2 sentences
- Respond in same language as user
- No greetings like Namaste or Welcome — go straight to suggestions

Respond ONLY with this JSON, no markdown:
{
  "message": "brief warm intro",
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
  if (preferences?.spicy) query += ' spicy hot'
  if (preferences?.light) query += ' light healthy'
  if (preferences?.veg === true) query += ' vegetarian veg'
  if (preferences?.veg === false) query += ' non-veg chicken mutton'
  if (preferences?.sweet) query += ' sweet dessert'
  if (preferences?.filling) query += ' filling heavy main course'
  return query
}