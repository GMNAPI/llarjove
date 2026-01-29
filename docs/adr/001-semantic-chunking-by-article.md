# ADR-001: Semantic Chunking by Article

## Status
Accepted

## Context

RAG systems require splitting documents into chunks for embedding and retrieval. The standard approach is **fixed-size token chunking** (e.g., 512 tokens with 50 token overlap).

However, legal documents have a hierarchical structure:
- **Ley** (Law)
  - **Título** (Title)
    - **Capítulo** (Chapter)
      - **Artículo** (Article)

Fixed-size chunking breaks this structure, potentially splitting an article mid-sentence:

```
# Bad: Fixed token chunks
Chunk 1: "...el plazo mínimo de cin"
Chunk 2: "co años, o siete si el arrendador..."
```

This destroys semantic meaning and makes retrieval less accurate for legal queries.

## Decision

We implement **semantic chunking by article**:

1. Parse legal documents using regex to identify article boundaries
2. Each article becomes one chunk, preserving complete legal meaning
3. Include hierarchical context (Título, Capítulo) in chunk metadata
4. Add optional overlap from adjacent articles for cross-article queries

```typescript
// Good: Semantic chunks
{
  id: "LAU-art-9",
  text: "[TÍTULO II] Artículo 9. Plazo mínimo.\n\nLa duración del arrendamiento será...",
  metadata: {
    law: "LAU",
    title: "TÍTULO II",
    article: "Artículo 9",
    articleTitle: "Plazo mínimo"
  }
}
```

## Consequences

### Positive
- **Better retrieval accuracy**: Queries match complete legal concepts
- **Meaningful citations**: Can cite specific articles, not arbitrary text fragments
- **Preserved context**: Article titles and hierarchy provide semantic context
- **Domain alignment**: Matches how lawyers and users think about legal content

### Negative
- **Variable chunk sizes**: Some articles are very long (>2000 tokens), others very short
- **Domain-specific**: Chunking logic only works for Spanish legal document format
- **Regex complexity**: Must handle multiple article formats (Artículo, Art., etc.)

### Mitigations
- For very long articles: Consider sub-chunking by numbered sections within the article
- For other document types: Implement fallback paragraph-based chunking
- Test regex against multiple law formats to ensure coverage

## References

- `src/ingestion/chunker.ts` - Implementation
- [LangChain RecursiveCharacterTextSplitter](https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters/recursive_text_splitter) - Alternative approach
- [Chunking Strategies for LLM Applications](https://www.pinecone.io/learn/chunking-strategies/) - Pinecone guide
