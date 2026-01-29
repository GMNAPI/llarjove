/**
 * Retrieval module - exports all retrieval utilities
 */

export {
  initVectorStore,
  addChunks,
  queryChunks,
  deleteByLaw,
  getStats,
  clearCollection,
  isLocalMode,
} from './vectorStore.js';

export {
  rerank,
  filterByThreshold,
  deduplicateResults,
} from './reranker.js';
