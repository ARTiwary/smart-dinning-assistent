import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { embeddings } from './ollama.js'
import { prisma } from '../db/prisma.js'

let vectorStore = null

export async function getVectorStore() {
  if (vectorStore) return vectorStore
  await initMenuEmbeddings()
  return vectorStore
}

export async function initMenuEmbeddings() {
  console.log('📦 Loading menu items for embedding...')
  const items = await prisma.menuItem.findMany({ where: { available: true } })

  const docs = items.map(item => ({
    pageContent: `${item.name}. ${item.description}. Tags: ${item.tags.join(', ')}. Category: ${item.category}. Price: ₹${item.price}. Allergens: ${item.allergens.join(', ') || 'none'}.`,
    metadata: {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category,
      tags: item.tags.join(','),
      allergens: item.allergens.join(','),
    }
  }))

  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)
  console.log(`✅ Embedded ${items.length} menu items into memory`)
  return vectorStore
}