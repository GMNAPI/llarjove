/**
 * Document Loader
 *
 * Loads legal documents from various sources (PDF, TXT)
 * Handles Spanish legal document formats from BOE
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

export interface LoadedDocument {
  filename: string;
  content: string;
  format: 'pdf' | 'txt';
}

/**
 * Load a single text file
 */
export function loadTextFile(filePath: string): LoadedDocument {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');

  return {
    filename: basename(filePath),
    content,
    format: 'txt',
  };
}

/**
 * Load a PDF file (requires pdf-parse)
 */
export async function loadPdfFile(filePath: string): Promise<LoadedDocument> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Dynamic import to handle optional dependency
  const pdfParse = (await import('pdf-parse')).default;
  const dataBuffer = readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  return {
    filename: basename(filePath),
    content: data.text,
    format: 'pdf',
  };
}

/**
 * Load all documents from a directory
 */
export async function loadDocumentsFromDirectory(
  directoryPath: string
): Promise<LoadedDocument[]> {
  if (!existsSync(directoryPath)) {
    throw new Error(`Directory not found: ${directoryPath}`);
  }

  const files = readdirSync(directoryPath);
  const documents: LoadedDocument[] = [];

  for (const file of files) {
    const filePath = join(directoryPath, file);
    const ext = extname(file).toLowerCase();

    try {
      if (ext === '.txt') {
        documents.push(loadTextFile(filePath));
      } else if (ext === '.pdf') {
        documents.push(await loadPdfFile(filePath));
      }
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }

  return documents;
}

/**
 * Law information registry for known Spanish laws
 */
export const LAW_REGISTRY = {
  'LAU': {
    code: 'LAU',
    fullName: 'Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos',
    patterns: ['arrendamientos', 'alquiler', 'inquilino', 'arrendador'],
  },
  'LPH': {
    code: 'LPH',
    fullName: 'Ley 49/1960, de 21 de julio, sobre Propiedad Horizontal',
    patterns: ['propiedad horizontal', 'comunidad', 'propietarios'],
  },
  'CC': {
    code: 'CC',
    fullName: 'Código Civil - Libro IV, Título II (Contratos)',
    patterns: ['código civil', 'contrato', 'obligaciones'],
  },
  'ITP': {
    code: 'ITP',
    fullName: 'Real Decreto Legislativo 1/1993, de 24 de septiembre, ITP/AJD',
    patterns: ['transmisiones patrimoniales', 'itp', 'ajd', 'impuesto'],
  },
} as const;

/**
 * Detect which law a document belongs to based on filename or content
 */
export function detectLawInfo(
  filename: string,
  content: string
): { code: string; fullName: string } {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase().slice(0, 2000); // Check first 2000 chars

  for (const [code, info] of Object.entries(LAW_REGISTRY)) {
    // Check filename
    if (lowerFilename.includes(code.toLowerCase())) {
      return { code, fullName: info.fullName };
    }

    // Check content patterns
    for (const pattern of info.patterns) {
      if (lowerContent.includes(pattern)) {
        return { code, fullName: info.fullName };
      }
    }
  }

  // Default: use filename as code
  return {
    code: basename(filename, extname(filename)).toUpperCase(),
    fullName: `Documento: ${filename}`,
  };
}
