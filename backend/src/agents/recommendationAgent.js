import { llm } from '../lib/ollama.js';
import { getVectorStore } from '../lib/chroma.js';

export async function recommendationAgent(userMessage, preferences, cartItems, sessionPrefs, timeOfDay) {
  const vectorStore = await getVectorStore();

  // Build search query from message + preferences
  const searchQuery = buildSearchQuery(userMessage, preferences);
  const results = await vectorStore.similaritySearch(searchQuery, 10);

  // Filter out items already in cart
  const cartItemNames = cartItems.map(c => c.menuItem?.name?.toLowerCase());
  const filtered = results.filter(r => !cartItemNames.includes(r.metadata.name?.toLowerCase()));

  // Apply allergen filter from session preferences
  const allergensToAvoid = sessionPrefs?.allergensToAvoid || preferences?.allergens_to_avoid || [];
  const safe = allergensToAvoid.length > 0
    ? filtered.filter(r => !allergensToAvoid.some(a => r.metadata.allergens?.includes(a)))
    : filtered;

  const menuContext = safe.slice(0, 10).map(r =>
    `- ${r.metadata.name} (₹${r.metadata.price}) [${r.metadata.tags}]: ${r.pageContent}`
  ).join('\n');

  const prompt = `You are Zara, a witty dining assistant at Spice Garden restaurant.
Time: ${timeOfDay}
User said: "${userMessage}"
User preferences: ${JSON.stringify(preferences)}
Current cart: ${cartItems.length > 0 ? cartItems.map(c => c.menuItem?.name).join(', ') : 'empty'}

Available menu items matching their request:
${menuContext}

Rules:
- Suggest at most 3 items from the list above ONLY
- Never suggest items already in cart
- Be warm, brief, max 2 sentences before the list
- Respond in the same language the user used
- If user used Hinglish, reply in Hinglish

Respond ONLY with this JSON, no markdown:
{
  "message": "your warm intro here",
  "suggestions": [
    {"itemId": "id", "name": "name", "price": 0, "reason": "one line reason"}
  ]
}`;

  const response = await llm.invoke(prompt);

  try {
    const clean = response.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      message: "Here are some great options for you!",
      suggestions: safe.slice(0, 3).map(r => ({
        itemId: r.metadata.id,
        name: r.metadata.name,
        price: r.metadata.price,
        reason: 'Popular choice'
      }))
    };
  }
}

function buildSearchQuery(message, preferences) {
  let query = message;
  if (preferences?.spicy) query += ' spicy';
  if (preferences?.light) query += ' light';
  if (preferences?.veg === true) query += ' vegetarian';
  if (preferences?.veg === false) query += ' non-veg chicken mutton';
  if (preferences?.sweet) query += ' sweet dessert';
  if (preferences?.filling) query += ' filling heavy main course';
  return query;
}