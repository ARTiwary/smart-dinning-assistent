import { llm } from '../lib/ollama.js';
import { prisma } from '../db/prisma.js';

export async function upsellAgent(cartItems, cartTotal, timeOfDay) {
  if (cartItems.length === 0) return null;

  const hasBeverage = cartItems.some(i =>
    i.menuItem?.category?.includes('Beverages')
  );

  const hasMain = cartItems.some(i =>
    i.menuItem?.category?.includes('Mains')
  );

  const hasVegOnly = cartItems.every(i =>
    i.menuItem?.tags?.includes('veg')
  );

  let trigger = null;

  if (!hasBeverage && hasMain) {
    trigger = 'no_beverage';
  } else if (cartTotal < 500 && cartTotal > 200) {
    trigger = 'combo_threshold';
  } else if (hasVegOnly) {
    trigger = 'veg_only';
  } else if (timeOfDay === 'Evening') {
    trigger = 'evening_special';
  }

  if (!trigger) return null;

  // Get menu suggestion
  const suggestion = await getSuggestionForTrigger(trigger, cartItems);

  if (!suggestion) return null;

  // AI Prompt
  const prompt = `
You are a restaurant upsell assistant.

Generate ONE short upsell message.

Rules:
- Keep it under 20 words
- Friendly tone
- Mention the item name
- No emojis

Item: ${suggestion.name}
Trigger: ${trigger}
`;

  try {
    const response = await llm.invoke(prompt);

    // FIX: normalize response
    const raw =
      typeof response === 'string'
        ? response
        : response.content;

    // FIX: safely clean text
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\n/g, ' ')
      .trim();

    return {
      trigger,
      message: cleaned,
      suggestion: {
        itemId: suggestion.id,
        name: suggestion.name,
        price: Number(suggestion.price)
      }
    };

  } catch (error) {
    console.error('Upsell agent error:', error);

    // Fallback message
    const fallbackMessages = {
      no_beverage:
        `Add ${suggestion.name} to complete your meal.`,

      combo_threshold:
        `You're ₹${500 - cartTotal} away from our Meal Deal — add ${suggestion.name}!`,

      veg_only:
        `${suggestion.name} is today's chef recommendation.`,

      evening_special:
        `${suggestion.name} is a customer favorite this evening.`
    };

    return {
      trigger,
      message: fallbackMessages[trigger],
      suggestion: {
        itemId: suggestion.id,
        name: suggestion.name,
        price: Number(suggestion.price)
      }
    };
  }
}

async function getSuggestionForTrigger(trigger, cartItems) {
  const cartIds = cartItems.map(i => i.menuItemId);

  const filters = {
    no_beverage: {
      category: {
        contains: 'Beverages'
      }
    },

    combo_threshold: {
      popularScore: {
        gte: 0.8
      }
    },

    veg_only: {
      tags: {
        has: 'chef_special'
      }
    },

    evening_special: {
      tags: {
        has: 'bestseller'
      }
    }
  };

  return prisma.menuItem.findFirst({
    where: {
      available: true,
      id: {
        notIn: cartIds
      },
      ...filters[trigger]
    },

    orderBy: {
      popularScore: 'desc'
    }
  });
}