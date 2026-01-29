# ADR-003: Mandatory Citations in Responses

## Status
Accepted

## Context

LLMs can "hallucinate" - generate plausible-sounding but incorrect information. In legal domains, this is particularly dangerous:

- A hallucinated article number could mislead a user
- Incorrect legal advice could have serious consequences
- Users may trust AI responses without verification

Standard RAG provides context but doesn't guarantee the model uses it correctly.

## Decision

Implement **mandatory citations** through prompt engineering and response validation:

### 1. Prompt Instructions

```typescript
const SYSTEM_PROMPT = `
REGLAS ESTRICTAS:
1. SOLO responde basándote en el CONTEXTO LEGAL proporcionado
2. SIEMPRE cita la fuente usando el formato: [Artículo X, Ley Y]
3. Si la información NO está en el contexto, responde:
   "No dispongo de información sobre este tema..."
`;
```

### 2. Response Validation

```typescript
// Extract citations from response
const citations = extractCitations(response);
// "[Artículo 9, LAU]" → { article: "Artículo 9", law: "LAU" }

// Validate against retrieved context
const { valid, invalid } = validateCitations(citations, context);
```

### 3. Citation Format

Standardized format that's:
- Easy to parse with regex
- Familiar to legal professionals
- Verifiable against source documents

```
[Artículo 9, LAU]
[Art. 21, Ley 29/1994]
```

## Consequences

### Positive
- **Reduced hallucinations**: Model forced to ground responses in context
- **Verifiability**: Users can check the cited articles
- **Trust**: Clear sourcing increases user confidence
- **Legal defensibility**: Citations provide audit trail

### Negative
- **Verbose responses**: Citations add length
- **Prompt tokens**: Instructions consume context window
- **Not foolproof**: Model can still cite wrong articles or misinterpret

### Validation Results

| Response Type | Confidence | Action |
|---------------|------------|--------|
| Has valid citations, high retrieval score | `high` | Return as-is |
| Has citations, medium retrieval score | `medium` | Return as-is |
| No citations or low score | `low` | Add warning |
| "No tengo información" | `none` | Recommend professional |

## References

- `src/generation/promptBuilder.ts` - System prompt with citation rules
- `src/generation/responseValidator.ts` - Citation extraction and validation
- [Reducing Hallucinations in LLMs](https://www.anthropic.com/research/reducing-hallucinations) - Research
