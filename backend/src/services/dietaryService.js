import { prisma } from '../db/prisma.js'
import { llm } from '../lib/ollama.js'

export async function getDietaryProfile(phone) {
  if (!phone) return null
  return prisma.dietaryProfile.findUnique({ where: { phone } })
}

export async function saveDietaryProfile(phone, profile) {
  return prisma.dietaryProfile.upsert({
    where: { phone },
    update: { ...profile, updatedAt: new Date() },
    create: { phone, ...profile }
  })
}

// Extract dietary info from natural language
export async function extractDietaryInfo(message) {
  const prompt = `Extract dietary information from this message.
Message: "${message}"

Respond ONLY with JSON:
{
  "hasDietaryInfo": true/false,
  "conditions": ["diabetic", "hypertensive", "celiac", "lactose-intolerant"],
  "dietType": "vegan|vegetarian|keto|halal|jain|null",
  "allergies": ["nuts", "dairy", "gluten", "shellfish", "eggs"],
  "preferences": ["spicy", "mild", "light", "filling"],
  "avoidIngredients": ["onion", "garlic"],
  "message": "what to say back acknowledging their dietary needs"
}`

  try {
    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    return { hasDietaryInfo: false }
  }
}

// Filter menu based on dietary profile
export function filterMenuByDiet(items, profile) {
  if (!profile) return items

  return items.filter(item => {
    const tags = item.tags || []
    const allergens = item.allergens || []
    const desc = (item.description || '').toLowerCase()
    const name = (item.name || '').toLowerCase()

    // Allergy check
    if (profile.allergies?.length > 0) {
      const hasAllergen = profile.allergies.some(a =>
        allergens.includes(a) || desc.includes(a) || name.includes(a)
      )
      if (hasAllergen) return false
    }

    // Diet type check
    if (profile.dietType === 'vegan' || profile.dietType === 'jain') {
      if (!tags.includes('veg')) return false
      if (allergens.includes('dairy') || allergens.includes('eggs')) return false
    }
    if (profile.dietType === 'vegetarian') {
      if (!tags.includes('veg')) return false
    }
    if (profile.dietType === 'halal') {
      if (name.includes('pork') || desc.includes('pork')) return false
    }

    // Medical conditions
    if (profile.conditions?.includes('diabetic')) {
      if (tags.includes('sweet') && !tags.includes('sugar-free')) return false
    }
    if (profile.conditions?.includes('celiac')) {
      if (allergens.includes('gluten')) return false
    }
    if (profile.conditions?.includes('lactose-intolerant')) {
      if (allergens.includes('dairy')) return false
    }

    // Avoid ingredients
    if (profile.avoidIngredients?.length > 0) {
      const hasAvoided = profile.avoidIngredients.some(ing =>
        desc.includes(ing.toLowerCase()) || name.includes(ing.toLowerCase())
      )
      if (hasAvoided) return false
    }

    return true
  })
}