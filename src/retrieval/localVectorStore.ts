/**
 * Local Vector Store - File-based storage for development without Docker
 *
 * Uses JSON file for persistence and in-memory cosine similarity search.
 * Perfect for demos and development when Chroma server is not available.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { EmbeddedChunk, RetrievalResult, ContentMetadata } from '../types.js';

interface StoredChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata: ContentMetadata;
}

interface VectorStoreData {
  chunks: StoredChunk[];
  version: number;
}

const DEFAULT_STORE_PATH = './data/vector_store.json';

let storeData: VectorStoreData = { chunks: [], version: 1 };
let storePath = DEFAULT_STORE_PATH;
let initialized = false;

/**
 * Initialize the local vector store
 */
export async function initLocalVectorStore(path?: string): Promise<void> {
  storePath = path ?? DEFAULT_STORE_PATH;

  if (existsSync(storePath)) {
    try {
      const data = readFileSync(storePath, 'utf-8');
      storeData = JSON.parse(data);
      console.log(`Local vector store loaded: ${storeData.chunks.length} chunks`);
    } catch {
      console.log('Creating new local vector store');
      storeData = { chunks: [], version: 1 };
    }
  } else {
    console.log('Creating new local vector store');
    storeData = { chunks: [], version: 1 };
  }

  initialized = true;
}

/**
 * Save the store to disk
 */
function saveStore(): void {
  const dir = dirname(storePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(storePath, JSON.stringify(storeData, null, 2));
}

/**
 * Add embedded chunks to the store
 */
export async function addChunksLocal(chunks: EmbeddedChunk[]): Promise<void> {
  if (!initialized) await initLocalVectorStore();

  for (const chunk of chunks) {
    // Remove existing chunk with same ID (upsert behavior)
    const existingIndex = storeData.chunks.findIndex(c => c.id === chunk.id);
    if (existingIndex >= 0) {
      storeData.chunks.splice(existingIndex, 1);
    }

    storeData.chunks.push({
      id: chunk.id,
      text: chunk.text,
      embedding: chunk.embedding,
      metadata: chunk.metadata,
    });
  }

  saveStore();
  console.log(`Added ${chunks.length} chunks to local vector store`);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

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

/**
 * Query the store for similar chunks
 */
export async function queryChunksLocal(
  queryEmbedding: number[],
  topK: number = 5,
  filter?: Record<string, string>
): Promise<RetrievalResult[]> {
  if (!initialized) await initLocalVectorStore();

  console.log(`[LocalStore] Querying ${storeData.chunks.length} chunks, topK=${topK}`);

  // Filter chunks if filter provided
  let candidates = storeData.chunks;
  if (filter) {
    candidates = candidates.filter(chunk => {
      for (const [key, value] of Object.entries(filter)) {
        const metaValue = (chunk.metadata as unknown as Record<string, unknown>)[key];
        if (metaValue !== value) return false;
      }
      return true;
    });
  }

  // Calculate similarities
  const scored: RetrievalResult[] = candidates.map(chunk => ({
    chunk: {
      id: chunk.id,
      text: chunk.text,
      metadata: chunk.metadata,
    } as RetrievalResult['chunk'],
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score descending and take top K
  scored.sort((a, b) => b.score - a.score);

  const topResults = scored.slice(0, topK);
  if (topResults.length > 0) {
    console.log(`[LocalStore] Top scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')}`);
  }

  return topResults;
}

/**
 * Get store statistics
 */
export async function getStatsLocal(): Promise<{ count: number }> {
  if (!initialized) await initLocalVectorStore();
  return { count: storeData.chunks.length };
}

/**
 * Clear all data
 */
export async function clearStoreLocal(): Promise<void> {
  storeData = { chunks: [], version: 1 };
  saveStore();
  console.log('Local vector store cleared');
}

/**
 * Delete chunks by law code (only affects legal chunks)
 */
export async function deleteByLawLocal(lawCode: string): Promise<void> {
  if (!initialized) await initLocalVectorStore();

  const before = storeData.chunks.length;
  storeData.chunks = storeData.chunks.filter(c => {
    if ('law' in c.metadata) {
      return c.metadata.law !== lawCode;
    }
    return true; // Keep aid chunks
  });
  const deleted = before - storeData.chunks.length;

  saveStore();
  console.log(`Deleted ${deleted} chunks for law: ${lawCode}`);
}
