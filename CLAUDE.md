# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**LlarJove** is a RAG-powered chatbot to help young people (18-35) in Catalunya find housing. It provides information about public aids, tenant rights, and connects users with active programs.

**Target audience**: Young Catalans looking for housing assistance
**Geographic scope**: Catalunya (pilot), expandable
**Tone**: Accessible, friendly, practical - not legal jargon

## Commands

```bash
# Development
pnpm dev                    # Start server with hot reload (tsx watch)
pnpm build                  # Compile TypeScript to dist/

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode

# Data ingestion
docker compose up -d chroma # Start vector database
pnpm ingest                 # Ingest documents into Chroma
pnpm ingest --clear         # Clear and re-ingest
```

## Architecture

### RAG Pipeline Flow (`src/rag.ts`)

```
Question → buildStandaloneQuestion() → generateEmbedding()
         → queryChunks() → rerank() → filterByThreshold()
         → buildPrompt() → OpenAI completion
         → buildValidatedResponse() → addWarningsIfNeeded()
```

### Module Responsibilities

- **ingestion/**: Document loading, semantic chunking, OpenAI embeddings
- **retrieval/**: Chroma vector store operations, keyword-based reranking
- **generation/**: Prompt construction, response validation
- **api/**: Fastify endpoints (`/chat`, `/resources`, `/health`)
- **resources/**: Active programs database with deadlines

### Key Design Patterns

1. **Semantic chunking**: Documents split by sections (requisitos, plazos, documentación) preserving structure for aid programs. Different from legal article chunking.

2. **Deadline awareness**: System knows about active/closed programs and warns about upcoming deadlines.

3. **Practical responses**: Include concrete steps, required documents, and direct links when available.

4. **Bilingual support**: Content in Catalan/Spanish, responses adapt to user's language.

## Content Types

| Type | Chunking Strategy | Metadata |
|------|-------------------|----------|
| Aid programs | By section (requisitos, plazos, docs) | program_name, deadline, amount |
| Tenant rights | By topic/article | law_reference, topic |
| Guides | By step/section | guide_type, difficulty |

## Environment Variables

Required: `OPENAI_API_KEY`

RAG tuning: `MAX_CHUNKS` (default 5), `SIMILARITY_THRESHOLD` (default 0.7)

## Adding New Content

1. Add document to `data/` (appropriate subfolder)
2. Document source in `data/SOURCES.md`
3. Run `pnpm ingest`

## Data Sources

See `data/SOURCES.md` for complete list of official sources:
- Generalitat de Catalunya - Agència de l'Habitatge
- Bono Alquiler Joven (estatal)
- Ajuntament de Barcelona
- LAU (tenant rights)
