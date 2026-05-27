import { Ollama } from '@langchain/community/llms/ollama';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';

export const llm = new Ollama({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  temperature: 0.7,
});

export const fastLlm = new Ollama({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  temperature: 0.2,
});

export const embeddings = new OllamaEmbeddings({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
});