import { llm } from '../lib/ollama.js'

export async function greeterAgent(tableId, timeOfDay) {
  const prompt = `You are Zara, a warm and witty dining assistant at Spice Garden restaurant.
This is the first message to a new customer at table ${tableId}.
Time of day: ${timeOfDay}.
Greet them warmly in 1-2 sentences, then ask ONE question about their mood or preference today.
Keep it friendly, brief, and energetic. Do not mention you are an AI.
Respond as plain text only.`

  try {
    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    return text.trim()
  } catch (e) {
    console.error('greeterAgent error:', e.message)
    return "Welcome to Spice Garden! 🍛 What are you in the mood for today?"
  }
}