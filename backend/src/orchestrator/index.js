import { multilingualAgent } from '../agents/multilingualAgent.js';
import { greeterAgent } from '../agents/greeterAgent.js';
import { recommendationAgent } from '../agents/recommendationAgent.js';
import { upsellAgent } from '../agents/upsellAgent.js';
import { contextMemoryAgent, getContext, updateContext } from '../agents/contextMemoryAgent.js';
import { groupCoordinatorAgent } from '../agents/groupCoordinatorAgent.js';
import { sentimentAgent } from '../agents/sentimentAgent.js';
import { orderValidationAgent } from '../agents/orderValidationAgent.js';
import { getCart, getCartTotal } from '../services/cartService.js';
import { prisma } from '../db/prisma.js';

function getTimeOfDay() {
  // Use IST (UTC+5:30)
  const now = new Date()
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  const hour = ist.getUTCHours()
  if (hour >= 7 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 16) return 'Afternoon'
  if (hour >= 16 && hour < 19) return 'Evening'
  return 'Dinner'
}

export async function orchestrate(sessionId, userMessage, isFirstMessage = false) {
  const timeOfDay = getTimeOfDay();

  // Step 1: Greeter (first message only)
  if (isFirstMessage) {
    const greeting = await greeterAgent(sessionId, timeOfDay);
    await updateContext(sessionId, {}, greeting, 'assistant');
    return { type: 'greeting', message: greeting, suggestions: [] };
  }

  // Step 2: Multilingual NLU — normalize input
  const nlu = await multilingualAgent(userMessage);

  // Step 3: Get context + cart
  const context = await getContext(sessionId);
  const cartItems = await getCart(sessionId);
  const cartTotal = await getCartTotal(sessionId);

  // Step 4: Sentiment check (background)
  const sentiment = await sentimentAgent(userMessage);

  // Step 5: Save user message to context
  await updateContext(sessionId, nlu.preferences || {}, userMessage, 'user');

  let response = null;

  // Step 6: Route to correct agent based on intent
  switch (nlu.intent) {
    case 'GREET':
      response = {
        type: 'greeting',
        message: await greeterAgent(sessionId, timeOfDay),
        suggestions: []
      };
      break;

    case 'CHECKOUT':
      const validation = await orderValidationAgent(sessionId);
      response = {
        type: 'checkout',
        message: validation.valid
          ? `Your order looks great! ${validation.itemCount} items totalling ₹${(validation.total * 1.05).toFixed(0)} (incl. GST). Ready to place it?`
          : `There are some issues: ${validation.errors.join(', ')}`,
        valid: validation.valid,
        suggestions: []
      };
      break;

    case 'GROUP_MERGE':
      const groupResp = await groupCoordinatorAgent(cartItems, nlu.groupSize, null);
      response = {
        type: 'group',
        message: groupResp?.message || "Let me find great options for your group!",
        suggestions: []
      };
      break;

    case 'RECOMMEND':
    case 'ADD_ITEM':
    case 'FALLBACK':
    default:
      const recResult = await recommendationAgent(
        userMessage,
        { ...context.preferences, ...nlu.preferences },
        cartItems,
        context.preferences,
        timeOfDay
      );
      response = {
        type: 'recommendation',
        message: sentiment.needsHelp
          ? `I hear you! Let me help. ${recResult.message}`
          : recResult.message,
        suggestions: recResult.suggestions || []
      };
      break;
  }

  // Step 7: Async upsell check
  const upsell = await upsellAgent(cartItems, cartTotal, timeOfDay);

  // Step 8: Save assistant response to context
  await updateContext(sessionId, {}, response.message, 'assistant');

  return { ...response, upsell };
}