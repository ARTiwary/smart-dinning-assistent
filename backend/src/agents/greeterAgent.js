import { llm } from '../lib/ollama.js'

export async function greeterAgent(tableId, timeOfDay, profileMemory) {
  const isReturning = profileMemory && profileMemory.orderCount > 0

  const prompt = isReturning
    ? `You are Zara, a warm dining assistant at Spice Garden.
This customer has visited ${profileMemory.orderCount} time(s) before and spent ₹${profileMemory.totalSpent?.toFixed(0) || 0} total.
Their known preferences: ${JSON.stringify(profileMemory.preferences || {})}
Time: ${timeOfDay}. Table: ${tableId}.
Welcome them back personally by name (${profileMemory.name || 'friend'}), mention you remember their taste, and ask what they're in the mood for today.
Keep it warm, 2 sentences max. Don't mention you're an AI.
Respond as plain text only.`
    : `You are Zara, a warm dining assistant at Spice Garden.
New customer at table ${tableId}. Time: ${timeOfDay}.
Greet warmly in 1-2 sentences, ask about their mood today.
Respond as plain text only.`

  try {
    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    return text.trim()
  } catch (e) {
    console.error('greeterAgent error:', e.message)
    return isReturning
      ? `Welcome back, ${profileMemory?.name || 'there'}! 🎉 Great to see you again. What are you in the mood for today?`
      : "Welcome to Spice Garden! 🍛 I'm Zara. What are you in the mood for today?"
  }
}