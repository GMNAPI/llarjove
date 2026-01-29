# ADR-002: Chroma as Vector Store

## Status
Accepted

## Context

A RAG system needs a vector database to store embeddings and perform similarity search. Options considered:

| Option | Pros | Cons |
|--------|------|------|
| **Pinecone** | Managed, scalable, fast | Cost, vendor lock-in |
| **Weaviate** | Full-featured, GraphQL | Complex setup |
| **pgvector** | PostgreSQL extension, familiar | Requires PostgreSQL |
| **Chroma** | Simple, local-first, good DX | Less mature |
| **FAISS** | Fast, in-memory | No persistence, no metadata filtering |

For a demo/MVP project targeting a technical interview, we need:
1. Quick setup (Docker one-liner)
2. Good developer experience
3. Metadata filtering support
4. Reasonable performance for small datasets

## Decision

Use **Chroma** as the vector store:

```yaml
# docker-compose.yml
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
```

Key features used:
- **Cosine similarity** (`hnsw:space: 'cosine'`)
- **Metadata filtering** (filter by law code)
- **Upsert** (handle document re-ingestion)
- **Persistent storage** via Docker volume

## Consequences

### Positive
- **Zero-config setup**: `docker compose up -d chroma`
- **Good TypeScript SDK**: Native client with types
- **Metadata filtering**: Can filter by `law`, `article`, etc.
- **Local development**: No cloud account or API keys needed
- **Portable**: Same setup works on any machine with Docker

### Negative
- **Less mature**: Fewer production deployments than Pinecone
- **Single-node**: No built-in clustering/replication
- **Docker dependency**: Requires Docker for persistent mode

### Production Considerations

For a production system like MIKE, consider:

1. **Pinecone** for managed scalability
2. **pgvector** if already using PostgreSQL
3. **Weaviate** for advanced features (hybrid search, GraphQL)

Migration path: The `vectorStore.ts` abstraction layer allows swapping backends without changing RAG logic.

## References

- `src/retrieval/vectorStore.ts` - Chroma integration
- `docker-compose.yml` - Chroma service definition
- [Chroma Documentation](https://docs.trychroma.com/)
- [Vector Database Comparison](https://www.superlinked.com/vector-db-comparison)
