/**
 * Vector Store - Chroma integration for storing and retrieving embeddings
 *
 * Supports two modes:
 * 1. Server mode: Connects to Chroma server (production)
 * 2. Local mode: JSON file storage (development/demo without Docker)
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { chromaConfig } from '../config.js';
import type { EmbeddedChunk, RetrievalResult, LegalMetadata, AidMetadata, ContentMetadata } from '../types.js';
import {
  initLocalVectorStore,
  addChunksLocal,
  queryChunksLocal,
  getStatsLocal,
  clearStoreLocal,
  deleteByLawLocal,
} from './localVectorStore.js';

let client: ChromaClient | null = null;
let collection: Collection | null = null;
let useLocalStore = false;

/**
 * Initialize the Chroma client and collection
 * Falls back to local JSON store if server is unavailable
 */
export async function initVectorStore(): Promise<void> {
  // Try Chroma server first
  try {
    client = new ChromaClient({
      path: `http://${chromaConfig.host}:${chromaConfig.port}`,
    });

    // Test connection
    await client.heartbeat();

    collection = await client.getOrCreateCollection({
      name: chromaConfig.collection,
      metadata: {
        description: 'Spanish real estate legal documents',
        'hnsw:space': 'cosine',
      },
    });

    useLocalStore = false;
    console.log(`Vector store initialized (Chroma): "${chromaConfig.collection}"`);
  } catch {
    // Fall back to local JSON store
    console.log('Chroma server not available, using local JSON store');
    useLocalStore = true;
    await initLocalVectorStore();
  }
}

/**
 * Check if using local store (no Chroma)
 */
export function isLocalMode(): boolean {
  return useLocalStore;
}

/**
 * Get the current collection (initialize if needed)
 */
async function getCollection(): Promise<Collection> {
  if (!collection) {
    await initVectorStore();
  }
  if (!collection) {
    throw new Error('Failed to initialize vector store');
  }
  return collection;
}

/**
 * Add embedded chunks to the vector store
 */
export async function addChunks(chunks: EmbeddedChunk[]): Promise<void> {
  if (useLocalStore) {
    return addChunksLocal(chunks);
  }

  const coll = await getCollection();

  const ids = chunks.map(c => c.id);
  const embeddings = chunks.map(c => c.embedding);
  const documents = chunks.map(c => c.text);
  const metadatas = chunks.map(c => {
    const meta = c.metadata;
    // Handle both legal and aid metadata
    // Chroma requires all values to be string | number | boolean
    if ('law' in meta) {
      const legalMeta = meta as LegalMetadata;
      return {
        type: 'legal',
        law: legalMeta.law,
        lawFullName: legalMeta.lawFullName,
        title: legalMeta.title ?? '',
        chapter: legalMeta.chapter ?? '',
        article: legalMeta.article,
        articleTitle: legalMeta.articleTitle,
        sourceFile: legalMeta.sourceFile,
      };
    } else {
      const aidMeta = meta as AidMetadata;
      return {
        type: 'aid',
        programName: aidMeta.programName,
        section: aidMeta.section,
        deadline: aidMeta.deadline ?? '',
        amount: aidMeta.amount ?? '',
        sourceFile: aidMeta.sourceFile,
        sourceUrl: aidMeta.sourceUrl ?? '',
      };
    }
  }) as unknown as Record<string, string | number | boolean>[];

  // Upsert to handle duplicates
  await coll.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`Added ${chunks.length} chunks to vector store`);
}

/**
 * Query the vector store for similar chunks
 */
export async function queryChunks(
  queryEmbedding: number[],
  topK: number = 5,
  filter?: Record<string, string>
): Promise<RetrievalResult[]> {
  if (useLocalStore) {
    return queryChunksLocal(queryEmbedding, topK, filter);
  }

  const coll = await getCollection();

  const results = await coll.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: filter,
    include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
  });

  const retrievalResults: RetrievalResult[] = [];

  const documents = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];
  const ids = results.ids?.[0] ?? [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const meta = metadatas[i];
    const distance = distances[i];
    const id = ids[i];

    if (doc && meta && distance !== undefined && id) {
      // Convert distance to similarity (Chroma uses L2 distance by default)
      // For cosine space: similarity = 1 - distance
      const score = 1 - distance;

      // Reconstruct metadata based on type
      let metadata: ContentMetadata;
      if (meta['type'] === 'aid' || meta['programName']) {
        metadata = {
          programName: String(meta['programName'] ?? ''),
          section: String(meta['section'] ?? ''),
          deadline: meta['deadline'] ? String(meta['deadline']) : undefined,
          amount: meta['amount'] ? String(meta['amount']) : undefined,
          sourceFile: String(meta['sourceFile'] ?? ''),
          sourceUrl: meta['sourceUrl'] ? String(meta['sourceUrl']) : undefined,
        } as AidMetadata;
      } else {
        metadata = {
          law: String(meta['law'] ?? ''),
          lawFullName: String(meta['lawFullName'] ?? ''),
          title: meta['title'] ? String(meta['title']) : undefined,
          chapter: meta['chapter'] ? String(meta['chapter']) : undefined,
          article: String(meta['article'] ?? ''),
          articleTitle: String(meta['articleTitle'] ?? ''),
          sourceFile: String(meta['sourceFile'] ?? ''),
        } as LegalMetadata;
      }

      retrievalResults.push({
        chunk: { id, text: doc, metadata } as RetrievalResult['chunk'],
        score,
      });
    }
  }

  return retrievalResults;
}

/**
 * Delete all chunks from a specific law
 */
export async function deleteByLaw(lawCode: string): Promise<void> {
  if (useLocalStore) {
    return deleteByLawLocal(lawCode);
  }

  const coll = await getCollection();

  await coll.delete({
    where: { law: lawCode },
  });

  console.log(`Deleted all chunks for law: ${lawCode}`);
}

/**
 * Get collection statistics
 */
export async function getStats(): Promise<{ count: number }> {
  if (useLocalStore) {
    return getStatsLocal();
  }

  const coll = await getCollection();
  const count = await coll.count();
  return { count };
}

/**
 * Clear all data from the collection
 */
export async function clearCollection(): Promise<void> {
  if (useLocalStore) {
    return clearStoreLocal();
  }

  if (!client) {
    await initVectorStore();
  }
  if (client) {
    await client.deleteCollection({ name: chromaConfig.collection });
    collection = null;
    console.log('Collection cleared');
  }
}
