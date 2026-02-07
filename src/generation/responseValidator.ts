/**
 * Response Validator
 *
 * Validates that generated responses:
 * 1. Contain proper citations (legal or aid program)
 * 2. Citations reference content in the context
 * 3. Response indicates low confidence when appropriate
 */

import type { RetrievalResult, SourceCitation, ChatResponse, LegalMetadata, AidMetadata } from '../types.js';
import { getPrograms } from '../resources/programs.js';
import { getRelevantResources } from '../resources/fallbackResources.js';
import { getRelevantChecklist } from '../resources/fallbackChecklists.js';

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
 * Enrich citations with clickable URLs from known sources
 * Maps program names and legal references to official URLs
 */
export function enrichCitationsWithUrls(citations: SourceCitation[]): SourceCitation[] {
  const programs = getPrograms();

  // URL mappings for legal documents
  const legalUrls: Record<string, string> = {
    'LAU': 'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
    'Ley 29/1994': 'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
    'LPH': 'https://portaljuridic.gencat.cat/eli/es-ct/l/2023/03/21/1',
    'Llei 1/2023': 'https://portaljuridic.gencat.cat/eli/es-ct/l/2023/03/21/1',
    'Ley 12/2023': 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-12211',
  };

  return citations.map(citation => {
    // Check for program match
    for (const program of programs) {
      if (citation.article.toLowerCase().includes(program.name.toLowerCase().split(' ')[0]?.toLowerCase() ?? '') ||
          program.name.toLowerCase().includes(citation.article.toLowerCase())) {
        return { ...citation, url: program.url };
      }
    }

    // Check for legal document match
    for (const [lawKey, url] of Object.entries(legalUrls)) {
      if (citation.law.includes(lawKey)) {
        return { ...citation, url };
      }
    }

    // No URL found, return as is
    return citation;
  });
}

/**
 * Build contextual fallback message based on question category
 */
function buildContextualFallback(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (/bono|bo jove|ajud[ae]s?|ayud[ae]s?|subvenci[óo]|borsa|programa/i.test(lowerQuestion)) {
    return 'No he trobat informació específica sobre aquesta ajuda a la meva base de coneixement. Consulta els recursos oficials següents per obtenir informació actualitzada:';
  }

  if (/contrat[oe]|contracte|firma|firmar|signar/i.test(lowerQuestion)) {
    return 'No tinc informació específica sobre aquest aspecte del contracte. Revisa els recursos següents per assegurar-te dels teus drets:';
  }

  if (/llei|ley|dret|derecho|LAU|LPH/i.test(lowerQuestion)) {
    return 'No he trobat informació específica sobre aquesta qüestió legal. Consulta els recursos oficials per a més detalls:';
  }

  return 'No he trobat informació rellevant per respondre aquesta pregunta. Consulta els recursos oficials següents per trobar resposta:';
}

/**
 * Generate optional follow-up question to clarify context
 */
function generateFollowUpQuestion(question: string): string | undefined {
  const lowerQuestion = question.toLowerCase();

  // Check if it's an aid question without personal details
  const isAidQuestion = /quiero|quería|necesito|busco|ayud[ae]|ajud[ae]|subvenci[óo]/i.test(lowerQuestion);
  const hasPersonalDetails = /\d{2,5}|años|anys|tengo|tinc|soy|edad|edat|ingressos|ingresos|gano|treballo|trabajo|estudi[ao]/i.test(lowerQuestion);

  if (isAidQuestion && !hasPersonalDetails) {
    return 'Podries especificar la teva edat i situació (estudiant, treballador, etc.) per recomanar-te ajudes específiques?';
  }

  if (/contrat[oe]|contracte/i.test(lowerQuestion) && !/durada|preu|fiança|precio|precio|duración/i.test(lowerQuestion)) {
    return 'Tens un contracte ja signat o estàs considerant signar-ne un de nou?';
  }

  return undefined;
}

/**
 * Post-process response to add warnings if needed
 * @param response The ChatResponse object from buildValidatedResponse
 * @param originalQuestion The user's original question (required for fallback)
 */
export function addWarningsIfNeeded(
  response: ChatResponse,
  originalQuestion: string = ''
): ChatResponse {
  // For high/medium confidence, enrich citations with URLs
  if (response.confidence === 'high' || response.confidence === 'medium') {
    return {
      ...response,
      sources: enrichCitationsWithUrls(response.sources),
    };
  }

  if (response.confidence === 'low') {
    return {
      ...response,
      answer: response.answer + '\n\n_Nota: Aquesta resposta té confiança baixa. Es recomana verificar amb un professional._',
      sources: enrichCitationsWithUrls(response.sources),
    };
  }

  // NONE: Full actionable fallback with resources + checklist
  if (response.confidence === 'none') {
    const resources = getRelevantResources(originalQuestion, 3);
    const checklist = getRelevantChecklist(originalQuestion);
    const followUp = generateFollowUpQuestion(originalQuestion);

    return {
      ...response,
      answer: buildContextualFallback(originalQuestion),
      sources: [],
      actionableResources: resources,
      checklist: checklist,
      followUpQuestion: followUp,
    };
  }

  return response;
}
