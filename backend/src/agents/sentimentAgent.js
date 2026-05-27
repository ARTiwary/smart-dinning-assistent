import { fastLlm } from '../lib/ollama.js';

export async function sentimentAgent(message) {
  const prompt = `Analyze this restaurant customer message for sentiment.
Message: "${message}"
Reply ONLY with JSON: {"sentiment": "positive|neutral|negative|frustrated", "needsHelp": true/false}`;

  try {
    const response = await fastLlm.invoke(prompt);
    const clean = response.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { sentiment: 'neutral', needsHelp: false };
  }
}