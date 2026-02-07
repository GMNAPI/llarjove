# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**LlarJove** is a RAG-powered chatbot to help young people (18-35) in Catalunya find housing. It provides information about public aids, tenant rights, and connects users with active programs.

**Target audience**: Young Catalans looking for housing assistance
**Geographic scope**: Catalunya (pilot), expandable
**Tone**: Accessible, friendly, practical - not legal jargon

**Architecture**: Monorepo with backend (Node.js + Fastify + RAG) and frontend (React 19 + Vite 6 + Tailwind v4) in separate directories.

## Commands

### Backend (API + RAG)
```bash
# Development
pnpm dev                    # Start server with hot reload (tsx watch)
pnpm build                  # Compile TypeScript to dist/

# Testing
pnpm test                   # Run backend tests
pnpm test:watch             # Watch mode

# Data ingestion
docker compose up -d chroma # Start vector database
pnpm ingest                 # Ingest documents into Chroma
pnpm ingest --clear         # Clear and re-ingest
```

### Frontend (React)
```bash
# Development
pnpm dev:web                # Start dev server (http://localhost:5173)
pnpm build:web              # Production build

# Testing
pnpm test:web               # Run frontend tests (59 tests with vitest)
```

## Architecture

### Frontend (`web/`)

**Stack**: React 19 + Vite 6 + TypeScript + Tailwind CSS v4

**Structure**:
- `src/components/ui/`: 5 reusable components (Button, Card, Input, Badge, Link)
- `src/components/BrandShowcase.tsx`: Living style guide
- `src/styles/`: Design tokens (colors, typography, spacing)
- `src/lib/`: Utilities (cn for className merging)

**Design System**:
- **Tokens**: OKLCH colors, Geist font, semantic spacing/radii
- **Pattern**: shadcn/ui approach (`:root` CSS vars + `@theme inline`)
- **Testing**: 59 tests with vitest + jsdom + React Testing Library
- **Accessibility**: WCAG 2.1 touch targets (44px), focus-visible rings

### Backend RAG Pipeline (`src/rag.ts`)

```
Question → buildStandaloneQuestion() → generateEmbedding()
         → queryChunks() → rerank() → filterByThreshold()
         → buildPrompt() → OpenAI completion
         → buildValidatedResponse() → addWarningsIfNeeded()
```

**Module Responsibilities**:
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

## Frontend Development

### Component Pattern

All UI components follow this structure:
- Props extend native HTML attributes (`ButtonHTMLAttributes`, etc.)
- Use `forwardRef` for ref forwarding
- Variants defined as `Record<Variant, string>` of Tailwind classes
- `cn()` utility merges class names and resolves Tailwind conflicts
- Comprehensive tests covering variants, states, accessibility

### Adding New Components

1. Create `ComponentName.tsx` in `web/src/components/ui/`
2. Create `ComponentName.test.tsx` with full coverage
3. Export from `web/src/components/ui/index.ts`
4. Add to BrandShowcase for visual reference

### Design Tokens

Located in `web/src/styles/tokens.css`. To modify:
1. Update `:root` CSS variables
2. Ensure `@theme inline` mapping exists
3. Tailwind utilities auto-update (no rebuild needed for runtime changes)
