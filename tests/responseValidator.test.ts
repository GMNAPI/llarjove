/**
 * Tests for response validation
 */

import { describe, it, expect } from 'vitest';
import {
  extractCitations,
  validateCitations,
  determineConfidence,
  buildValidatedResponse,
  enrichCitationsWithUrls,
  addWarningsIfNeeded,
} from '../src/generation/responseValidator.js';
import type { RetrievalResult, SourceCitation, ChatResponse } from '../src/types.js';

describe('extractCitations', () => {
  it('should extract standard citations', () => {
    const response = 'Según el [Artículo 9, LAU], el plazo mínimo es de 5 años.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(1);
    expect(citations[0]?.article).toBe('Artículo 9');
    expect(citations[0]?.law).toBe('LAU');
  });

  it('should extract multiple citations', () => {
    const response = 'Ver [Artículo 9, LAU] y [Artículo 10, LAU] para más detalles.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(2);
  });

  it('should handle abbreviated format', () => {
    const response = 'Según el [Art. 21, LAU], las reparaciones son responsabilidad del arrendador.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(1);
    expect(citations[0]?.article).toBe('Artículo 21');
  });

  it('should handle articles with bis', () => {
    const response = 'El [Artículo 9 bis, LAU] establece condiciones especiales.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(1);
    expect(citations[0]?.article).toBe('Artículo 9 bis');
  });

  it('should deduplicate repeated citations', () => {
    const response = 'El [Artículo 9, LAU] dice X. Además, el [Artículo 9, LAU] también menciona Y.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(1);
  });

  it('should return empty array for no citations', () => {
    const response = 'Esta es una respuesta sin citas legales.';
    const citations = extractCitations(response);

    expect(citations.length).toBe(0);
  });
});

describe('validateCitations', () => {
  const mockContext: RetrievalResult[] = [
    {
      chunk: {
        id: 'LAU-art-9',
        text: 'La duración del arrendamiento será libremente pactada...',
        metadata: {
          law: 'LAU',
          lawFullName: 'Ley de Arrendamientos Urbanos',
          article: 'Artículo 9',
          articleTitle: 'Plazo mínimo',
          sourceFile: 'LAU.txt',
        },
      },
      score: 0.85,
    },
    {
      chunk: {
        id: 'LAU-art-21',
        text: 'El arrendador está obligado a realizar reparaciones...',
        metadata: {
          law: 'LAU',
          lawFullName: 'Ley de Arrendamientos Urbanos',
          article: 'Artículo 21',
          articleTitle: 'Conservación',
          sourceFile: 'LAU.txt',
        },
      },
      score: 0.72,
    },
  ];

  it('should validate citations that exist in context', () => {
    const citations = [{ article: 'Artículo 9', law: 'LAU', excerpt: '' }];
    const { valid, invalid } = validateCitations(citations, mockContext);

    expect(valid.length).toBe(1);
    expect(invalid.length).toBe(0);
    expect(valid[0]?.excerpt).toContain('duración del arrendamiento');
  });

  it('should identify invalid citations', () => {
    const citations = [{ article: 'Artículo 999', law: 'LAU', excerpt: '' }];
    const { valid, invalid } = validateCitations(citations, mockContext);

    expect(valid.length).toBe(0);
    expect(invalid.length).toBe(1);
  });

  it('should handle mixed valid and invalid', () => {
    const citations = [
      { article: 'Artículo 9', law: 'LAU', excerpt: '' },
      { article: 'Artículo 999', law: 'FAKE', excerpt: '' },
    ];
    const { valid, invalid } = validateCitations(citations, mockContext);

    expect(valid.length).toBe(1);
    expect(invalid.length).toBe(1);
  });
});

describe('determineConfidence', () => {
  const highScoreContext: RetrievalResult[] = [
    {
      chunk: {
        id: 'test',
        text: 'Test content',
        metadata: {
          law: 'LAU',
          lawFullName: 'Test',
          article: 'Artículo 1',
          articleTitle: 'Test',
          sourceFile: 'test.txt',
        },
      },
      score: 0.9,
    },
  ];

  const lowScoreContext: RetrievalResult[] = [
    {
      chunk: {
        id: 'test',
        text: 'Test content',
        metadata: {
          law: 'LAU',
          lawFullName: 'Test',
          article: 'Artículo 1',
          articleTitle: 'Test',
          sourceFile: 'test.txt',
        },
      },
      score: 0.4,
    },
  ];

  it('should return high confidence for good scores with citations', () => {
    const citations = [{ article: 'Artículo 1', law: 'LAU', excerpt: '' }];
    const confidence = determineConfidence(highScoreContext, citations, 'Response text');

    expect(confidence).toBe('high');
  });

  it('should return low confidence for no citations', () => {
    const confidence = determineConfidence(highScoreContext, [], 'Response text');

    expect(confidence).toBe('low');
  });

  it('should return none for empty context', () => {
    const confidence = determineConfidence([], [], 'Response text');

    expect(confidence).toBe('none');
  });

  it('should return none when response indicates no information', () => {
    const citations = [{ article: 'Artículo 1', law: 'LAU', excerpt: '' }];
    const response = 'No dispongo de información sobre este tema.';
    const confidence = determineConfidence(highScoreContext, citations, response);

    expect(confidence).toBe('none');
  });

  it('should return low for poor retrieval scores', () => {
    const citations = [{ article: 'Artículo 1', law: 'LAU', excerpt: '' }];
    const confidence = determineConfidence(lowScoreContext, citations, 'Response text');

    expect(confidence).toBe('low');
  });
});

describe('buildValidatedResponse', () => {
  const mockContext: RetrievalResult[] = [
    {
      chunk: {
        id: 'LAU-art-9',
        text: 'La duración del arrendamiento será libremente pactada...',
        metadata: {
          law: 'LAU',
          lawFullName: 'Ley de Arrendamientos Urbanos',
          article: 'Artículo 9',
          articleTitle: 'Plazo mínimo',
          sourceFile: 'LAU.txt',
        },
      },
      score: 0.85,
    },
  ];

  it('should build complete response object', () => {
    const answer = 'El plazo mínimo es de 5 años [Artículo 9, LAU].';
    const response = buildValidatedResponse(answer, mockContext);

    expect(response.answer).toBe(answer);
    expect(response.sources.length).toBe(1);
    expect(response.confidence).toBe('high');
  });

  it('should include validated sources', () => {
    const answer = 'Según [Artículo 9, LAU], el plazo es 5 años.';
    const response = buildValidatedResponse(answer, mockContext);

    expect(response.sources[0]?.article).toBe('Artículo 9');
    expect(response.sources[0]?.law).toBe('LAU');
    expect(response.sources[0]?.excerpt).toBeTruthy();
  });
});

describe('enrichCitationsWithUrls', () => {
  it('should add URL for known program citations', () => {
    const citations: SourceCitation[] = [
      { article: 'Bono Alquiler Joven 2025', law: 'Programa', excerpt: '' },
    ];
    const enriched = enrichCitationsWithUrls(citations);

    expect(enriched[0]?.url).toBe('https://tramits.gencat.cat/es/tramits/tramits-temes/22866_Bo_lloguer_joves');
  });

  it('should add URL for LAU citations', () => {
    const citations: SourceCitation[] = [
      { article: 'Artículo 9', law: 'LAU', excerpt: '' },
    ];
    const enriched = enrichCitationsWithUrls(citations);

    expect(enriched[0]?.url).toBe('https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003');
  });

  it('should add URL for LPH citations', () => {
    const citations: SourceCitation[] = [
      { article: 'Artículo 5', law: 'LPH', excerpt: '' },
    ];
    const enriched = enrichCitationsWithUrls(citations);

    expect(enriched[0]?.url).toBe('https://portaljuridic.gencat.cat/eli/es-ct/l/2023/03/21/1');
  });

  it('should handle citations without known URLs', () => {
    const citations: SourceCitation[] = [
      { article: 'Artículo X', law: 'Unknown Law', excerpt: '' },
    ];
    const enriched = enrichCitationsWithUrls(citations);

    expect(enriched[0]?.url).toBeUndefined();
  });

  it('should enrich multiple citations', () => {
    const citations: SourceCitation[] = [
      { article: 'Artículo 9', law: 'LAU', excerpt: '' },
      { article: 'Bono', law: 'Programa', excerpt: '' },
    ];
    const enriched = enrichCitationsWithUrls(citations);

    expect(enriched).toHaveLength(2);
    expect(enriched[0]?.url).toBeDefined();
    expect(enriched[1]?.url).toBeDefined();
  });
});

describe('addWarningsIfNeeded', () => {
  it('should enrich sources for high confidence responses', () => {
    const response: ChatResponse = {
      answer: 'El plazo es 5 años [Artículo 9, LAU].',
      sources: [{ article: 'Artículo 9', law: 'LAU', excerpt: '' }],
      confidence: 'high',
    };

    const processed = addWarningsIfNeeded(response);

    expect(processed.sources[0]?.url).toBeDefined();
    expect(processed.answer).not.toContain('_Nota:');
  });

  it('should enrich sources for medium confidence responses', () => {
    const response: ChatResponse = {
      answer: 'Información relevante.',
      sources: [{ article: 'Artículo 9', law: 'LAU', excerpt: '' }],
      confidence: 'medium',
    };

    const processed = addWarningsIfNeeded(response);

    expect(processed.sources[0]?.url).toBeDefined();
  });

  it('should add warning note for low confidence', () => {
    const response: ChatResponse = {
      answer: 'Información limitada.',
      sources: [{ article: 'Artículo 9', law: 'LAU', excerpt: '' }],
      confidence: 'low',
    };

    const processed = addWarningsIfNeeded(response);

    expect(processed.answer).toContain('_Nota: Aquesta resposta té confiança baixa');
    expect(processed.sources[0]?.url).toBeDefined();
  });

  it('should replace answer for none confidence and add resources', () => {
    const response: ChatResponse = {
      answer: 'Original answer',
      sources: [],
      confidence: 'none',
    };
    const question = '¿Cómo solicitar el Bono Joven?';

    const processed = addWarningsIfNeeded(response, question);

    expect(processed.answer).toContain('específica sobre aquesta ajuda');
    expect(processed.answer).not.toBe('Original answer');
    expect(processed.actionableResources).toBeDefined();
    expect(processed.actionableResources?.length).toBe(3);
    expect(processed.checklist).toBeDefined();
    expect(processed.checklist?.steps.length).toBeGreaterThan(0);
  });

  it('should generate follow-up question for aid queries without details', () => {
    const response: ChatResponse = {
      answer: 'Original',
      sources: [],
      confidence: 'none',
    };
    const question = 'Quiero una ayuda';

    const processed = addWarningsIfNeeded(response, question);

    expect(processed.followUpQuestion).toBeDefined();
    expect(processed.followUpQuestion).toContain('edat');
  });

  it('should not generate follow-up for detailed queries', () => {
    const response: ChatResponse = {
      answer: 'Original',
      sources: [],
      confidence: 'none',
    };
    const question = 'Tengo 25 años y gano 20000 euros, ¿puedo solicitar el Bono Joven?';

    const processed = addWarningsIfNeeded(response, question);

    expect(processed.followUpQuestion).toBeUndefined();
  });

  it('should use contextual fallback messages', () => {
    const aidResponse: ChatResponse = { answer: '', sources: [], confidence: 'none' };
    const contractResponse: ChatResponse = { answer: '', sources: [], confidence: 'none' };
    const legalResponse: ChatResponse = { answer: '', sources: [], confidence: 'none' };

    const aid = addWarningsIfNeeded(aidResponse, 'Ayudas de vivienda');
    const contract = addWarningsIfNeeded(contractResponse, 'Firmar contrato');
    const legal = addWarningsIfNeeded(legalResponse, '¿Qué dice la LAU?');

    expect(aid.answer).toContain('ajuda');
    expect(contract.answer).toContain('contracte');
    expect(legal.answer).toContain('legal');
  });
});
