/**
 * Tests for the aid program document chunker
 */

import { describe, it, expect } from 'vitest';
import { chunkAidDocument, extractDeadline } from '../src/ingestion/aidChunker.js';

const defaultAidInfo = { programName: 'Test Program', sourceUrl: 'https://example.com' };

describe('chunkAidDocument', () => {
  const multiSectionDoc = `# Bono Alquiler Joven 2025

## Què és?

El Bono Alquiler Joven és una ajuda econòmica.

## Requisits

### Edat
- Tenir entre 18 i 35 anys.

### Ingressos
- Ingressos ≤ 25.200€ bruts.

## Terminis de sol·licitud 2025

- INICI: 30 de juny de 2025
- FI: 11 de juliol de 2025 a les 14:00h

## Quantia

Fins a 250€/mes durant 24 mesos.`;

  it('should split a multi-section ## document correctly', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');

    expect(chunks.length).toBeGreaterThanOrEqual(4);
    const titles = chunks.map(c => c.metadata.section);
    expect(titles).toContain('Què és?');
    expect(titles).toContain('Requisits');
    expect(titles).toContain('Terminis de sol·licitud 2025');
    expect(titles).toContain('Quantia');
  });

  it('should preserve section content and program name', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');
    const quèEs = chunks.find(c => c.metadata.section === 'Què és?');

    expect(quèEs).toBeDefined();
    expect(quèEs?.text).toContain('Bono Alquiler Joven');
    expect(quèEs?.text).toContain('ajuda econòmica');
    expect(quèEs?.metadata.programName).toBe('Test Program');
    expect(quèEs?.metadata.sourceFile).toBe('bono.txt');
  });

  it('should keep ### subsections inside ## sections', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');
    const requisits = chunks.find(c => c.metadata.section === 'Requisits');

    expect(requisits).toBeDefined();
    expect(requisits?.text).toContain('Edat');
    expect(requisits?.text).toContain('Ingressos');
    expect(requisits?.text).toContain('18 i 35 anys');
    expect(requisits?.text).toContain('25.200€');
  });

  it('should extract deadline metadata from Terminis sections', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');
    const terminis = chunks.find(c => c.metadata.section === 'Terminis de sol·licitud 2025');

    expect(terminis).toBeDefined();
    expect(terminis?.metadata.deadline).toBe('11-07-2025');
  });

  it('should extract amount metadata', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');
    const quantia = chunks.find(c => c.metadata.section === 'Quantia');

    expect(quantia).toBeDefined();
    expect(quantia?.metadata.amount).toBeDefined();
    expect(quantia?.metadata.amount).toMatch(/\d+€/);
  });

  it('should fall back to single chunk when no ## headers exist', () => {
    const plainText = 'Just a paragraph.\n\nAnother paragraph. No markdown headers.';
    const chunks = chunkAidDocument(plainText, defaultAidInfo, 'plain.txt');

    expect(chunks.length).toBe(1);
    expect(chunks[0]?.metadata.section).toBe('Informació general');
    expect(chunks[0]?.text).toContain('Just a paragraph');
    expect(chunks[0]?.text).toContain('Another paragraph');
  });

  it('should handle empty text', () => {
    const chunks = chunkAidDocument('', defaultAidInfo, 'empty.txt');
    expect(chunks.length).toBe(0);
  });

  it('should generate unique IDs', () => {
    const chunks = chunkAidDocument(multiSectionDoc, defaultAidInfo, 'bono.txt');
    const ids = chunks.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('extractDeadline', () => {
  it('should extract end date when FI: is present', () => {
    const text = 'INICI: 30 de juny de 2025. FI: 11 de juliol de 2025 a les 14:00h';
    expect(extractDeadline(text)).toBe('11-07-2025');
  });

  it('should return last date when no FI marker', () => {
    const text = 'Del 1 de gener de 2025 al 31 de desembre de 2025';
    expect(extractDeadline(text)).toBe('31-12-2025');
  });

  it('should return undefined when no date pattern', () => {
    expect(extractDeadline('No dates here')).toBeUndefined();
  });
});
