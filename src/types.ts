/**
 * Types for the LlarJove RAG system
 * Supports both legal documents and aid program documents
 */

// ============================================
// Legal Documents (LAU, etc.)
// ============================================

export interface LegalChunk {
  id: string;
  text: string;
  metadata: LegalMetadata;
}

export interface LegalMetadata {
  law: string;
  lawFullName: string;
  title?: string;
  chapter?: string;
  article: string;
  articleTitle: string;
  sourceFile: string;
}

// ============================================
// Aid Program Documents (Bono Joven, etc.)
// ============================================

export interface AidChunk {
  id: string;
  text: string;
  metadata: AidMetadata;
}

export interface AidMetadata {
  programName: string;      // "Bono Alquiler Joven 2025"
  section: string;          // "Requisits", "Terminis", "Documentació"
  deadline?: string;        // ISO date if applicable
  amount?: string;          // "250€/mes" if mentioned
  sourceFile: string;
  sourceUrl?: string;       // Official link
}

// ============================================
// Unified Chunk types for retrieval
// ============================================

export type ContentChunk = LegalChunk | AidChunk;
export type ContentMetadata = LegalMetadata | AidMetadata;

export function isAidChunk(chunk: ContentChunk): chunk is AidChunk {
  return 'programName' in chunk.metadata;
}

export function isLegalChunk(chunk: ContentChunk): chunk is LegalChunk {
  return 'law' in chunk.metadata;
}

// Base interface for embedding - works with any chunk type
export interface EmbeddedChunk {
  id: string;
  text: string;
  metadata: ContentMetadata;
  embedding: number[];
}

export interface RetrievalResult {
  chunk: ContentChunk;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  question: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface SourceCitation {
  article: string;
  law: string;
  excerpt: string;
}

export interface RAGConfig {
  embeddingModel: string;
  chatModel: string;
  maxChunks: number;
  similarityThreshold: number;
}
