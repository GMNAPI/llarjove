/**
 * Aid Program Document Chunker
 *
 * Chunks aid program documents (Bono Joven, ajudes Generalitat, etc.)
 * by Markdown sections (## headers), preserving the logical structure
 * that users naturally query: "requisits", "terminis", "documentació".
 */

import type { AidChunk, AidMetadata } from '../types.js';

interface AidInfo {
  programName: string;    // "Bono Alquiler Joven 2025"
  sourceUrl?: string;     // Official link
}

/**
 * Main chunking function for aid program documents
 */
export function chunkAidDocument(
  text: string,
  aidInfo: AidInfo,
  sourceFile: string
): AidChunk[] {
  const chunks: AidChunk[] = [];
  const normalizedText = normalizeText(text);

  // Extract program title from first line if it's a # header
  const titleMatch = normalizedText.match(/^#\s+([^\n]+)/);
  const programName = aidInfo.programName || titleMatch?.[1] || 'Programa d\'ajuda';

  // Split by ## sections
  const sections = splitBySections(normalizedText);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section || !section.content.trim()) continue;

    const metadata: AidMetadata = {
      programName,
      section: section.title,
      sourceFile,
      sourceUrl: aidInfo.sourceUrl,
    };

    // Extract deadline if this is a "Terminis" section
    if (isDeadlineSection(section.title)) {
      metadata.deadline = extractDeadline(section.content);
    }

    // Extract amount if mentioned
    const amount = extractAmount(section.content);
    if (amount) {
      metadata.amount = amount;
    }

    const chunkText = buildAidChunkText(programName, section.title, section.content);

    chunks.push({
      id: `${slugify(programName)}-${slugify(section.title)}-${i}`,
      text: chunkText,
      metadata,
    });
  }

  // Fallback: if sectioning produced no chunks (e.g. regex/format mismatch), use full doc
  if (chunks.length === 0 && normalizedText.trim()) {
    const metadata: AidMetadata = {
      programName,
      section: 'Informació general',
      sourceFile,
      sourceUrl: aidInfo.sourceUrl,
    };
    chunks.push({
      id: `${slugify(programName)}-general-0`,
      text: buildAidChunkText(programName, 'Informació general', normalizedText.trim()),
      metadata,
    });
  }

  return chunks;
}

interface Section {
  title: string;
  content: string;
}

/**
 * Split document by ## headers
 */
function splitBySections(text: string): Section[] {
  const sections: Section[] = [];

  // Regex to match ## headers (lookahead must be \n## so content doesn't end at blank line)
  const sectionRegex = /^##\s+([^\n]+)\n([\s\S]*?)(?=\n##\s+|$)/gm;

  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    sections.push({
      title: match[1]?.trim() ?? '',
      content: match[2]?.trim() ?? '',
    });
  }

  // If no ## sections found, treat the whole document as one chunk
  if (sections.length === 0) {
    const titleMatch = text.match(/^#\s+([^\n]+)\n([\s\S]*)/);
    if (titleMatch) {
      sections.push({
        title: 'Informació general',
        content: titleMatch[2]?.trim() ?? text,
      });
    } else {
      sections.push({
        title: 'Informació general',
        content: text,
      });
    }
  }

  return sections;
}

/**
 * Build chunk text with program context
 */
function buildAidChunkText(programName: string, sectionTitle: string, content: string): string {
  return `[${programName}]\n[${sectionTitle}]\n\n${content}`;
}

/**
 * Check if section is about deadlines/dates
 */
function isDeadlineSection(title: string): boolean {
  const deadlineKeywords = ['termini', 'plazo', 'data', 'fecha', 'sol·licitud', 'solicitud'];
  const lowerTitle = title.toLowerCase();
  return deadlineKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Extract monetary amount from text
 */
function extractAmount(text: string): string | undefined {
  // Match patterns like "250€/mes", "250 euros", "fins a 250€"
  const amountRegex = /(?:fins a\s+)?(\d+(?:\.\d+)?)\s*€(?:\/mes)?|(\d+(?:\.\d+)?)\s*euros?/i;
  const match = text.match(amountRegex);

  if (match) {
    const amount = match[1] || match[2];
    if (text.toLowerCase().includes('/mes') || text.toLowerCase().includes('mensual')) {
      return `${amount}€/mes`;
    }
    return `${amount}€`;
  }

  return undefined;
}

// Month mappings - easily extensible for new languages
const MONTH_MAP: Record<string, string> = {
  // Catalan
  gener: '01', febrer: '02', març: '03', abril: '04',
  maig: '05', juny: '06', juliol: '07', agost: '08',
  setembre: '09', octubre: '10', novembre: '11', desembre: '12',
  // Spanish
  enero: '01', febrero: '02', marzo: '03',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', noviembre: '11', diciembre: '12',
};

/**
 * Extract deadline date from text
 * Format: DD-MM-YYYY
 * Prefers end date (FI/FIN) over start date
 */
export function extractDeadline(text: string): string | undefined {
  const dateRegex = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi;
  const matches = [...text.matchAll(dateRegex)];

  if (matches.length === 0) return undefined;

  // Find end date marker position
  const upperText = text.toUpperCase();
  const endMarkerPos = Math.max(upperText.indexOf('FI:'), upperText.indexOf('FIN:'));

  // Select best match: prefer date after end marker, else last date
  let selected = matches[matches.length - 1];
  if (endMarkerPos !== -1) {
    const afterEnd = matches.find(m => m.index && m.index > endMarkerPos);
    if (afterEnd) selected = afterEnd;
  }

  if (!selected) return undefined;

  const [, day, monthName, year] = selected;
  const month = MONTH_MAP[monthName?.toLowerCase() ?? ''];

  if (!day || !month || !year) return undefined;

  return `${day.padStart(2, '0')}-${month}-${year}`;
}

/**
 * Normalize text for consistent parsing
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Create URL-safe slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
