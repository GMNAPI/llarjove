/**
 * Tests for response validation
 */

import { describe, it, expect } from 'vitest';
import {
  extractCitations,
  validateCitations,
  determineConfidence,
  buildValidatedResponse,
} from '../src/generation/responseValidator.js';
import type { RetrievalResult } from '../src/types.js';

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
