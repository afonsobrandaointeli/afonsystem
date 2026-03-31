/**
 * Unit tests for semantic-analyzer.js
 * Tests mock mode (no API key needed).
 */

const { generateMockResponse, buildPrompt } = require('../services/semantic-analyzer');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

// ─── Test mock response for excellent document ──────────────────────────────

console.log('\n=== Mock response: excellent doc ===');

const deliverable = {
  id: 'D1',
  name: 'Contextualização e Especificação de Requisitos',
  type: 'document',
  path: 'docs/Contextualizacao.md',
  expected_sections: ['Cenário Organizacional', 'Requisitos Funcionais', 'Requisitos Não Funcionais'],
  evaluation_criteria: 'RFs com rastreabilidade, RNFs com justificativa técnica.',
  weight: 2,
};

const excellentStructural = {
  deliverable_id: 'D1',
  structural_completeness: 1.0,
  sections_found: ['Cenário Organizacional', 'Requisitos Funcionais', 'Requisitos Não Funcionais'],
  sections_missing: [],
  section_details: [
    { section: 'Cenário Organizacional', present: true, is_substantive: true, word_count: 200 },
    { section: 'Requisitos Funcionais', present: true, is_substantive: true, word_count: 300 },
    { section: 'Requisitos Não Funcionais', present: true, is_substantive: true, word_count: 150 },
  ],
  placeholders_detected: [],
  word_count: 650,
};

const mockExcellent = generateMockResponse(deliverable, excellentStructural);

assert(mockExcellent._mock === true, 'Mock flag is set');
assert(mockExcellent.section_assessments.length === 3, `Has 3 section assessments (got ${mockExcellent.section_assessments.length})`);
assert(mockExcellent.overall_semantic_score >= 0.7, `Excellent doc score >= 0.7 (got ${mockExcellent.overall_semantic_score})`);
assert(mockExcellent.strengths.length > 0, `Has strengths`);
assert(mockExcellent.weaknesses.length === 0, `No weaknesses for excellent doc (got ${mockExcellent.weaknesses.length})`);

// ─── Test mock response for poor document ───────────────────────────────────

console.log('\n=== Mock response: poor doc ===');

const poorStructural = {
  deliverable_id: 'D1',
  structural_completeness: 0.0,
  sections_found: ['Cenário Organizacional'],
  sections_missing: ['Requisitos Funcionais', 'Requisitos Não Funcionais'],
  section_details: [
    { section: 'Cenário Organizacional', present: true, is_substantive: false, word_count: 10 },
    { section: 'Requisitos Funcionais', present: false, is_substantive: false, word_count: 0 },
    { section: 'Requisitos Não Funcionais', present: false, is_substantive: false, word_count: 0 },
  ],
  placeholders_detected: ['TODO'],
  word_count: 30,
};

const mockPoor = generateMockResponse(deliverable, poorStructural);

assert(mockPoor.overall_semantic_score < 0.3, `Poor doc score < 0.3 (got ${mockPoor.overall_semantic_score})`);
assert(mockPoor.weaknesses.length > 0, `Has weaknesses`);
assert(mockPoor.recommended_actions.length > 0, `Has recommended actions`);

// ─── Test prompt builder ────────────────────────────────────────────────────

console.log('\n=== Prompt builder ===');

const prompt = buildPrompt(deliverable, excellentStructural, [
  { name: 'Alice', lines: 200, commits: 5, percentage: 60 },
  { name: 'Bruno', lines: 130, commits: 3, percentage: 40 },
]);

assert(prompt.includes('Contextualização e Especificação'), 'Prompt includes deliverable name');
assert(prompt.includes('Cenário Organizacional'), 'Prompt includes expected sections');
assert(prompt.includes('RFs com rastreabilidade'), 'Prompt includes evaluation criteria');
assert(prompt.includes('Alice'), 'Prompt includes contributor names');
assert(prompt.includes('JSON'), 'Prompt asks for JSON output');
assert(prompt.length > 500, `Prompt has substantial length (${prompt.length} chars)`);

// ─── Test synthesis score computation ───────────────────────────────────────

console.log('\n=== Synthesis score computation ===');

const { computeDeliverableScore } = require('../services/synthesis');

const score1 = computeDeliverableScore(
  { structural_completeness: 0.8 },
  { overall_semantic_score: 0.7 },
  { composite_score: 0.6 },
  0.9,
  { structural_conformance: 0.25, semantic_quality: 0.35, commit_discipline: 0.20, quantitative_cep: 0.20 }
);

assert(score1.final_score > 0, `Synthesis produces non-zero score (got ${score1.final_score})`);
assert(score1.final_score <= 1.0, `Score is <= 1.0 (got ${score1.final_score})`);
assert(score1.structural_score === 0.8, 'Structural score preserved');
assert(score1.semantic_score === 0.7, 'Semantic score preserved');

// Expected: 0.8*0.25 + 0.7*0.35 + 0.6*0.20 + 0.9*0.20 = 0.20 + 0.245 + 0.12 + 0.18 = 0.745
const expected = 0.20 + 0.245 + 0.12 + 0.18;
assert(Math.abs(score1.final_score - expected) < 0.01, `Score matches manual calc: ${expected.toFixed(2)} (got ${score1.final_score})`);

// Edge: all zeros
const score0 = computeDeliverableScore(null, null, null, 0, undefined);
assert(score0.final_score === 0, `All zeros = 0 score`);

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
