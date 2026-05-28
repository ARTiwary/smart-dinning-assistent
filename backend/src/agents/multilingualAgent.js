import { fastLlm } from '../lib/ollama.js';

export async function multilingualAgent(userMessage) {
  const prompt = `You are a language normalizer for a restaurant ordering system.
Analyze the user message and extract structured intent.

User message: "${userMessage}"

Respond ONLY with a JSON object, no explanation, no markdown:
{
  "intent": "GREET|RECOMMEND|ADD_ITEM|UPSELL_CHECK|GROUP_MERGE|CHECKOUT|FALLBACK",
  "preferences": {
    "spicy": true/false/null,
    "light": true/false/null,
    "veg": true/false/null,
    "sweet": true/false/null,
    "filling": true/false/null,
    "allergens_to_avoid": []
  },
  "language": "english|hinglish|telugu-english|other",
  "itemMentioned": "item name if any or null",
  "groupSize": number or null,
  "raw": "${userMessage}"
}`;

  const response = await fastLlm.invoke(prompt);

  try {
    const raw = typeof response === 'string' ? response : response.content
const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      intent: 'FALLBACK',
      preferences: {},
      language: 'english',
      itemMentioned: null,
      groupSize: null,
      raw: userMessage
    };
  }
}