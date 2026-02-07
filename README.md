# LlarJove

> Assistent RAG per ajudar joves catalans a trobar habitatge: informació sobre ajudes, drets i recursos.

## Què és LlarJove?

LlarJove és un chatbot que ajuda joves de 18-35 anys a Catalunya a:

- **Trobar ajudes**: Bono Alquiler Joven, ajudes de la Generalitat, ajudes municipals
- **Conèixer els seus drets**: LAU, fiança, actualitzacions de lloguer
- **Connectar amb recursos**: Borsa Jove, HPO, programes actius amb terminis

## Quick Start

### Prerequisits

- Node.js 20+
- pnpm
- OpenAI API key

### Instal·lació

```bash
git clone <repo-url>
cd llarjove
pnpm install

# Configurar entorn
cp .env.example .env
# Editar .env i afegir OPENAI_API_KEY

# Iniciar servidor
pnpm dev
```

### Ús de l'API

```bash
# Preguntar sobre ajudes
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Què és el Bono Alquiler Joven i quins requisits té?"}'

# Preguntar sobre drets
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Quant preavís he de donar per marxar del pis?"}'
```

### Resposta d'exemple

```json
{
  "answer": "El Bono Alquiler Joven és una ajuda de fins a 250€/mes durant 24 mesos per a joves de 18-35 anys. Els requisits principals són:\n\n1. Ingressos ≤ 25.200€ bruts/any\n2. Lloguer ≤ 900€/mes en zones tensionades\n3. No ser propietari d'un altre habitatge\n4. Estar empadronat a l'habitatge\n\n⚠️ Termini 2025: 30 juny - 11 juliol (per ordre d'entrada)\n\n📎 Més info: tramits.gencat.cat",
  "sources": [...],
  "confidence": "high"
}
```

## Preguntes de Demo

| Pregunta | Tema |
|----------|------|
| "Què és el Bono Alquiler Joven?" | Ajudes estatals |
| "Quins requisits necessito per l'ajuda al lloguer?" | Requisits |
| "Quant preavís he de donar per marxar del pis?" | Drets inquilí (LAU) |
| "Qui paga les reparacions del pis?" | Drets inquilí (LAU) |
| "Què és la Borsa Jove d'Habitatge?" | Recursos Catalunya |

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (web/)                                             │
│ React 19 + Vite 6 + Tailwind v4                            │
│ Design System: Brand identity + 5 UI components            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ API BACKEND                                                 │
│ Fastify + RAG Pipeline                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ INGESTA (offline)                                           │
│ Documents → Chunker → Embeddings → Vector Store             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ CONSULTA (runtime)                                          │
│ Pregunta → Embedding → Cerca semàntica → Rerank             │
│ → Prompt amb context → GPT-4 → Resposta validada            │
└─────────────────────────────────────────────────────────────┘
```

## Estructura del Projecte

```
llarjove/
├── web/                 # Frontend (React 19 + Vite 6 + Tailwind v4)
│   ├── src/
│   │   ├── components/  # UI components + Brand showcase
│   │   ├── styles/      # Design tokens (colors, typography)
│   │   └── lib/         # Utilities (cn, etc.)
│   └── tests/           # 59 tests (vitest + testing-library)
├── src/                 # Backend API + RAG
│   ├── ingestion/       # Càrrega i chunking de documents
│   ├── retrieval/       # Vector store i reranking
│   ├── generation/      # Prompts i validació
│   ├── api/             # Endpoints Fastify
│   └── rag.ts           # Pipeline principal
├── data/
│   ├── ajudes/          # Documents sobre ajudes
│   ├── drets/           # Drets de l'inquilí
│   ├── guies/           # Guies pràctiques
│   ├── laws/            # LAU i altres lleis
│   └── SOURCES.md       # Llista de fonts oficials
└── tests/
```

## Fonts de Dades

| Font | Contingut |
|------|-----------|
| [Gencat - Agència Habitatge](https://habitatge.gencat.cat) | Ajudes autonòmiques |
| [Bono Alquiler Joven](https://tramits.gencat.cat) | Ajuda estatal 250€/mes |
| [BCN Joves](https://barcelona.cat/joves) | Recursos Barcelona |
| LAU (Ley 29/1994) | Drets inquilí |

## Configuració

| Variable | Default | Descripció |
|----------|---------|------------|
| `OPENAI_API_KEY` | - | Requerit |
| `MAX_CHUNKS` | 5 | Màx. chunks per consulta |
| `SIMILARITY_THRESHOLD` | 0.7 | Puntuació mínima similitud |

## Endpoints API

| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| POST | `/chat` | Chat principal |
| GET | `/resources` | Programes actius amb terminis |
| GET | `/health` | Health check |

## Desenvolupament

### Backend (API + RAG)
```bash
pnpm dev          # Servidor amb hot reload
pnpm test         # Tests backend
pnpm ingest       # Ingestar documents a Chroma
pnpm build        # Compilar TypeScript
```

### Frontend (React)
```bash
pnpm dev:web      # Dev server (http://localhost:5173)
pnpm test:web     # Tests frontend (59 tests)
pnpm build:web    # Build producció
```

### Brand Design System

El frontend inclou un **design system complet** amb:
- **Design tokens**: Colors OKLCH, tipografia Geist, espaciat, radis
- **5 UI components**: Button, Card, Input, Badge, Link
- **Tailwind v4**: CSS-first configuration amb `@theme inline`
- **Living style guide**: `/web/src/components/BrandShowcase.tsx`

Visita http://localhost:3000 després de `pnpm dev:web` per veure la landing i el showcase.

## Deployment (Railway)

El projecte es desplega com a **dos serveis** a Railway (mateix repo, dos Dockerfiles).

| Servei | Dockerfile | Config | Port |
|--------|------------|--------|------|
| **RAG API** | `Dockerfile` | `railway-api.toml` | `PORT` (assignat per Railway) |
| **Web** | `Dockerfile.web` | `railway-web.toml` | `PORT` (assignat per Railway) |

### Configuració a Railway

1. **Servei RAG API**
   - Build: Dockerfile `./Dockerfile` (o config `railway-api.toml`).
   - Variables: `OPENAI_API_KEY`, `CHROMA_HOST`, `CHROMA_PORT`, `CHROMA_COLLECTION` (si Chroma extern). Railway injecta `PORT`.
   - Health check: `/health`.

2. **Servei Web**
   - Build: Dockerfile `./Dockerfile.web` (o config `railway-web.toml`).
   - Variables: `NEXT_PUBLIC_API_URL` = URL pública del servei RAG API (ex: `https://llarjove-api.up.railway.app`). Railway injecta `PORT`.
   - Health check: `/`.

Cada servei rep un `PORT` dinàmic; no hi ha conflicte de ports.

## Roadmap

- [x] Frontend web accessible - **Design system implementat** (PR #2)
- [ ] Integrar frontend amb API backend
- [ ] Notificacions de terminis propers
- [ ] Integració amb Telegram/WhatsApp
- [ ] Expansió a altres CCAA

## Llicència

MIT

