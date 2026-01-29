# ADR-005: Technology Stack Selection

## Status
Accepted

## Context

Building a RAG system for Spanish real estate law requires choosing:
- Runtime and language
- Web framework
- LLM provider
- Embedding model
- Testing framework

Key constraints:
1. **Interview demo**: Must match MIKE's stack (Node.js + TypeScript)
2. **Quick development**: Limited time for implementation
3. **Production-ready patterns**: Demonstrate professional code quality

## Decision

### Runtime & Language
**Node.js 20 + TypeScript 5.5**

- Matches MIKE's confirmed stack
- Strong typing for complex data structures
- Modern ESM modules (`"type": "module"`)
- Strict TypeScript config for safety

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Web Framework
**Fastify 4.x**

| Considered | Decision | Reason |
|------------|----------|--------|
| Express | Rejected | Less performant, weaker typing |
| Fastify | **Selected** | Fast, schema validation, good TS support |
| Hono | Rejected | Less mature ecosystem |
| NestJS | Rejected | Overkill for small API |

Key Fastify features used:
- JSON schema validation for request bodies
- Built-in logging (Pino)
- CORS plugin

### LLM Provider
**OpenAI (GPT-4-turbo + text-embedding-3-small)**

- Industry standard
- Excellent Spanish language support
- Function calling for structured outputs
- Streaming support

```typescript
// Models used
const EMBEDDING_MODEL = 'text-embedding-3-small';  // 1536 dims, cheap
const CHAT_MODEL = 'gpt-4-turbo-preview';          // Best reasoning
```

### Testing
**Vitest 2.x**

- Native ESM support
- Compatible with Jest API
- Fast execution
- Good TypeScript integration

## Consequences

### Positive
- **MIKE alignment**: Same stack reduces interview friction
- **Type safety**: Catches errors at compile time
- **Performance**: Fastify is 2-3x faster than Express
- **Modern tooling**: ESM, top-level await, native fetch

### Negative
- **OpenAI dependency**: Vendor lock-in, cost per request
- **Node.js limitations**: Single-threaded, not ideal for CPU-heavy tasks

### Production Considerations

For MIKE's production system:

1. **Multi-model support**: Add Anthropic Claude as fallback
2. **Caching**: Redis for embedding cache, response cache
3. **Rate limiting**: Per-client limits, queue for heavy requests
4. **Observability**: OpenTelemetry for distributed tracing

## References

- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `src/config.ts` - Environment configuration
