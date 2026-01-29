/**
 * RAG Pipeline
 *
 * Main orchestration module that combines:
 * 1. Retrieval: Find relevant legal chunks
 * 2. Generation: Build prompt and generate response
 * 3. Validation: Verify citations and confidence
 */

import OpenAI from 'openai';
import { openaiConfig, ragConfig } from './config.js';
import { generateEmbedding } from './ingestion/index.js';
import { queryChunks, rerank, filterByThreshold } from './retrieval/index.js';
import {
  buildPrompt,
  buildStandaloneQuestion,
  buildValidatedResponse,
  addWarningsIfNeeded,
} from './generation/index.js';
import type { ChatMessage, ChatResponse, RetrievalResult } from './types.js';

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
});

/**
 * Main RAG query function
 */
export async function query(
  question: string,
  conversationHistory?: ChatMessage[]
): Promise<ChatResponse> {
  // Step 1: Prepare the question (resolve references from history)
  const standaloneQuestion = buildStandaloneQuestion(
    question,
    conversationHistory ?? []
  );

  // Step 2: Generate embedding for the question
  const questionEmbedding = await generateEmbedding(standaloneQuestion);

  // Step 3: Retrieve relevant chunks
  let retrievedChunks = await queryChunks(
    questionEmbedding,
    ragConfig.maxChunks * 2 // Retrieve more, then filter
  );

  // Step 4: Rerank and filter
  retrievedChunks = rerank(retrievedChunks, standaloneQuestion);
  retrievedChunks = filterByThreshold(retrievedChunks, ragConfig.similarityThreshold);
  retrievedChunks = retrievedChunks.slice(0, ragConfig.maxChunks);

  // Step 5: Build prompt with context
  const messages = buildPrompt(question, retrievedChunks, conversationHistory);

  // Step 6: Generate response
  const completion = await openai.chat.completions.create({
    model: ragConfig.chatModel,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: 0.3, // Low temperature for factual responses
    max_tokens: 1000,
  });

  const answer = completion.choices[0]?.message?.content ?? 'Error generando respuesta.';

  // Step 7: Validate and build response
  let response = buildValidatedResponse(answer, retrievedChunks);
  response = addWarningsIfNeeded(response);

  return response;
}

/**
 * Query with streaming support
 */
export async function queryStream(
  question: string,
  conversationHistory?: ChatMessage[],
  onChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  // Steps 1-5 same as above
  const standaloneQuestion = buildStandaloneQuestion(
    question,
    conversationHistory ?? []
  );
  const questionEmbedding = await generateEmbedding(standaloneQuestion);

  let retrievedChunks = await queryChunks(
    questionEmbedding,
    ragConfig.maxChunks * 2
  );
  retrievedChunks = rerank(retrievedChunks, standaloneQuestion);
  retrievedChunks = filterByThreshold(retrievedChunks, ragConfig.similarityThreshold);
  retrievedChunks = retrievedChunks.slice(0, ragConfig.maxChunks);

  const messages = buildPrompt(question, retrievedChunks, conversationHistory);

  // Step 6: Generate with streaming
  const stream = await openai.chat.completions.create({
    model: ragConfig.chatModel,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: 0.3,
    max_tokens: 1000,
    stream: true,
  });

  let fullAnswer = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullAnswer += content;
      onChunk?.(content);
    }
  }

  // Step 7: Validate
  let response = buildValidatedResponse(fullAnswer, retrievedChunks);
  response = addWarningsIfNeeded(response);

  return response;
}

/**
 * Get retrieval results without generation (for debugging)
 */
export async function retrieve(
  question: string
): Promise<RetrievalResult[]> {
  const questionEmbedding = await generateEmbedding(question);

  let retrievedChunks = await queryChunks(
    questionEmbedding,
    ragConfig.maxChunks * 2
  );
  retrievedChunks = rerank(retrievedChunks, question);
  retrievedChunks = filterByThreshold(retrievedChunks, ragConfig.similarityThreshold);

  return retrievedChunks.slice(0, ragConfig.maxChunks);
}
