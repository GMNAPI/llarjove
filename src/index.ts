/**
 * LegalBot RAG - Main entry point
 *
 * A RAG-based chatbot for Spanish real estate law.
 * Technical demo for MIKE interview.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { serverConfig } from './config.js';
import { initVectorStore } from './retrieval/index.js';
import { registerChatRoutes } from './api/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
  });

  // Initialize vector store
  console.log('Initializing vector store...');
  try {
    await initVectorStore();
    console.log('Vector store initialized successfully');
  } catch (error) {
    console.warn('Warning: Could not connect to vector store. Some features may not work.');
    console.warn('Make sure Chroma is running: docker-compose up -d chroma');
  }

  // Register routes
  await registerChatRoutes(app);

  // Root endpoint - serve UI
  const indexHtml = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8');
  app.get('/', async (request, reply) => {
    reply.type('text/html').send(indexHtml);
  });

  // API info endpoint
  app.get('/api', async () => ({
    name: 'LegalBot RAG',
    version: '1.0.0',
    description: 'RAG chatbot for Spanish real estate law',
    endpoints: {
      chat: 'POST /chat',
      retrieve: 'POST /retrieve',
      health: 'GET /health',
      stats: 'GET /stats',
    },
  }));

  // Start server
  try {
    await app.listen({
      port: serverConfig.port,
      host: serverConfig.host,
    });
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      LegalBot RAG v1.0                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running at http://${serverConfig.host}:${serverConfig.port}                   ║
║                                                               ║
║  Endpoints:                                                   ║
║    POST /chat      - Chat with the legal assistant            ║
║    POST /retrieve  - Get relevant documents (debug)           ║
║    GET  /health    - Health check                             ║
║    GET  /stats     - System statistics                        ║
║                                                               ║
║  Demo for MIKE technical interview                            ║
╚═══════════════════════════════════════════════════════════════╝
`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch(console.error);
