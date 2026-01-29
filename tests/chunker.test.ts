/**
 * Tests for the legal document chunker
 */

import { describe, it, expect } from 'vitest';
import { chunkLegalDocument, addOverlapContext } from '../src/ingestion/chunker.js';

describe('chunkLegalDocument', () => {
  const sampleLaw = `TÍTULO I. ÁMBITO DE LA LEY

Artículo 1. Ámbito de aplicación.
La presente Ley establece el régimen jurídico aplicable a los arrendamientos de fincas urbanas.

Artículo 2. Arrendamiento de vivienda.
Se considera arrendamiento de vivienda aquel arrendamiento que recae sobre una edificación habitable.

TÍTULO II. DE LOS ARRENDAMIENTOS

Artículo 9. Plazo mínimo.
La duración del arrendamiento será libremente pactada por las partes.
Si ésta fuera inferior a cinco años, se prorrogará obligatoriamente.`;

  const lawInfo = { code: 'LAU', fullName: 'Ley de Arrendamientos Urbanos' };

  it('should extract articles from legal text', () => {
    const chunks = chunkLegalDocument(sampleLaw, lawInfo, 'test.txt');

    expect(chunks.length).toBe(3);
    expect(chunks[0]?.metadata.article).toBe('Artículo 1');
    expect(chunks[1]?.metadata.article).toBe('Artículo 2');
    expect(chunks[2]?.metadata.article).toBe('Artículo 9');
  });

  it('should preserve article titles', () => {
    const chunks = chunkLegalDocument(sampleLaw, lawInfo, 'test.txt');

    expect(chunks[0]?.metadata.articleTitle).toBe('Ámbito de aplicación.');
    expect(chunks[1]?.metadata.articleTitle).toBe('Arrendamiento de vivienda.');
    expect(chunks[2]?.metadata.articleTitle).toBe('Plazo mínimo.');
  });

  it('should include law metadata', () => {
    const chunks = chunkLegalDocument(sampleLaw, lawInfo, 'test.txt');

    expect(chunks[0]?.metadata.law).toBe('LAU');
    expect(chunks[0]?.metadata.lawFullName).toBe('Ley de Arrendamientos Urbanos');
    expect(chunks[0]?.metadata.sourceFile).toBe('test.txt');
  });

  it('should detect title context', () => {
    const chunks = chunkLegalDocument(sampleLaw, lawInfo, 'test.txt');

    // Articles 1 and 2 should be under TÍTULO I
    expect(chunks[0]?.metadata.title).toContain('TÍTULO I');
    expect(chunks[1]?.metadata.title).toContain('TÍTULO I');

    // Article 9 should be under TÍTULO II
    expect(chunks[2]?.metadata.title).toContain('TÍTULO II');
  });

  it('should generate unique IDs', () => {
    const chunks = chunkLegalDocument(sampleLaw, lawInfo, 'test.txt');
    const ids = chunks.map(c => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
    expect(chunks[0]?.id).toBe('LAU-art-1');
    expect(chunks[2]?.id).toBe('LAU-art-9');
  });

  it('should handle empty text', () => {
    const chunks = chunkLegalDocument('', lawInfo, 'empty.txt');
    expect(chunks.length).toBe(0);
  });

  it('should handle text without articles (fallback)', () => {
    const plainText = 'Este es un texto legal sin artículos formateados.\n\nTiene varios párrafos pero no sigue el formato de ley.';
    const chunks = chunkLegalDocument(plainText, lawInfo, 'plain.txt');

    // Should fall back to paragraph chunking
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.metadata.article).toContain('Fragmento');
  });
});

describe('addOverlapContext', () => {
  const testChunks = [
    {
      id: 'test-1',
      text: 'Primer artículo con contenido importante.',
      metadata: {
        law: 'TEST',
        lawFullName: 'Test Law',
        article: 'Artículo 1',
        articleTitle: 'Primero',
        sourceFile: 'test.txt',
      },
    },
    {
      id: 'test-2',
      text: 'Segundo artículo con más contenido.',
      metadata: {
        law: 'TEST',
        lawFullName: 'Test Law',
        article: 'Artículo 2',
        articleTitle: 'Segundo',
        sourceFile: 'test.txt',
      },
    },
    {
      id: 'test-3',
      text: 'Tercer artículo final.',
      metadata: {
        law: 'TEST',
        lawFullName: 'Test Law',
        article: 'Artículo 3',
        articleTitle: 'Tercero',
        sourceFile: 'test.txt',
      },
    },
  ];

  it('should add overlap from adjacent chunks', () => {
    const withOverlap = addOverlapContext(testChunks, 20);

    // First chunk should have context from next
    expect(withOverlap[0]?.text).toContain('Contexto siguiente');

    // Middle chunk should have both
    expect(withOverlap[1]?.text).toContain('Contexto anterior');
    expect(withOverlap[1]?.text).toContain('Contexto siguiente');

    // Last chunk should have context from previous
    expect(withOverlap[2]?.text).toContain('Contexto anterior');
  });

  it('should preserve original content', () => {
    const withOverlap = addOverlapContext(testChunks, 20);

    expect(withOverlap[0]?.text).toContain('Primer artículo');
    expect(withOverlap[1]?.text).toContain('Segundo artículo');
    expect(withOverlap[2]?.text).toContain('Tercer artículo');
  });

  it('should preserve metadata', () => {
    const withOverlap = addOverlapContext(testChunks, 20);

    expect(withOverlap[0]?.metadata.article).toBe('Artículo 1');
    expect(withOverlap[0]?.id).toBe('test-1');
  });
});
