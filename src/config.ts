import { config } from 'dotenv';
import type { RAGConfig } from './types.js';

config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const serverConfig = {
  port: getEnvNumber('PORT', 3000),
  host: getEnvVar('HOST', '0.0.0.0'),
};

export const openaiConfig = {
  apiKey: getEnvVar('OPENAI_API_KEY'),
};

export const ragConfig: RAGConfig = {
  embeddingModel: getEnvVar('EMBEDDING_MODEL', 'text-embedding-3-small'),
  chatModel: getEnvVar('CHAT_MODEL', 'gpt-4-turbo-preview'),
  maxChunks: getEnvNumber('MAX_CHUNKS', 5),
  similarityThreshold: parseFloat(getEnvVar('SIMILARITY_THRESHOLD', '0.65')),
};

export const chromaConfig = {
  host: getEnvVar('CHROMA_HOST', 'localhost'),
  port: getEnvNumber('CHROMA_PORT', 8000),
  collection: getEnvVar('CHROMA_COLLECTION', 'legal_docs'),
};
