import { llm } from '../lib/ollama.js';
import { getVectorStore } from '../lib/chroma.js';

export async function recommendationAgent(userMessage, preferences, cartItems, sessionPrefs, timeOfDay) {
  const vectorStore = await getVectorStore();

  // Build search query from message + preferences
  const searchQuery = buildSearchQuery(userMessage, preferences);
  
  // Increase topK slightly to ensure we have a good pool to filter from
  const results = await vectorStore.similaritySearch(searchQuery, 15);

  // Filter out items already in cart
  const cartItemNames = cartItems.map(c => c.menuItem?.name?.toLowerCase());
  let filtered = results.filter(r => !cartItemNames.includes(r.metadata.name?.toLowerCase()));

  // ---- CATEGORICAL FILTERING FIXED ----
  const lowerMsg = userMessage.toLowerCase();
  const isDessertRequest = lowerMsg.includes('dessert') || lowerMsg.includes('meetha') || lowerMsg.includes('sweet') || lowerMsg.includes('cake');
  const isLightRequest = lowerMsg.includes('light') || lowerMsg.includes('halka');

  if (isDessertRequest) {
    filtered = filtered.filter(r => 
      r.metadata.tags?.toLowerCase().includes('dessert') || 
      r.pageContent?.toLowerCase().includes('dessert') ||
      r.metadata.tags?.toLowerCase().includes('sweet')
    );
  } else if (isLightRequest) {
    filtered = filtered.filter(r => 
      r.metadata.tags?.toLowerCase().includes('light') || 
      r.metadata.tags?.toLowerCase().includes('starter')
    );
  }
  // ------------------------------------

  // Apply allergen filter
  const allergensToAvoid = sessionPrefs?.allergensToAvoid || preferences?.allergens_to_avoid || [];
  const safe = allergensToAvoid.length > 0
    ? filtered.filter(r => !allergensToAvoid.some(a => r.metadata.allergens?.includes(a)))
    : filtered;

  // Deduplicate by name
  const seen = new Set();
  const deduped = safe.filter(r => {
    if (seen.has(r.metadata.name)) return false;
    seen.add(r.metadata.name);
    return true;
  });

  // Fallback: If strict filtering emptied the list completely, revert to safe unfiltered items
  const finalSelection = deduped.length > 0 ? deduped : safe.slice(0, 10);

  // Map out explicit internal structural IDs for the LLM context pool
  const menuContext = finalSelection.slice(0, 10).map(r =>
    `- ID: ${r.metadata.id} | ${r.metadata.name} (₹${r.metadata.price}) [${r.metadata.tags}]: ${r.pageContent}`
  ).join('\n');

  const prompt = `You are Zara, a witty dining assistant at Spice Garden restaurant.
Time: ${timeOfDay}
User said: "${userMessage}"
User preferences: ${JSON.stringify(preferences)}
Current cart: ${cartItems.length > 0 ? cartItems.map(c => c.menuItem?.name).join(', ') : 'empty'}

Available menu items matching their request:
${menuContext}

Rules:
- Suggest at most 3 items from the list above ONLY.
- The "name", "price", and "itemId" MUST belong to the exact same menu item block. Never mix descriptions or IDs.
- Never suggest items already in cart.
- Match the exact internal structural ID provided in the list above for "itemId".
- Be warm, brief, max 2 sentences before the list.
- Respond in the same language the user used.
- If user used Hinglish, reply in Hinglish.

Respond ONLY with this JSON, no markdown:
{
  "message": "your warm intro here",
  "suggestions": [
    {"itemId": "exact ID from context", "name": "name", "price": 0, "reason": "one line reason"}
  ]
}`;

  const response = await llm.invoke(prompt);

  try {
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    
    // Ensure both item identification keys are universally populated
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      parsed.suggestions = parsed.suggestions.map(s => ({
        ...s,
        id: s.itemId || s.id,
        itemId: s.itemId || s.id
      }));
    }
    return parsed;
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