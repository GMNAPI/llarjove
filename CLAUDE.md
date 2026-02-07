# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**LlarJove** is a RAG-powered chatbot to help young people (18-35) in Catalunya find housing. It provides information about public aids, tenant rights, and connects users with active programs.

- **Target audience**: Young Catalans (18-35) looking for housing assistance
- **Geographic scope**: Catalunya (pilot), expandable
- **Tone**: Accessible, friendly, practical - not legal jargon
- **Languages**: Catalan (primary) and Spanish. Responses adapt to user's language.

### Architecture

Monorepo with two independently deployed services:

| Service | Stack | Port (dev) | Dockerfile | Railway config |
|---------|-------|------------|------------|----------------|
| Backend (API + RAG) | Node.js + Fastify + OpenAI | 3000 | `Dockerfile` | `railway-api.toml` |
| Frontend (Landing) | Next.js 15 + React 19 + Tailwind v4 | 3001 | `Dockerfile.web` | `railway-web.toml` |

### Production URLs

- **Web (landing)**: `https://llarjove-production.up.railway.app`
- **RAG API / Chat**: `https://llarjove-production-754a.up.railway.app`
- The web's `/chat` route redirects to the RAG API via `CHAT_REDIRECT_URL` env var (runtime, not build-time).

## Commands

### Backend (API + RAG)
```bash
pnpm dev                    # Start server with hot reload (tsx watch) → :3000
pnpm build                  # Compile TypeScript to dist/
pnpm test                   # Run backend tests
pnpm test:watch             # Watch mode

# Data ingestion (requires OPENAI_API_KEY in .env)
docker compose up -d chroma # Start Chroma vector database
pnpm ingest                 # Ingest documents into Chroma (or local JSON if Chroma unavailable)
pnpm ingest --clear         # Clear and re-ingest all documents
```

### Frontend (web/)
```bash
pnpm dev:web                # Start Next.js dev server → :3001
pnpm build:web              # Production build (standalone output)
pnpm test:web               # Run frontend tests (59 tests with vitest)
```

### CI
```bash
pnpm ci                     # typecheck + test + build (backend)
```

## Project Structure

```
llarjove/
├── src/                            # Backend (Fastify API + RAG pipeline)
│   ├── index.ts                    # Server entry point (Fastify, CORS, routes, vector store init)
│   ├── config.ts                   # Env config (server, OpenAI, RAG, Chroma)
│   ├── types.ts                    # All TypeScript types/interfaces
│   ├── rag.ts                      # Main RAG pipeline orchestrator
│   ├── api/
│   │   └── chat.ts                 # REST endpoints: /chat, /retrieve, /health, /stats, /resources
│   ├── ingestion/
│   │   ├── documentLoader.ts       # Load .txt/.pdf from filesystem
│   │   ├── chunker.ts              # Legal doc chunking (by article)
│   │   ├── aidChunker.ts           # Aid program chunking (by ## section)
│   │   └── embedder.ts             # OpenAI embedding generation (text-embedding-3-small)
│   ├── retrieval/
│   │   ├── vectorStore.ts          # Chroma client with local JSON fallback
│   │   ├── localVectorStore.ts     # JSON-based vector store (cosine similarity)
│   │   └── reranker.ts             # Keyword reranking + threshold filtering
│   ├── generation/
│   │   ├── promptBuilder.ts        # System prompt, context formatting, history condensation
│   │   └── responseValidator.ts    # Citation extraction, confidence scoring, warnings
│   ├── resources/
│   │   └── programs.ts             # Active housing programs DB (Bono Joven, Borsa Jove, etc.)
│   ├── scripts/
│   │   └── ingest.ts               # CLI: pnpm ingest [--clear]
│   └── public/
│       └── index.html              # Chat UI (served at / by the backend)
│
├── web/                            # Frontend (Next.js 15 landing page)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (Geist font, lang="ca", global CSS)
│   │   │   ├── page.tsx            # Landing page (hero, features, FAQ, waitlist)
│   │   │   ├── WaitlistForm.tsx    # Waitlist form (NOT connected to backend yet)
│   │   │   └── chat/
│   │   │       └── route.ts        # GET /chat → redirect to CHAT_REDIRECT_URL (runtime)
│   │   ├── components/
│   │   │   ├── ui/                 # 5 UI primitives (Button, Card, Input, Badge, Link)
│   │   │   └── BrandShowcase.tsx   # Living style guide
│   │   ├── lib/
│   │   │   └── cn.ts              # clsx + tailwind-merge utility
│   │   ├── styles/
│   │   │   ├── tokens.css         # Design tokens (OKLCH colors, radii, shadows)
│   │   │   └── fonts.css          # Geist font imports
│   │   └── index.css              # @theme inline + global styles
│   ├── next.config.ts             # Standalone output, TS errors ignored
│   ├── package.json               # Next.js 15, React 19, Tailwind v4
│   └── vitest.config.ts           # jsdom environment, React plugin
│
├── data/                           # Documents for RAG ingestion
│   ├── laws/                       # Legal: LAU.txt, LPH.txt
│   ├── ajudes/                     # Aids: 5 program docs (Bono Joven, Borsa Jove, etc.)
│   ├── vector_store.json           # Pre-built local vector store (86 chunks, committed to git)
│   └── SOURCES.md                  # Official data source documentation
│
├── docs/adr/                       # 6 Architecture Decision Records
├── tests/                          # Backend tests (aidChunker, chunker, responseValidator)
│
├── Dockerfile                      # Backend: multi-stage, copies data/ for local vector store
├── Dockerfile.web                  # Frontend: multi-stage, standalone Next.js
├── docker-compose.yml              # Chroma vector DB service
├── railway-api.toml                # Railway: backend deploy config
├── railway-web.toml                # Railway: frontend deploy config
├── .env.example                    # Env template
└── .github/workflows/ci.yml       # CI: typecheck → test → build
```

## Backend Architecture

### RAG Pipeline (`src/rag.ts`)

```
User Question
  → buildStandaloneQuestion() (resolve history references)
  → generateEmbedding() (OpenAI text-embedding-3-small)
  → queryChunks() (Chroma or local JSON, retrieve 2× maxChunks)
  → rerank() (keyword boost +0.1 text, +0.15 title/section)
  → filterByThreshold() (default 0.65)
  → slice(0, maxChunks) (default 5)
  → buildPrompt() (system prompt in Catalan, context with citations)
  → OpenAI gpt-4-turbo-preview (temp 0.3, max 1000 tokens)
  → buildValidatedResponse() (extract citations, determine confidence)
  → addWarningsIfNeeded() (low → append note, none → replace with fallback)
```

### Confidence Levels
- **high**: top score ≥ 0.8 AND citations found
- **medium**: avg score ≥ 0.6 AND citations found
- **low**: citations but low scores → appends warning note
- **none**: no chunks retrieved OR response says "no info" → replaces answer with "No he trobat informació rellevant..."

### API Endpoints (src/api/chat.ts)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /chat | Main RAG chat (supports `stream: true` for SSE) |
| POST | /retrieve | Debug: retrieval without generation |
| GET | /health | Vector store mode + document count |
| GET | /stats | Document count + model names |
| GET | /resources | Active housing programs (filter by status/region) |
| GET | /resources/deadlines | Programs with upcoming deadlines |
| GET | /resources/:id | Specific program by ID |

### Vector Store

Two modes (auto-fallback):
1. **Chroma** (when `CHROMA_HOST` available): production-grade vector DB
2. **Local JSON** (`data/vector_store.json`): development fallback, committed to git

The local store uses `import.meta.url` to resolve the path from the module directory (not CWD), so it works in Docker where the compiled JS is in `dist/retrieval/`.

### Data Documents

| Directory | Contents | Chunking | Chunks |
|-----------|----------|----------|--------|
| `data/laws/` | LAU.txt, LPH.txt | By article (regex) | 37 |
| `data/ajudes/` | 5 aid programs | By ## section | 49 |
| **Total** | | | **86** |

After modifying documents: `pnpm ingest --clear` (needs `OPENAI_API_KEY`).
If Chroma is not running, ingestion falls back to local JSON automatically.
**Important**: Commit `data/vector_store.json` after re-ingestion so production (which has no Chroma) gets the updated data.

## Frontend Architecture

### Stack
- **Next.js 15** (App Router, standalone output)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (PostCSS plugin, `@theme inline`)
- **Geist** font family

### Design System

**Tokens** (`web/src/styles/tokens.css` + `web/src/index.css`):
- Colors: OKLCH color space. Primary = teal (`oklch(0.556 0.135 181)`)
- Semantic colors: foreground, muted-foreground, border, input, ring, card, destructive
- Radii: sm (0.5rem) → full (9999px)
- Shadows: sm, md

**UI Components** (`web/src/components/ui/`):
- `Button` — 5 variants (primary, secondary, outline, destructive, ghost), 3 sizes
- `Card` — with CardHeader, CardContent, CardFooter
- `Input` — with error state
- `Badge` — 4 variants (default, secondary, outline, destructive)
- `Link` — auto-detects external links, adds target/rel

All components use `forwardRef`, extend native HTML attributes, use `cn()` for class merging, and have comprehensive tests.

### Pages

- **`/`** — Landing page (hero, 3-step explainer, benefits, sources, privacy, FAQ, waitlist form)
- **`/chat`** — Route handler that redirects to backend chat UI via `CHAT_REDIRECT_URL`

### Key Files

- **`page.tsx`**: Full landing page with sections. Links to `/chat` for "Probar el chat" / "Probar el asistente" CTAs.
- **`WaitlistForm.tsx`**: Form with email, location, profile, and privacy checkbox. Currently prevents default submission (no backend integration).
- **`chat/route.ts`**: Runtime redirect to backend. Reads `CHAT_REDIRECT_URL` or `NEXT_PUBLIC_API_URL` from `process.env`. Falls back to homepage using `x-forwarded-host` headers.

## Environment Variables

### Backend (.env)
| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | (required) | OpenAI API key |
| `PORT` | 3000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `EMBEDDING_MODEL` | text-embedding-3-small | Embedding model |
| `CHAT_MODEL` | gpt-4-turbo-preview | Chat completion model |
| `MAX_CHUNKS` | 5 | Max context chunks |
| `SIMILARITY_THRESHOLD` | 0.65 | Min similarity for retrieval |
| `CHROMA_HOST` | localhost | Chroma server host |
| `CHROMA_PORT` | 8000 | Chroma server port |
| `CHROMA_COLLECTION` | legal_docs | Chroma collection name |

### Frontend (Railway env vars for web service)
| Variable | Purpose |
|----------|---------|
| `CHAT_REDIRECT_URL` | Backend URL for /chat redirect (runtime, NOT build-time) |
| `NEXT_PUBLIC_API_URL` | Fallback for CHAT_REDIRECT_URL |

## Deployment (Railway)

Two services from the same repo:
- **API service**: Uses `Dockerfile`, configured in `railway-api.toml`. Has `OPENAI_API_KEY`.
- **Web service**: Uses `Dockerfile.web`, configured in `railway-web.toml`. Has `CHAT_REDIRECT_URL`.

The API service uses the local JSON vector store (no Chroma in Railway). The `data/vector_store.json` must be committed with all chunks for production to work.

## Adding New Content

1. Add document to `data/laws/` or `data/ajudes/`
2. Document source in `data/SOURCES.md`
3. Run `pnpm ingest --clear` (needs `OPENAI_API_KEY`, Chroma optional)
4. Commit `data/vector_store.json` so production gets the new data

## Git Workflow

- Branch naming: `feature/`, `fix/`, `deploy/`, `design/`
- Commits follow conventional commits: `feat()`, `fix()`, `data:`, `chore:`
- PRs against `main`, described with Summary + How to test
- CI runs on push: typecheck → test → build

## Current State & Known Issues

### What works
- RAG chat with 86 chunks (37 legal + 49 aid) answering questions about housing aids, tenant rights
- Landing page with design system, waitlist form UI, chat redirect
- Dual Railway deployment (API + Web)
- Confidence scoring and source citations

### What's missing / needs improvement
- WaitlistForm has no backend (form does nothing)
- No user accounts, no chat history persistence
- No analytics configured
- Mixed Catalan/Spanish copy on landing page
- No SEO meta-description
- No testimonials or social proof
- No monetization model
- No i18n system (hardcoded strings)
- Chat UI (`src/public/index.html`) is basic HTML, not integrated into the Next.js design system
