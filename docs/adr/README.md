# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for LegalBot RAG.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences.

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [ADR-001](001-semantic-chunking-by-article.md) | Semantic Chunking by Article | Accepted | 2025-01-21 |
| [ADR-002](002-chroma-vector-store.md) | Chroma as Vector Store | Accepted | 2025-01-21 |
| [ADR-003](003-mandatory-citations.md) | Mandatory Citations in Responses | Accepted | 2025-01-21 |
| [ADR-004](004-confidence-levels.md) | Response Confidence Levels | Accepted | 2025-01-21 |
| [ADR-005](005-tech-stack.md) | Technology Stack Selection | Accepted | 2025-01-21 |
| [ADR-006](006-reranking-strategy.md) | Keyword-based Reranking | Accepted | 2025-01-21 |

## ADR Template

```markdown
# ADR-XXX: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this change?
```
