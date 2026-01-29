/**
 * Ingestion module - exports all ingestion utilities
 */

export { chunkLegalDocument, addOverlapContext } from './chunker.js';
export { chunkAidDocument, extractDeadline } from './aidChunker.js';
export { generateEmbedding, embedChunks, cosineSimilarity } from './embedder.js';
export {
  loadTextFile,
  loadPdfFile,
  loadDocumentsFromDirectory,
  detectLawInfo,
  LAW_REGISTRY,
} from './documentLoader.js';
