import { fastLlm } from '../lib/ollama.js'

export async function sentimentAgent(message) {
  const prompt = `Analyze this restaurant customer message for sentiment.
Message: "${message}"
Reply ONLY with JSON: {"sentiment": "positive|neutral|negative|frustrated", "needsHelp": true}`

  try {
    const response = await fastLlm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { sentiment: 'neutral', needsHelp: false }
  }
}