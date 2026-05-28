import { ChatGroq } from '@langchain/groq'
import { OllamaEmbeddings } from '@langchain/ollama'

export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
  temperature: 0.7,
})

export const fastLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
  temperature: 0.2,
})

export const embeddings = new OllamaEmbeddings({
  model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
})