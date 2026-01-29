/**
 * Response Validator
 *
 * Validates that generated responses:
 * 1. Contain proper citations (legal or aid program)
 * 2. Citations reference content in the context
 * 3. Response indicates low confidence when appropriate
 */

import type { RetrievalResult, SourceCitation, ChatResponse, LegalMetadata, AidMetadata } from '../types.js';

/**
 * Extract citations from a response text
 * Matches both legal citations [Artículo X, LAU] and program citations [Bono Joven]
 */
export function extractCitations(response: string): SourceCitation[] {
  const citations: SourceCitation[] = [];
  const seen = new Set<string>();

  // Match legal citations: [Artículo 9, LAU] or [Art. 21, Ley 29/1994]
  const legalRegex = /\[(?:Artículo|Art\.?)\s*(\d+(?:\s*bis)?),\s*([^\]]+)\]/gi;
  let match;
  while ((match = legalRegex.exec(response)) !== null) {
    const article = `Artículo ${match[1]}`;
    const law = match[2]?.trim() ?? '';
    const key = `legal-${article}-${law}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ article, law, excerpt: '' });
    }
  }

  // Match program citations: [Bono Alquiler Joven] or [Borsa Jove]
  const programRegex = /\[(Bono[^\]]+|Borsa[^\]]+|Ajudes[^\]]+)\]/gi;
  while ((match = programRegex.exec(response)) !== null) {
    const program = match[1]?.trim() ?? '';
    const key = `program-${program}`;

    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ article: program, law: 'Programa', excerpt: '' });
    }
  }

  return citations;
}

/**
 * Validate that citations exist in the retrieved context
 */
export function validateCitations(
  citations: SourceCitation[],
  context: RetrievalResult[]
): { valid: SourceCitation[]; invalid: SourceCitation[] } {
  const valid: SourceCitation[] = [];
  const invalid: SourceCitation[] = [];

  for (const citation of citations) {
    const matchingChunk = context.find(result => {
      const meta = result.chunk.metadata;

      // Check legal chunks
      if ('article' in meta) {
        const legalMeta = meta as LegalMetadata;
        return (
          legalMeta.article.toLowerCase() === citation.article.toLowerCase() ||
          legalMeta.article.toLowerCase().includes(citation.article.split(' ')[1] ?? '')
        );
      }

      // Check aid chunks
      if ('programName' in meta) {
        const aidMeta = meta as AidMetadata;
        return aidMeta.programName.toLowerCase().includes(citation.article.toLowerCase()) ||
               citation.article.toLowerCase().includes(aidMeta.programName.toLowerCase().split(' ')[0] ?? '');
      }

      return false;
    });

    if (matchingChunk) {
      valid.push({
        ...citation,
        excerpt: matchingChunk.chunk.text.slice(0, 200) + '...',
      });
    } else {
      invalid.push(citation);
    }
  }

  return { valid, invalid };
}

/**
 * Determine confidence level based on retrieval scores and citations
 */
export function determineConfidence(
  context: RetrievalResult[],
  citations: SourceCitation[],
  responseText: string
): 'high' | 'medium' | 'low' | 'none' {
  if (context.length === 0) {
    return 'none';
  }

  // Check if response indicates no information (ES/CA)
  const noInfoPhrases = [
    'no dispongo de información',
    'no tengo información',
    'no tinc informació',
    'no he trobat',
  ];
  if (noInfoPhrases.some(phrase => responseText.toLowerCase().includes(phrase))) {
    return 'none';
  }

  const avgScore = context.reduce((sum, r) => sum + r.score, 0) / context.length;
  const topScore = context[0]?.score ?? 0;

  if (citations.length === 0) {
    return 'low';
  }

  if (topScore >= 0.8 && citations.length > 0) {
    return 'high';
  }

  if (avgScore >= 0.6 && citations.length > 0) {
    return 'medium';
  }

  return 'low';
}

/**
 * Build the final response object with validation
 */
export function buildValidatedResponse(
  answer: string,
  context: RetrievalResult[]
): ChatResponse {
  const citations = extractCitations(answer);
  const { valid } = validateCitations(citations, context);
  const confidence = determineConfidence(context, valid, answer);

  return {
    answer,
    sources: valid,
    confidence,
  };
}

/**
 * Post-process response to add warnings if needed
 */
export function addWarningsIfNeeded(response: ChatResponse): ChatResponse {
  if (response.confidence === 'low') {
    return {
      ...response,
      answer: response.answer + '\n\n_Nota: Aquesta resposta té confiança baixa. Es recomana verificar amb un professional._',
    };
  }

  if (response.confidence === 'none') {
    return {
      ...response,
      answer: 'No he trobat informació rellevant per respondre aquesta pregunta. Et recomano consultar directament amb l\'Agència de l\'Habitatge o un professional.',
    };
  }

  return response;
}
