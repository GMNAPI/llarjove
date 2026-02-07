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

// ============================================
// Actionable Fallback System
// ============================================

/**
 * Official resource with clickable URL
 * Used for fallback when confidence=none
 */
export interface ActionableResource {
  title: string;           // "Agència de l'Habitatge de Catalunya"
  url: string;             // "https://habitatge.gencat.cat"
  description?: string;    // Brief description
  category?: 'aid' | 'legal' | 'general';
}

/**
 * Verification checklist for user guidance
 * Used for fallback when confidence=none
 */
export interface VerificationChecklist {
  title: string;           // "Passos per sol·licitar ajudes"
  steps: string[];         // ["Comprova la teva edat...", ...]
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  confidence: 'high' | 'medium' | 'low' | 'none';

  // Fallback fields for confidence=none
  actionableResources?: ActionableResource[];
  checklist?: VerificationChecklist;
  followUpQuestion?: string;
}

export interface SourceCitation {
  article: string;
  law: string;
  excerpt: string;
  url?: string;  // Clickable URL (e.g., tramits.gencat.cat)
}

export interface RAGConfig {
  embeddingModel: string;
  chatModel: string;
  maxChunks: number;
  similarityThreshold: number;
}
