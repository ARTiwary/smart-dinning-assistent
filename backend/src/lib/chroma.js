import { prisma } from '../db/prisma.js'

let menuCache = null

export async function getVectorStore() {
  return null
}

export async function initMenuEmbeddings() {
  console.log('📦 Loading menu items...')
  menuCache = await prisma.menuItem.findMany({ where: { available: true } })
  console.log(`✅ Loaded ${menuCache.length} menu items`)
  return menuCache
}

export async function searchMenuItems(query, limit = 10) {
  if (!menuCache) {
    menuCache = await prisma.menuItem.findMany({ where: { available: true } })
  }

  const q = query.toLowerCase()
  const keywords = q.split(' ').filter(w => w.length > 2)

  const scored = menuCache.map(item => {
    let score = 0
    const text = `${item.name} ${item.description} ${item.tags.join(' ')} ${item.category}`.toLowerCase()

    keywords.forEach(kw => {
      if (text.includes(kw)) score += 2
    })

    if (q.includes('spicy') && item.tags.includes('spicy')) score += 3
    if (q.includes('light') && item.tags.includes('light')) score += 3
    if (q.includes('veg') && item.tags.includes('veg')) score += 3
    if ((q.includes('sweet') || q.includes('dessert')) && item.category.includes('Desserts')) score += 4
    if (q.includes('drink') || q.includes('beverage')) {
      if (item.category.includes('Beverages')) score += 4
    }
    if (q.includes('best') || q.includes('popular')) score += item.popularScore * 3
    if (q.includes('non-veg') || q.includes('chicken') || q.includes('mutton')) {
      if (!item.tags.includes('veg')) score += 3
    }
    if (q.includes('fill') || q.includes('heavy')) {
      if (item.tags.includes('filling')) score += 3
    }

    score += item.popularScore

    return { item, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      pageContent: `${s.item.name}. ${s.item.description}. Tags: ${s.item.tags.join(', ')}`,
      metadata: {
        id: s.item.id,
        name: s.item.name,
        price: Number(s.item.price),
        category: s.item.category,
        tags: s.item.tags.join(','),
        allergens: s.item.allergens.join(','),
      }
    }))
}