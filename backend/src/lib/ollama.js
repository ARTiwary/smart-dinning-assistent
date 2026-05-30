import { ChatGroq } from '@langchain/groq'
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf'

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

export const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HF_API_KEY,
  model: 'sentence-transformers/all-MiniLM-L6-v2',
})