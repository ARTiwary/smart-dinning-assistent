import { CohereClient } from 'cohere-ai'
import { prisma } from '../db/prisma.js'

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })

// Get embedding for a text
async function embed(text) {
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-light-v3.0',
    inputType: 'search_query',
  })
  return response.embeddings[0]
}

// Get embeddings for multiple texts
async function embedBatch(texts) {
  const response = await cohere.embed({
    texts,
    model: 'embed-english-light-v3.0',
    inputType: 'search_document',
  })
  return response.embeddings
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

export async function initMenuEmbeddings() {
  console.log('📦 Generating menu embeddings with Cohere...')
  const items = await prisma.menuItem.findMany({ where: { available: true } })

  // Check which items already have embeddings
  const needsEmbedding = items.filter(item => !item.embedding)

  if (needsEmbedding.length === 0) {
    console.log('✅ All menu items already embedded')
    return
  }

  // Build text for each item
  const texts = needsEmbedding.map(item =>
    `${item.name}. ${item.description}. Category: ${item.category}. Tags: ${item.tags.join(', ')}. Price: ₹${item.price}.`
  )

  // Get embeddings in batch
  const embeddings = await embedBatch(texts)

  // Save embeddings to PostgreSQL via raw SQL (pgvector)
  for (let i = 0; i < needsEmbedding.length; i++) {
    const item = needsEmbedding[i]
    const embedding = embeddings[i]
    const vectorStr = `[${embedding.join(',')}]`

    await prisma.$executeRaw`
      UPDATE "MenuItem" 
      SET embedding = ${vectorStr}::vector 
      WHERE id = ${item.id}
    `
  }

  console.log(`✅ Embedded ${needsEmbedding.length} menu items into pgvector`)
}

export async function searchMenuItems(query, limit = 10) {
  // Embed the query
  const queryEmbedding = await embed(query)
  const vectorStr = `[${queryEmbedding.join(',')}]`

  // pgvector cosine similarity search
  const results = await prisma.$queryRaw`
    SELECT 
      id, name, category, price, description, 
      tags, allergens, "popularScore",
      1 - (embedding <=> ${vectorStr}::vector) as similarity
    FROM "MenuItem"
    WHERE available = true
    AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `

  return results.map(item => ({
    pageContent: `${item.name}. ${item.description}. Tags: ${item.tags.join(', ')}`,
    metadata: {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category,
      tags: item.tags.join(','),
      allergens: item.allergens.join(','),
      similarity: item.similarity,
    }
  }))
}

export async function getVectorStore() {
  return { similaritySearch: searchMenuItems }
}