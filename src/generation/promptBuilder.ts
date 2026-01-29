/**
 * Prompt Builder
 *
 * Constructs prompts for LlarJove chatbot.
 * Supports both aid programs and legal documents.
 * Tone: accessible, practical, youth-friendly.
 */

import type { RetrievalResult, ChatMessage, AidMetadata } from '../types.js';

/**
 * System prompt - friendly tone for young people seeking housing help
 */
const SYSTEM_PROMPT = `Ets LlarJove, un assistent que ajuda joves a trobar habitatge a Catalunya.

COM PARLES:
- Llenguatge clar i directe, sense burocràcia innecessària
- Tuteja l'usuari
- Respon en el mateix idioma que et pregunten (català o castellà)

REGLES:
1. NOMÉS respons basant-te en el CONTEXT proporcionat
2. Cita les fonts: [Nom del programa] o [Article X, Llei Y]
3. Si no tens la info, digues: "No tinc informació sobre això. Et recomano consultar directament amb l'Agència de l'Habitatge."
4. Si hi ha TERMINIS propers, destaca'ls amb ⚠️
5. Inclou passos pràctics quan sigui possible

FORMAT:
- Respostes curtes i útils
- Llistes numerades per a passos o requisits
- Si hi ha enllaços oficials al context, inclou-los`;

/**
 * Build the full prompt with context and question
 */
export function buildPrompt(
  question: string,
  retrievedChunks: RetrievalResult[],
  conversationHistory?: ChatMessage[]
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // System message
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPT,
  });

  // Add conversation history (if any, condensed)
  if (conversationHistory && conversationHistory.length > 0) {
    // Only keep last 4 turns to manage context window
    const recentHistory = conversationHistory.slice(-4);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push(msg);
      }
    }
  }

  // Build context from retrieved chunks
  const context = buildContext(retrievedChunks);

  // User message with context
  const userMessage = `CONTEXT:
${context}

---

PREGUNTA:
${question}`;

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

/**
 * Build the context string from retrieved chunks
 * Handles both legal documents and aid programs
 */
function buildContext(chunks: RetrievalResult[]): string {
  if (chunks.length === 0) {
    return '[No s\'ha trobat informació rellevant]';
  }

  return chunks
    .map((result) => {
      const { chunk } = result;
      const meta = chunk.metadata;

      // Check if it's an aid program chunk
      if ('programName' in meta && 'section' in meta) {
        const aidMeta = meta as unknown as AidMetadata;
        const deadlineWarning = aidMeta.deadline ? `\n⚠️ TERMINI: ${aidMeta.deadline}` : '';
        const amount = aidMeta.amount ? `\n💰 Quantia: ${aidMeta.amount}` : '';
        const url = aidMeta.sourceUrl ? `\n🔗 ${aidMeta.sourceUrl}` : '';

        return `📋 [${aidMeta.programName}] - ${aidMeta.section}${deadlineWarning}${amount}${url}

${chunk.text}`;
      }

      // Legal document chunk
      const { article, law, articleTitle } = meta;
      return `⚖️ [${article}, ${law}]${articleTitle ? ` - ${articleTitle}` : ''}

${chunk.text}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Build a condensed version of conversation history for context
 */
export function condenseHistory(history: ChatMessage[]): string {
  if (history.length === 0) return '';

  return history
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content.slice(0, 200)}...`)
    .join('\n');
}

/**
 * Generate a standalone question from conversation context
 * This helps when the user's question references previous messages
 */
export function buildStandaloneQuestion(
  currentQuestion: string,
  history: ChatMessage[]
): string {
  if (history.length === 0) return currentQuestion;

  // Simple heuristic: if question contains pronouns or references (ES/CA),
  // it might need context
  const needsContext = /\b(esto|eso|lo|la|el mismo|anterior|mencionado|això|allò|anterior|esmentat)\b/i.test(currentQuestion);

  if (!needsContext) return currentQuestion;

  // Get the last exchange for context
  const lastAssistantMsg = [...history].reverse().find(m => m.role === 'assistant');
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user');

  if (lastUserMsg) {
    return `Contexto de la pregunta anterior: "${lastUserMsg.content.slice(0, 150)}..."

Pregunta actual: ${currentQuestion}`;
  }

  return currentQuestion;
}
