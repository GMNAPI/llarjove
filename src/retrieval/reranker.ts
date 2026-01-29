/**
 * Reranker - Optional second-pass ranking for better precision
 *
 * This is a simple keyword-based reranker. For production, consider:
 * - Cohere Rerank API
 * - Cross-encoder models
 * - BM25 hybrid search
 */

import type { RetrievalResult, LegalMetadata, AidMetadata } from '../types.js';

/**
 * Rerank results based on keyword matching
 * Boosts chunks that contain exact query terms
 */
export function rerank(
  results: RetrievalResult[],
  query: string
): RetrievalResult[] {
  const queryTerms = extractKeyTerms(query);

  const scored = results.map(result => {
    let boost = 0;
    const meta = result.chunk.metadata;

    // Boost for exact keyword matches in text
    for (const term of queryTerms) {
      const lowerText = result.chunk.text.toLowerCase();
      if (lowerText.includes(term)) {
        boost += 0.1;
      }

      // Extra boost for title/section matches
      if ('articleTitle' in meta) {
        const legalMeta = meta as LegalMetadata;
        if (legalMeta.articleTitle.toLowerCase().includes(term)) {
          boost += 0.15;
        }
      } else if ('section' in meta) {
        const aidMeta = meta as AidMetadata;
        if (aidMeta.section.toLowerCase().includes(term) ||
            aidMeta.programName.toLowerCase().includes(term)) {
          boost += 0.15;
        }
      }
    }

    return {
      ...result,
      score: Math.min(1, result.score + boost), // Cap at 1
    };
  });

  // Sort by new score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Extract key terms from a query (simple tokenization)
 */
function extractKeyTerms(query: string): string[] {
  // Remove common Spanish stopwords
  const stopwords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para',
    'que', 'qué', 'cual', 'cuál', 'como', 'cómo',
    'es', 'son', 'está', 'están', 'hay',
    'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
    'y', 'o', 'pero', 'si', 'no',
    'puedo', 'puede', 'debo', 'debe', 'necesito',
    'cuánto', 'cuántos', 'cuánta', 'cuántas',
  ]);

  return query
    .toLowerCase()
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopwords.has(term));
}

/**
 * Filter results below a similarity threshold
 */
export function filterByThreshold(
  results: RetrievalResult[],
  threshold: number
): RetrievalResult[] {
  return results.filter(r => r.score >= threshold);
}

/**
 * Deduplicate results that are too similar to each other
 * Useful when overlap context creates near-duplicate chunks
 */
export function deduplicateResults(
  results: RetrievalResult[],
  maxOverlap: number = 0.8
): RetrievalResult[] {
  const unique: RetrievalResult[] = [];

  for (const result of results) {
    const isDuplicate = unique.some(existing =>
      textSimilarity(existing.chunk.text, result.chunk.text) > maxOverlap
    );

    if (!isDuplicate) {
      unique.push(result);
    }
  }

  return unique;
}

/**
 * Simple text similarity based on word overlap (Jaccard)
 */
function textSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
