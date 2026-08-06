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

  // --- Budget Filter ---
  let finalSelection = deduped
  const budget = preferences?.budget
  if (budget && budget > 0) {
    const budgetFiltered = deduped.filter(r => r.metadata.price <= budget * 0.7)
    if (budgetFiltered.length >= 2) {
      finalSelection = budgetFiltered
    }
  }

  if (finalSelection.length === 0) {
    finalSelection = deduped.length > 0 ? deduped : results.slice(0, 8)
  }

  const menuContext = finalSelection.slice(0, 8).map(r =>
    `- ID: ${r.metadata.id} | ${r.metadata.name} (₹${r.metadata.price}) [${r.metadata.tags}] similarity: ${r.metadata.similarity?.toFixed(2) || 'n/a'}: ${r.pageContent}`
  ).join('\n')

  // --- Smart Context Detection Before Prompt ---
  const detectedContext = detectUserContext(lowerMsg, preferences)

  const prompt = `You are Zara, a brilliant and warm AI dining assistant at Spice Garden.
Time: ${timeOfDay}
User message: "${userMessage}"
Detected Context & Flags: ${detectedContext}
User preferences: ${JSON.stringify(preferences)}
Current cart: ${cartItems.length > 0 ? cartItems.map(c => c.menuItem?.name).join(', ') : 'empty'}

Available menu items (ranked by relevance):
${menuContext}

SMART RULES:
- If user mentions a BUDGET — suggest items that fit within it total
- If user mentions a DATE or COUPLE — suggest romantic, shareable, visually appealing items
- If user mentions VEGETARIAN + NON-VEG mix — suggest one of each
- If user mentions INSTAGRAM-WORTHY — prioritize colorful, premium, photogenic dishes
- If user mentions GROUP SIZE — adjust portions and suggest shareable platters
- If user mentions BIRTHDAY — suggest celebratory combos + dessert
- If user mentions KIDS — suggest mild, non-spicy, fun items
- If user mentions HEALTHY or FITNESS — suggest light, low-calorie items
- If user mentions FAST or QUICK — suggest items tagged quick-serve
- Suggest at most 3 items that TOGETHER make sense as a complete experience
- Never suggest items already in cart
- Be warm, witty, max 2 sentences — like a knowledgeable friend
- Respond in same language as user — Hinglish if they used it

Respond ONLY with this JSON, no markdown:
{
  "message": "warm personalized response addressing their specific situation",
  "suggestions": [
    {"itemId": "exact ID from list", "name": "name", "price": 0, "reason": "specific reason for this occasion"}
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

/**
 * Smart context detector that parses user input for specific intent signals
 */
function detectUserContext(lowerMsg, preferences) {
  const flags = []

  if (lowerMsg.includes('date') || lowerMsg.includes('girlfriend') || lowerMsg.includes('boyfriend') || lowerMsg.includes('romantic') || lowerMsg.includes('couple')) {
    flags.push('Romantic / Date Night')
  }
  if (lowerMsg.includes('birthday') || lowerMsg.includes('celebrate') || lowerMsg.includes('celebration') || lowerMsg.includes('party')) {
    flags.push('Celebratory / Birthday')
  }
  if (lowerMsg.includes('kid') || lowerMsg.includes('child') || lowerMsg.includes('children')) {
    flags.push('Kids Dining (Needs mild/kid-friendly options)')
  }
  if (lowerMsg.includes('healthy') || lowerMsg.includes('diet') || lowerMsg.includes('fitness') || lowerMsg.includes('calorie') || lowerMsg.includes('gym')) {
    flags.push('Health / Fitness Conscious')
  }
  if (lowerMsg.includes('fast') || lowerMsg.includes('quick') || lowerMsg.includes('hurry') || lowerMsg.includes('rush')) {
    flags.push('Quick Service Needed')
  }
  if (lowerMsg.includes('instagram') || lowerMsg.includes('photo') || lowerMsg.includes('aesthetic') || lowerMsg.includes('picture')) {
    flags.push('Instagram-Worthy / Aesthetic')
  }

  // Dietary mix detection (e.g. Veg + Non-Veg)
  const containsVeg = lowerMsg.includes('veg') || lowerMsg.includes('paneer')
  const containsNonVeg = lowerMsg.includes('non-veg') || lowerMsg.includes('chicken') || lowerMsg.includes('mutton') || lowerMsg.includes('meat')
  if (containsVeg && containsNonVeg) {
    flags.push('Mixed Group (Requires both Vegetarian & Non-Vegetarian options)')
  }

  // Budget detection
  if (preferences?.budget) {
    flags.push(`Budget Constraint Specified (~₹${preferences.budget})`)
  }

  return flags.length > 0 ? flags.join(', ') : 'General Dining'
}

/**
 * Builds an enriched search query for vector retrieval
 */
function buildSearchQuery(message, preferences) {
  let query = message
  const lower = message.toLowerCase()

  // Detect occasion
  if (lower.includes('date') || lower.includes('girlfriend') || lower.includes('romantic')) {
    query += ' premium romantic shareable instagram'
  }
  if (lower.includes('birthday') || lower.includes('celebrate') || lower.includes('celebration')) {
    query += ' special dessert celebratory'
  }
  if (lower.includes('kids') || lower.includes('children') || lower.includes('child')) {
    query += ' mild light quick'
  }
  if (lower.includes('healthy') || lower.includes('diet') || lower.includes('fitness') || lower.includes('calories')) {
    query += ' light healthy salad'
  }
  if (lower.includes('fast') || lower.includes('quick') || lower.includes('hurry')) {
    query += ' quick-serve fast'
  }
  if (lower.includes('instagram') || lower.includes('photo') || lower.includes('picture')) {
    query += ' colorful premium bestseller'
  }
  if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) {
    query += ' value combo deals'
  }

  // Preferences
  if (preferences?.spicy) query += ' spicy hot'
  if (preferences?.light) query += ' light healthy'
  if (preferences?.veg === true) query += ' vegetarian veg'
  if (preferences?.veg === false) query += ' non-veg chicken mutton'
  if (preferences?.sweet) query += ' sweet dessert'
  if (preferences?.filling) query += ' filling heavy main course'

  return query
}