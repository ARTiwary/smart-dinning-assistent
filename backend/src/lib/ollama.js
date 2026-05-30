import { ChatGroq } from '@langchain/groq'
import { OpenAIEmbeddings } from '@langchain/openai'

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

// Simple fetch-based embeddings — no extra package needed
export const embeddings = {
  embedDocuments: async (texts) => {
    const results = []
    for (const text of texts) {
      const res = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
        }
      )
      const data = await res.json()
      results.push(Array.isArray(data[0]) ? data[0] : data)
    }
    return results
  },
  embedQuery: async (text) => {
    const res = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
      }
    )
    const data = await res.json()
    return Array.isArray(data[0]) ? data[0] : data
  }
}