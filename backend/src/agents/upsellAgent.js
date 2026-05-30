import { llm } from '../lib/ollama.js'
import { prisma } from '../db/prisma.js'

export async function upsellAgent(cartItems, cartTotal, timeOfDay) {
  if (cartItems.length === 0) return null

  const hasBeverage = cartItems.some(i => i.menuItem?.category?.includes('Beverages'))
  const hasMain = cartItems.some(i => i.menuItem?.category?.includes('Mains'))
  const hasVegOnly = cartItems.every(i => i.menuItem?.tags?.includes('veg'))

  let trigger = null

  if (!hasBeverage && hasMain) {
    trigger = 'no_beverage'
  } else if (cartTotal < 500 && cartTotal > 200) {
    trigger = 'combo_threshold'
  } else if (hasVegOnly) {
    trigger = 'veg_only'
  } else if (timeOfDay === 'Evening') {
    trigger = 'evening_special'
  }

  if (!trigger) return null

  const suggestion = await getSuggestionForTrigger(trigger, cartItems)
  if (!suggestion) return null

  const triggerCopy = {
    no_beverage: `Looks like you're missing drinks! ${suggestion.name} pairs perfectly with your order.`,
    combo_threshold: `You're ₹${500 - cartTotal} away from our Meal Deal — add ${suggestion.name} to unlock it!`,
    veg_only: `Feeling adventurous? Our ${suggestion.name} is today's chef special.`,
    evening_special: `Evening special: ${suggestion.name} is our top pick right now!`
  }

  return {
    trigger,
    message: triggerCopy[trigger],
    suggestion: {
      itemId: suggestion.id,
      name: suggestion.name,
      price: Number(suggestion.price)
    }
  }
}

async function getSuggestionForTrigger(trigger, cartItems) {
  const cartIds = cartItems.map(i => i.menuItemId)

  const filters = {
    no_beverage: { category: { contains: 'Beverages' } },
    combo_threshold: { popularScore: { gte: 0.8 } },
    veg_only: { tags: { has: 'chef_special' } },
    evening_special: { tags: { has: 'bestseller' } }
  }

  try {
    return await prisma.menuItem.findFirst({
      where: {
        available: true,
        id: { notIn: cartIds },
        ...filters[trigger]
      },
      orderBy: { popularScore: 'desc' }
    })
  } catch (e) {
    console.error('upsellAgent getSuggestion error:', e.message)
    return null
  }
}