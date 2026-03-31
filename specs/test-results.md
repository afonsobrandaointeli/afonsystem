# Test Results — Semantic Conformance Layer

## Unit Tests (no MongoDB required)

### test-structural-checker.js — 17 passed, 0 failed

Tests:
- `extractSections`: heading extraction, word count, empty docs
- `matchSection`: exact match, substring, accent-insensitive, word overlap, no match
- Placeholder detection: TODO, "em desenvolvimento"

### test-diff-analyzer.js — 24 passed, 0 failed

Tests:
- Empty diffs: zero scores, no patterns
- Healthy project: atomic commits, tests present, balanced contributors → high score
- Problematic project: monolithic commits, no tests, single contributor → low score, 3 patterns detected
- Churn detection: file edited 8× → CHURN_HOTSPOT pattern

### test-semantic-analyzer.js — 20 passed, 0 failed

Tests:
- Mock response for excellent doc: score ≥ 0.7, has strengths, no weaknesses
- Mock response for poor doc: score < 0.3, has weaknesses, has recommended actions
- Prompt builder: includes all required fields (deliverable name, sections, criteria, contributors)
- Synthesis score computation: matches manual calculation (0.8×0.25 + 0.7×0.35 + 0.6×0.20 + 0.9×0.20 = 0.74)

**Total: 61 unit tests, 0 failures**

## Integration Test (with MongoDB)

Pipeline executed successfully with 5 simulated teams:

```
Final Ranking:
  1. Team Alpha (consistent):    0.87
  2. Team Gamma (ghost_member):  0.60
  3. Team Epsilon (recovering):  0.56
  4. Team Delta (mr_bottleneck): 0.21
  5. Team Beta (cramming):       0.09
```

### Validation

| Team | Expected Quality | Structural Score | Semantic Score | Composite | Correct? |
|------|-----------------|-----------------|----------------|-----------|----------|
| Alpha | excellent | 1.00 | 0.75 | 0.87 | ✓ Highest |
| Beta | poor | 0.00 | 0.10 | 0.09 | ✓ Lowest |
| Gamma | partial | 0.40-0.60 | 0.55 | 0.60 | ✓ Middle |
| Delta | late | 0.00-0.20 | 0.25 | 0.21 | ✓ Low |
| Epsilon | improving | 0.40-0.60 | 0.55 | 0.56 | ✓ Middle |

### API Endpoints Verified

- `GET /api/deliverable-conformance/summary` → 5 projects ranked
- `GET /api/semantic-assessments?project_id=1002` → 4 deliverables with per-section feedback
- `GET /api/diff-metrics?project_id=1002` → MONOLITHIC_COMMIT + NO_TESTS patterns detected

### LLM Mode

Tested in mock mode (no ANTHROPIC_API_KEY). Mock scores are derived from structural results. When API key is provided, Claude Haiku evaluates actual document content against metaproject criteria.
