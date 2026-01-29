/**
 * Embedder - Generates vector embeddings using OpenAI
 *
 * Uses text-embedding-3-small by default (cheaper, good quality)
 * Can be upgraded to text-embedding-3-large for better performance
 */

import OpenAI from 'openai';
import { openaiConfig, ragConfig } from '../config.js';
import type { ContentChunk, EmbeddedChunk } from '../types.js';

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
});

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: ragConfig.embeddingModel,
    input: text,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error('Failed to generate embedding');
  }

  return embedding;
}

/**
 * Generate embeddings for multiple chunks with batching
 * OpenAI allows up to 2048 inputs per request
 * Works with both LegalChunk and AidChunk
 */
export async function embedChunks(
  chunks: ContentChunk[],
  batchSize: number = 100
): Promise<EmbeddedChunk[]> {
  const embeddedChunks: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map(chunk => chunk.text);

    console.log(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

    const response = await openai.embeddings.create({
      model: ragConfig.embeddingModel,
      input: texts,
    });

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = response.data[j]?.embedding;

      if (chunk && embedding) {
        embeddedChunks.push({
          ...chunk,
          embedding,
        });
      }
    }

    // Rate limiting: small delay between batches
    if (i + batchSize < chunks.length) {
      await delay(100);
    }
  }

  return embeddedChunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
