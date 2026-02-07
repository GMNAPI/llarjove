/**
 * Ingestion Script - LlarJove
 *
 * Processes both legal documents and aid program documents.
 * - data/laws/   → Legal documents (LAU, etc.) → chunkLegalDocument
 * - data/ajudes/ → Aid programs (Bono Joven, etc.) → chunkAidDocument
 *
 * Usage: pnpm ingest [--clear]
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync, readFileSync } from 'fs';
import {
  loadDocumentsFromDirectory,
  detectLawInfo,
  chunkLegalDocument,
  chunkAidDocument,
  addOverlapContext,
  embedChunks,
} from '../ingestion/index.js';
import { initVectorStore, addChunks, getStats, clearCollection } from '../retrieval/index.js';
import type { ContentChunk } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const LAWS_DIR = resolve(DATA_DIR, 'laws');
const AIDS_DIR = resolve(DATA_DIR, 'ajudes');

// Aid program registry - maps filenames to program info (more specific keys first)
const AID_REGISTRY: Record<string, { programName: string; sourceUrl?: string }> = {
  'bono-alquiler-joven': {
    programName: 'Bono Alquiler Joven 2025',
    sourceUrl: 'https://tramits.gencat.cat/es/tramits/tramits-temes/22866_Bo_lloguer_joves',
  },
  'ajudes-lloguer-generalitat': {
    programName: 'Ajudes al lloguer Generalitat 2025',
    sourceUrl: 'https://habitatge.gencat.cat/ca/ambits/ajuts/subvencionslloguer/joves/',
  },
  'ajudes-generalitat': {
    programName: 'Ajudes al lloguer Generalitat',
    sourceUrl: 'https://habitatge.gencat.cat',
  },
  'borsa-jove': {
    programName: 'Borsa Jove d\'Habitatge',
    sourceUrl: 'https://habitatge.gencat.cat',
  },
  'drets-basics-inquili': {
    programName: 'Guia de drets basics de l\'inquili',
    sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
  },
  'llei-habitatge-2023': {
    programName: 'Llei 12/2023 - Zones de mercat residencial tensat',
    sourceUrl: 'https://habitatge.gencat.cat/ca/ambits/preus-ingressos-i-zones/limit-preu-lloguer/llistat-municipis-zmrt/',
  },
};

function detectAidInfo(filename: string): { programName: string; sourceUrl?: string } {
  const baseName = filename.toLowerCase().replace(/\.(txt|md|pdf)$/, '');

  for (const [key, info] of Object.entries(AID_REGISTRY)) {
    if (baseName.includes(key)) {
      return info;
    }
  }

  // Default: use filename as program name
  return { programName: baseName.replace(/-/g, ' ') };
}

async function processLegalDocuments(): Promise<ContentChunk[]> {
  if (!existsSync(LAWS_DIR)) {
    console.log('   No laws directory found, skipping...');
    return [];
  }

  const documents = await loadDocumentsFromDirectory(LAWS_DIR);
  if (documents.length === 0) return [];

  console.log(`   Found ${documents.length} legal document(s)`);

  let allChunks: ContentChunk[] = [];

  for (const doc of documents) {
    console.log(`   Processing: ${doc.filename}`);
    const lawInfo = detectLawInfo(doc.filename, doc.content);
    console.log(`     → ${lawInfo.code} - ${lawInfo.fullName}`);

    let chunks = chunkLegalDocument(doc.content, lawInfo, doc.filename);
    chunks = addOverlapContext(chunks, 150);
    console.log(`     → ${chunks.length} chunks`);

    allChunks = allChunks.concat(chunks);
  }

  return allChunks;
}

async function processAidDocuments(): Promise<ContentChunk[]> {
  if (!existsSync(AIDS_DIR)) {
    console.log('   No ajudes directory found, skipping...');
    return [];
  }

  const files = readdirSync(AIDS_DIR).filter(f =>
    f.endsWith('.txt') || f.endsWith('.md')
  );

  if (files.length === 0) return [];

  console.log(`   Found ${files.length} aid document(s)`);

  let allChunks: ContentChunk[] = [];

  for (const filename of files) {
    console.log(`   Processing: ${filename}`);
    const filepath = resolve(AIDS_DIR, filename);
    const content = readFileSync(filepath, 'utf-8');

    const aidInfo = detectAidInfo(filename);
    console.log(`     → ${aidInfo.programName}`);

    const chunks = chunkAidDocument(content, aidInfo, filename);
    console.log(`     → ${chunks.length} chunks`);

    allChunks = allChunks.concat(chunks);
  }

  return allChunks;
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('       LlarJove - Document Ingestion                ');
  console.log('═══════════════════════════════════════════════════\n');

  const shouldClear = process.argv.includes('--clear');

  // Initialize vector store
  console.log('1. Initializing vector store...');
  await initVectorStore();

  if (shouldClear) {
    console.log('   Clearing existing collection...');
    await clearCollection();
    await initVectorStore();
  }

  // Process legal documents
  console.log('\n2. Processing legal documents (data/laws/)...');
  const legalChunks = await processLegalDocuments();

  // Process aid documents
  console.log('\n3. Processing aid documents (data/ajudes/)...');
  const aidChunks = await processAidDocuments();

  // Combine all chunks
  const allChunks = [...legalChunks, ...aidChunks];

  if (allChunks.length === 0) {
    console.log('\n   No documents found!');
    console.log('   Add files to:');
    console.log('   - data/laws/   (legal documents like LAU.txt)');
    console.log('   - data/ajudes/ (aid programs like bono-alquiler-joven.txt)');
    process.exit(1);
  }

  // Generate embeddings
  console.log('\n4. Generating embeddings...');
  const embeddedChunks = await embedChunks(allChunks);

  // Store in vector database
  console.log('\n5. Storing in vector database...');
  await addChunks(embeddedChunks);

  // Final stats
  const stats = await getStats();
  console.log('\n═══════════════════════════════════════════════════');
  console.log('                    Summary                         ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Legal chunks:  ${legalChunks.length}`);
  console.log(`   Aid chunks:    ${aidChunks.length}`);
  console.log(`   Total stored:  ${stats.count}`);
  console.log('\n   Ready! Run: pnpm dev');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
