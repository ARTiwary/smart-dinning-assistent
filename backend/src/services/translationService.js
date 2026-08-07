import { prisma } from '../db/prisma.js'
import { llm } from '../lib/ollama.js'

// Detect language from text
export async function detectLanguage(text) {
  const hindiChars = /[\u0900-\u097F]/
  const teluguChars = /[\u0C00-\u0C7F]/

  if (hindiChars.test(text)) return 'hi'
  if (teluguChars.test(text)) return 'te'

  // Hinglish detection
  const hinglishWords = ['kuch', 'chahiye', 'khana', 'kha', 'dena', 'hai', 'mujhe', 'hum', 'acha', 'thoda']
  const lower = text.toLowerCase()
  const isHinglish = hinglishWords.some(w => lower.includes(w))
  if (isHinglish) return 'hi'

  return 'en'
}

// Translate menu item using LLM
export async function translateMenuItem(item, targetLang) {
  if (targetLang === 'en') return item

  // Check cache first
  const existing = await prisma.menuTranslation.findUnique({
    where: { menuItemId_language: { menuItemId: item.id, language: targetLang } }
  })
  if (existing) return { ...item, name: existing.name, description: existing.description }

  const langName = targetLang === 'hi' ? 'Hindi' : 'Telugu'

  try {
    const prompt = `Translate this Indian restaurant menu item to ${langName}.
Item: ${item.name}
Description: ${item.description}

Rules:
- Keep food names mostly in their original form if they are Indian dish names
- Translate the description naturally
- Keep it concise
- Return ONLY JSON: {"name": "translated name", "description": "translated description"}`

    const response = await llm.invoke(prompt)
    const text = typeof response === 'string' ? response : response.content
    const clean = text.replace(/```json|```/g, '').trim()
    const translated = JSON.parse(clean)

    // Cache translation
    await prisma.menuTranslation.upsert({
      where: { menuItemId_language: { menuItemId: item.id, language: targetLang } },
      update: { name: translated.name, description: translated.description },
      create: {
        menuItemId: item.id,
        language: targetLang,
        name: translated.name,
        description: translated.description || item.description
      }
    })

    return { ...item, name: translated.name, description: translated.description }
  } catch (e) {
    console.error('Translation error:', e.message)
    return item
  }
}

// Translate full menu
export async function translateMenu(items, targetLang) {
  if (targetLang === 'en') return items
  return Promise.all(items.map(item => translateMenuItem(item, targetLang)))
}