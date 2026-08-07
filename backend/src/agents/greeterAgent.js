import { llm } from '../lib/ollama.js'
import { getLastOrder, getFavoriteItems } from '../../services/customerService.js'

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  or: 'Odia',
  // add any other codes your LanguageSwitcher supports
}

export async function greeterAgent(tableId, timeOfDay, profileMemory, language = 'en') {
  const isReturning = profileMemory && profileMemory.orderCount > 0
  let lastOrder = null
  let favoriteItems = []

  if (isReturning && profileMemory.phone) {
    try {
      lastOrder = await getLastOrder(profileMemory.phone)
      favoriteItems = await getFavoriteItems(profileMemory.phone)
    } catch (e) {}
  }

  const lastOrderItems = lastOrder?.orderItems?.map(oi => oi.menuItem?.name).join(', ')
  const favNames = favoriteItems.slice(0, 3).map(i => i.name).join(', ')
  const languageName = LANGUAGE_NAMES[language] || 'English'

  const prompt = isReturning
    ? `You are Zara, warm dining assistant at Spice Garden.
Returning customer: ${profileMemory.name}, visited ${profileMemory.orderCount} times.
${lastOrderItems ? `Last order: ${lastOrderItems}` : ''}
${favNames ? `Favorite items: ${favNames}` : ''}
Time: ${timeOfDay}

Welcome them back personally, mention their last order or favorites if available, ask if they want the same or something new.
Keep it warm, personal, 2-3 sentences max.
Respond only in ${languageName}, as plain text.`
    : `You are Zara, warm dining assistant at Spice Garden.
New customer at table ${tableId}. Time: ${timeOfDay}.
Greet warmly in 1-2 sentences, ask about their mood today.
Respond only in ${languageName}, as plain text.`

  try {
    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    return text.trim()
  } catch (e) {
    // Fallback strings stay English-only since they're hardcoded, not LLM output.
    // If you need localized fallbacks too, swap these for a lookup keyed by `language`.
    if (isReturning) {
      const greeting = lastOrderItems
        ? `Welcome back ${profileMemory.name}! 🎉 Last time you had ${lastOrderItems} — want the same again or shall we try something new?`
        : `Welcome back ${profileMemory.name}! 🎉 Great to see you again. What are you in the mood for today?`
      return greeting
    }
    return "Welcome to Spice Garden! 🍛 I'm Zara. What are you in the mood for today?"
  }
}