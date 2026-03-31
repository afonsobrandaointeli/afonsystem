# Semantic Conformance Architecture

## Overview

The semantic conformance layer extends the existing CEP-based quantitative evaluation with three new capabilities:

1. **Structural verification** of document deliverables (deterministic)
2. **Commit diff analysis** for code quality metrics (deterministic)
3. **Semantic analysis** of document content via LLM (Anthropic Claude API)

These are combined in a **4-phase pipeline** that produces a composite score per deliverable per project.

## Pipeline Phases

```
Phase 1: Event Acquisition (existing)
  └─ GitLab sync → commits, MRs, issues, members

Phase 2: Quantitative CEP (existing)
  └─ Conformance distance, 5 CEP patterns → daily_conformance

Phase 2a: Structural Check (NEW — deterministic)
  └─ File existence, section matching, word count, placeholder detection

Phase 2b: Diff Analysis (NEW — deterministic)
  └─ Atomicity, test ratio, churn, contributor balance, 4 new CEP patterns

Phase 3: Semantic Analysis (NEW — LLM)
  └─ Document content vs metaproject criteria → per-section quality scores

Phase 4: Synthesis (NEW — deterministic)
  └─ Weighted composite of structural + semantic + diff + CEP → final score
```

## New MongoDB Collections

| Collection | Purpose | Key Fields |
|---|---|---|
| `file_snapshots` | Document content snapshots | project_id, sprint_id, path, content, headings, word_count |
| `commit_diffs` | Per-commit file-level diff stats | project_id, sha, files_changed[], total_lines |
| `semantic_assessments` | LLM analysis results | project_id, sprint_id, deliverable_id, section_assessments[], overall_semantic_score |
| `deliverable_conformance` | Composite score per deliverable | project_id, sprint_id, deliverable_id, structural/semantic/commit/cep scores, final_score |
| `project_conformance_summary` | Weighted score across all deliverables | project_id, sprint_id, weighted_score, deliverables[] |

## New API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/deliverable-conformance` | Per-deliverable composite scores |
| `GET /api/deliverable-conformance/summary` | Project ranking by weighted score |
| `GET /api/semantic-assessments` | LLM analysis results per deliverable |
| `GET /api/diff-metrics?project_id=N` | Commit quality metrics for a project |

## Score Composition

Default weights (configurable per sprint via `assessment_weights`):

```
final_score = structural_conformance × 0.25
            + semantic_quality       × 0.35
            + commit_discipline      × 0.20
            + quantitative_cep       × 0.20
```

Project-level weighted score:

```
weighted_score = Σ(deliverable_score × deliverable_weight) / Σ(weights)
```

## LLM Integration

- **Provider:** Anthropic Claude API
- **Default model:** `claude-haiku-4-5-20251001` (fast, cheap — ~$0.40/day for 25 calls)
- **Fallback:** Mock mode when `ANTHROPIC_API_KEY` is not set
- **Input:** Document content + expected sections + evaluation criteria + contribution data
- **Output:** Structured JSON with per-section assessments, scores, strengths/weaknesses

## New CEP Patterns (from diff analysis)

| Pattern | Severity | Trigger |
|---|---|---|
| `MONOLITHIC_COMMIT` | warning | Commit with >300 lines changed |
| `NO_TESTS` | warning | Code in src/ with zero test commits |
| `CHURN_HOTSPOT` | warning | Same file edited >5× in sprint |
| `LOAD_IMBALANCE` | warning | 1 member contributing >70% of lines |

## Sprint Descriptor Extensions

Document deliverables now include:

```javascript
{
  id: 'D1',
  name: 'Contextualização e Especificação de Requisitos',
  type: 'document',
  path: 'docs/Contextualizacao.md',        // expected file path
  expected_sections: [                       // headings to verify
    'Cenário Organizacional',
    'Requisitos Funcionais (RFs)',
    ...
  ],
  evaluation_criteria: '...',               // rubric text for LLM
  weight: 2,                                // for weighted average
}
```
