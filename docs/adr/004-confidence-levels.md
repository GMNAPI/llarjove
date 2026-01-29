# ADR-004: Response Confidence Levels

## Status
Accepted

## Context

Not all RAG responses are equally reliable. Factors affecting quality:

1. **Retrieval quality**: How relevant are the retrieved chunks?
2. **Citation presence**: Did the model cite sources?
3. **Context coverage**: Does the context actually contain the answer?

Users need to know when to trust responses and when to seek human expertise.

## Decision

Implement a **confidence scoring system** with four levels:

```typescript
type Confidence = 'high' | 'medium' | 'low' | 'none';
```

### Scoring Logic

```typescript
function determineConfidence(
  context: RetrievalResult[],
  citations: SourceCitation[],
  responseText: string
): Confidence {
  // No context found
  if (context.length === 0) return 'none';

  // Response says "no information"
  if (responseText.includes('No dispongo de información')) return 'none';

  // No citations (suspicious)
  if (citations.length === 0) return 'low';

  const topScore = context[0]?.score ?? 0;
  const avgScore = average(context.map(c => c.score));

  // High: top chunk very relevant + has citations
  if (topScore >= 0.8 && citations.length > 0) return 'high';

  // Medium: decent relevance + citations
  if (avgScore >= 0.6 && citations.length > 0) return 'medium';

  return 'low';
}
```

### Response Handling by Confidence

| Level | Similarity Score | Citations | User-Facing Action |
|-------|------------------|-----------|-------------------|
| `high` | Top chunk ≥ 0.8 | Present | Return answer |
| `medium` | Average ≥ 0.6 | Present | Return answer |
| `low` | Below threshold | Missing/few | Add warning note |
| `none` | No results | N/A | Recommend professional |

### API Response Format

```json
{
  "answer": "El plazo mínimo es de 5 años...",
  "sources": [
    { "article": "Artículo 9", "law": "LAU", "excerpt": "..." }
  ],
  "confidence": "high"
}
```

## Consequences

### Positive
- **Transparency**: Users know reliability of each response
- **Appropriate escalation**: Low confidence triggers human review
- **Debugging**: Developers can identify retrieval issues
- **Trust calibration**: Users learn when to rely on the system

### Negative
- **Complexity**: Additional logic and testing required
- **Threshold tuning**: May need adjustment per domain
- **User interpretation**: Users may not understand levels

### Future Improvements

1. **ML-based confidence**: Train classifier on user feedback
2. **Per-question confidence**: Some topics inherently harder
3. **Confidence explanations**: "Low because only 1 article found"

## References

- `src/generation/responseValidator.ts` - Confidence calculation
- `src/rag.ts` - Integration with response flow
- [Calibration in ML Systems](https://arxiv.org/abs/1706.04599) - Research on confidence
