import { fastLlm } from '../lib/ollama.js'

export async function multilingualAgent(userMessage) {
  const prompt = `You are a language normalizer for a restaurant ordering system.
Analyze the user message and extract structured intent.
User message: "${userMessage}"
Respond ONLY with a JSON object, no explanation, no markdown:
{
  "intent": "GREET|RECOMMEND|ADD_ITEM|UPSELL_CHECK|GROUP_MERGE|CHECKOUT|FALLBACK",
  "preferences": {
    "spicy": true,
    "light": false,
    "veg": null,
    "sweet": false,
    "filling": false,
    "allergens_to_avoid": []
  },
  "language": "english|hinglish|telugu-english|other",
  "itemMentioned": null,
  "groupSize": null,
  "raw": "${userMessage}"
}`

  try {
    const response = await fastLlm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('multilingualAgent error:', e.message)
    return {
      intent: 'RECOMMEND',
      preferences: {},
      language: 'english',
      itemMentioned: null,
      groupSize: null,
      raw: userMessage
    }
  }
}