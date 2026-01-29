# ADR-006: Keyword-based Reranking Strategy

## Status
Accepted

## Context

Vector similarity search (semantic search) sometimes misses results that contain exact query terms. For example:

- Query: "plazo preaviso alquiler"
- Semantic search might return articles about "duración contrato" (related but not exact)
- Better result: Article that literally contains "preaviso"

Production RAG systems often use **hybrid search** (semantic + keyword) or **reranking**.

## Decision

Implement a lightweight **keyword-based reranker** as a post-processing step:

```typescript
function rerank(
  results: RetrievalResult[],
  query: string
): RetrievalResult[] {
  const queryTerms = extractKeyTerms(query);  // Remove stopwords

  return results.map(result => {
    let boost = 0;

    for (const term of queryTerms) {
      // Boost for keyword match in content
      if (result.chunk.text.toLowerCase().includes(term)) {
        boost += 0.1;
      }
      // Extra boost for match in article title
      if (result.chunk.metadata.articleTitle.toLowerCase().includes(term)) {
        boost += 0.15;
      }
    }

    return { ...result, score: Math.min(1, result.score + boost) };
  }).sort((a, b) => b.score - a.score);
}
```

### Spanish Stopwords

```typescript
const stopwords = new Set([
  'el', 'la', 'los', 'las', 'un', 'una',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para',
  'que', 'qué', 'cual', 'cuál', 'como', 'cómo',
  'es', 'son', 'está', 'están', 'hay',
  'y', 'o', 'pero', 'si', 'no',
  'puedo', 'puede', 'debo', 'debe', 'necesito',
  // ... more
]);
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Cohere Rerank API** | State-of-the-art accuracy | Cost, latency, dependency |
| **Cross-encoder model** | Good accuracy | Requires ML infrastructure |
| **BM25 hybrid** | Standard approach | Complex scoring combination |
| **Keyword boost (chosen)** | Simple, fast, no deps | Less sophisticated |

## Consequences

### Positive
- **Zero dependencies**: No external API or model needed
- **Fast**: O(n * m) where n=results, m=query terms
- **Transparent**: Easy to debug and tune
- **Spanish-aware**: Custom stopword list

### Negative
- **Limited sophistication**: No semantic understanding of keywords
- **Manual tuning**: Boost values (0.1, 0.15) are heuristics
- **No cross-lingual**: Only works for Spanish queries

### Future Improvements

1. **Cohere Rerank**: Add as optional enhancement for production
2. **Hybrid search**: Implement BM25 + vector search at retrieval
3. **Query expansion**: Use synonyms for legal terms

### Tuning Guidelines

| Parameter | Current | When to Increase |
|-----------|---------|------------------|
| Content boost | 0.1 | More keyword mismatches |
| Title boost | 0.15 | Title matches underweighted |
| Threshold | 0.7 | Too many irrelevant results |

## References

- `src/retrieval/reranker.ts` - Implementation
- [Cohere Rerank](https://cohere.com/rerank) - Production alternative
- [Hybrid Search Explained](https://weaviate.io/blog/hybrid-search-explained)
