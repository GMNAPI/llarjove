/**
 * Legal Document Chunker
 *
 * Chunks legal documents by article, preserving the hierarchical structure
 * of Spanish legislation (Ley → Título → Capítulo → Artículo).
 *
 * This semantic chunking approach is more effective for legal texts than
 * fixed-size token chunking because legal meaning is contained in articles.
 */

import type { LegalChunk, LegalMetadata } from '../types.js';

interface LawInfo {
  code: string;      // e.g., "LAU", "LPH"
  fullName: string;  // e.g., "Ley 29/1994, de Arrendamientos Urbanos"
}

/**
 * Main chunking function for legal documents
 */
export function chunkLegalDocument(
  text: string,
  lawInfo: LawInfo,
  sourceFile: string
): LegalChunk[] {
  const chunks: LegalChunk[] = [];
  const seenIds = new Map<string, number>(); // Track duplicate IDs

  // Normalize text: consistent line endings, remove excessive whitespace
  const normalizedText = normalizeText(text);

  // Extract current context (Title, Chapter)
  let currentTitle = '';
  let currentChapter = '';

  // Regex to match articles in Spanish legislation
  // Handles formats like:
  // - "Artículo 9. Plazo mínimo."
  // - "Artículo 10. Prórroga del contrato."
  // - "Art. 21.- Conservación de la vivienda"
  const articleRegex = /(?:Artículo|Art\.?)\s+(\d+(?:\s*bis)?)\s*[.\-–]\s*([^\n]+)\n([\s\S]*?)(?=(?:Artículo|Art\.?)\s+\d+|TÍTULO|CAPÍTULO|$)/gi;

  // First, extract Title and Chapter positions for context
  const titlePositions = extractSectionPositions(normalizedText, /TÍTULO\s+[IVX\d]+[.\s\-–]*([^\n]*)/gi);
  const chapterPositions = extractSectionPositions(normalizedText, /CAPÍTULO\s+[IVX\d]+[.\s\-–]*([^\n]*)/gi);

  let match;
  while ((match = articleRegex.exec(normalizedText)) !== null) {
    const articleNumber = match[1]?.trim() ?? '';
    const articleTitle = match[2]?.trim() ?? '';
    const articleContent = match[3]?.trim() ?? '';

    if (!articleNumber || !articleContent) continue;

    // Find current title and chapter based on position
    currentTitle = findCurrentSection(match.index, titlePositions);
    currentChapter = findCurrentSection(match.index, chapterPositions);

    const metadata: LegalMetadata = {
      law: lawInfo.code,
      lawFullName: lawInfo.fullName,
      title: currentTitle,
      chapter: currentChapter,
      article: `Artículo ${articleNumber}`,
      articleTitle: articleTitle,
      sourceFile: sourceFile,
    };

    // Build the full chunk text with context
    const chunkText = buildChunkText(metadata, articleContent);

    // Generate unique ID (handle duplicates)
    const baseId = `${lawInfo.code}-art-${articleNumber.replace(/\s+/g, '')}`;
    const count = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, count + 1);
    const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;

    chunks.push({
      id: uniqueId,
      text: chunkText,
      metadata,
    });
  }

  // If no articles found with the main regex, try alternative parsing
  if (chunks.length === 0) {
    return chunkByParagraphs(normalizedText, lawInfo, sourceFile);
  }

  return chunks;
}

/**
 * Build chunk text with hierarchical context
 */
function buildChunkText(metadata: LegalMetadata, content: string): string {
  const parts: string[] = [];

  // Add hierarchy context
  if (metadata.title) {
    parts.push(`[${metadata.title}]`);
  }
  if (metadata.chapter) {
    parts.push(`[${metadata.chapter}]`);
  }

  // Add article header
  parts.push(`${metadata.article}. ${metadata.articleTitle}`);
  parts.push('');
  parts.push(content);

  return parts.join('\n');
}

/**
 * Normalize text for consistent parsing
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Extract positions of section headers
 */
function extractSectionPositions(
  text: string,
  regex: RegExp
): Array<{ position: number; name: string }> {
  const positions: Array<{ position: number; name: string }> = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    positions.push({
      position: match.index,
      name: match[0]?.trim() ?? '',
    });
  }

  return positions;
}

/**
 * Find the current section name based on position
 */
function findCurrentSection(
  position: number,
  sections: Array<{ position: number; name: string }>
): string {
  let current = '';

  for (const section of sections) {
    if (section.position <= position) {
      current = section.name;
    } else {
      break;
    }
  }

  return current;
}

/**
 * Fallback chunking by paragraphs for documents without clear article structure
 */
function chunkByParagraphs(
  text: string,
  lawInfo: LawInfo,
  sourceFile: string
): LegalChunk[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: LegalChunk[] = [];

  let chunkIndex = 0;
  let currentChunk = '';
  const maxChunkLength = 1500; // Characters per chunk

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkLength && currentChunk) {
      chunks.push({
        id: `${lawInfo.code}-chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        metadata: {
          law: lawInfo.code,
          lawFullName: lawInfo.fullName,
          article: `Fragmento ${chunkIndex + 1}`,
          articleTitle: 'Texto legal',
          sourceFile,
        },
      });
      chunkIndex++;
      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `${lawInfo.code}-chunk-${chunkIndex}`,
      text: currentChunk.trim(),
      metadata: {
        law: lawInfo.code,
        lawFullName: lawInfo.fullName,
        article: `Fragmento ${chunkIndex + 1}`,
        articleTitle: 'Texto legal',
        sourceFile,
      },
    });
  }

  return chunks;
}

/**
 * Add overlap context from adjacent articles
 * This improves retrieval when questions span multiple articles
 */
export function addOverlapContext(
  chunks: LegalChunk[],
  overlapSize: number = 200
): LegalChunk[] {
  return chunks.map((chunk, index) => {
    const parts: string[] = [];

    // Add context from previous article
    if (index > 0) {
      const prevChunk = chunks[index - 1];
      if (prevChunk) {
        const prevContext = prevChunk.text.slice(-overlapSize);
        parts.push(`[Contexto anterior: ...${prevContext}]`);
        parts.push('');
      }
    }

    parts.push(chunk.text);

    // Add context from next article
    if (index < chunks.length - 1) {
      const nextChunk = chunks[index + 1];
      if (nextChunk) {
        const nextContext = nextChunk.text.slice(0, overlapSize);
        parts.push('');
        parts.push(`[Contexto siguiente: ${nextContext}...]`);
      }
    }

    return {
      ...chunk,
      text: parts.join('\n'),
    };
  });
}
