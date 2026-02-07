/**
 * Chat API endpoint
 *
 * Exposes the RAG system through a REST API
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, queryStream, retrieve } from '../rag.js';
import { getStats, isLocalMode, queryChunks } from '../retrieval/index.js';
import { getPrograms, getProgramById, getUpcomingDeadlines } from '../resources/programs.js';
import { generateEmbedding } from '../ingestion/index.js';
import { ragConfig } from '../config.js';
import type { ChatRequest, ChatResponse, ChatMessage, LegalMetadata, AidMetadata } from '../types.js';

interface ChatBody {
  question: string;
  history?: ChatMessage[];
  stream?: boolean;
}

interface RetrieveBody {
  question: string;
}

/**
 * Register chat routes
 */
export async function registerChatRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /chat - Main chat endpoint
   */
  app.post<{ Body: ChatBody }>(
    '/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 1 },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                  content: { type: 'string' },
                },
              },
            },
            stream: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
      const { question, history, stream } = request.body;

      try {
        if (stream) {
          // Streaming response
          reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          const response = await queryStream(
            question,
            history,
            (chunk) => {
              reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
          );

          // Send final response with metadata
          reply.raw.write(`data: ${JSON.stringify({ done: true, response })}\n\n`);
          reply.raw.end();
        } else {
          // Regular response
          const response = await query(question, history);
          return response;
        }
      } catch (error) {
        request.log.error(error, 'Chat query failed');
        reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * POST /retrieve - Get relevant chunks without generation (for debugging)
   * Enhanced with embedding prefixes for diagnosis
   */
  app.post<{ Body: RetrieveBody }>(
    '/retrieve',
    {
      schema: {
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RetrieveBody }>, reply: FastifyReply) => {
      const { question } = request.body;

      try {
        // Generate embedding for the question
        const questionEmbedding = await generateEmbedding(question);
        const results = await retrieve(question);

        return {
          question,
          queryEmbedding: questionEmbedding.slice(0, 10), // First 10 values for comparison
          chunks: results.map(r => {
            const meta = r.chunk.metadata;
            // Handle both legal and aid chunks
            if ('law' in meta) {
              const legalMeta = meta as LegalMetadata;
              return {
                score: r.score,
                type: 'legal',
                article: legalMeta.article,
                law: legalMeta.law,
                title: legalMeta.articleTitle,
                text: r.chunk.text.slice(0, 500) + '...',
                // embeddingPrefix removed - not available in ContentChunk
              };
            } else {
              const aidMeta = meta as AidMetadata;
              return {
                score: r.score,
                type: 'aid',
                program: aidMeta.programName,
                section: aidMeta.section,
                text: r.chunk.text.slice(0, 500) + '...',
                // embeddingPrefix removed - not available in ContentChunk
              };
            }
          }),
        };
      } catch (error) {
        request.log.error(error, 'Retrieve failed');
        reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /health - Health check endpoint
   */
  app.get('/health', async () => {
    try {
      const stats = await getStats();
      return {
        status: 'healthy',
        vectorStore: {
          connected: true,
          mode: isLocalMode() ? 'local' : 'chroma',
          documentCount: stats.count,
        },
      };
    } catch {
      return {
        status: 'degraded',
        vectorStore: {
          connected: false,
          documentCount: 0,
        },
      };
    }
  });

  /**
   * GET /debug - Comprehensive debug information
   * Shows version, config, and sample embeddings for prod/local comparison
   */
  app.get('/debug', async (request, reply) => {
    try {
      const stats = await getStats();

      // Get sample embeddings from a test query
      const testEmbedding = await generateEmbedding('test');
      const sampleChunks = await queryChunks(testEmbedding, 3);

      return {
        version: {
          commit: process.env['RAILWAY_GIT_COMMIT_SHA'] || 'unknown',
          buildTime: process.env['BUILD_TIME'] || 'unknown',
          nodeVersion: process.version,
        },
        config: {
          chatModel: ragConfig.chatModel,
          embeddingModel: ragConfig.embeddingModel,
          temperature: 0.3,
          maxChunks: ragConfig.maxChunks,
          similarityThreshold: ragConfig.similarityThreshold,
        },
        vectorStore: {
          mode: isLocalMode() ? 'local' : 'chroma',
          documentCount: stats.count,
          sampleEmbeddings: sampleChunks.slice(0, 2).map(c => ({
            id: c.chunk.id,
            type: 'programName' in c.chunk.metadata ? 'aid' : 'legal',
            score: c.score, // Add score instead - more useful for debugging
          })),
        },
        environment: {
          hasOpenAIKey: !!process.env['OPENAI_API_KEY'],
          openAIKeyPrefix: process.env['OPENAI_API_KEY']?.slice(0, 10) || 'missing',
          platform: process.platform,
        },
      };
    } catch (error) {
      request.log.error(error, 'Debug endpoint failed');
      reply.status(500).send({
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /stats - Get system statistics
   */
  app.get('/stats', async () => {
    const stats = await getStats();
    return {
      documentCount: stats.count,
      models: {
        embedding: process.env['EMBEDDING_MODEL'] ?? 'text-embedding-3-small',
        chat: process.env['CHAT_MODEL'] ?? 'gpt-4-turbo-preview',
      },
    };
  });

  // ============================================
  // Resources endpoints
  // ============================================

  /**
   * GET /resources - List active housing programs
   */
  app.get<{
    Querystring: { status?: string; region?: string };
  }>('/resources', async (request) => {
    const { status, region } = request.query;

    const programs = getPrograms({
      status: status as 'open' | 'closed' | 'upcoming' | undefined,
      region: region as 'catalunya' | 'barcelona' | 'spain' | undefined,
    });

    return {
      count: programs.length,
      programs,
    };
  });

  /**
   * GET /resources/deadlines - Programs with upcoming deadlines
   */
  app.get('/resources/deadlines', async () => {
    const programs = getUpcomingDeadlines();
    return {
      count: programs.length,
      programs,
    };
  });

  /**
   * GET /resources/:id - Get specific program
   */
  app.get<{ Params: { id: string } }>('/resources/:id', async (request, reply) => {
    const program = getProgramById(request.params.id);

    if (!program) {
      reply.status(404).send({ error: 'Program not found' });
      return;
    }

    return program;
  });
}
