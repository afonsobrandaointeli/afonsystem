/**
 * Unit tests for structural-checker.js
 * Runs without MongoDB — tests pure functions only.
 */

const { extractSections, matchSection } = require('../services/structural-checker');

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

// ─── Test extractSections ───────────────────────────────────────────────────

console.log('\n=== extractSections ===');

const doc1 = `# Title

Introduction text.

## Section One

Content of section one with multiple lines.
More content here.

## Section Two

Content of section two.

### Subsection

Sub content here.

## Section Three

Final content.
`;

const sections1 = extractSections(doc1);

assert(sections1.length === 4, `Extracts 4 sections (got ${sections1.length})`);
assert(sections1[0].heading === 'Title', `First heading is "Title" (got "${sections1[0].heading}")`);
assert(sections1[1].heading === 'Section One', `Second heading is "Section One"`);
assert(sections1[1].word_count > 5, `Section One has >5 words (got ${sections1[1].word_count})`);
assert(sections1[3].heading === 'Section Three', `Fourth heading is "Section Three"`);

const emptyDoc = '';
const sectionsEmpty = extractSections(emptyDoc);
assert(sectionsEmpty.length === 0, `Empty doc returns 0 sections`);

const noHeadingsDoc = 'Just some text without any headings.';
const sectionsNoH = extractSections(noHeadingsDoc);
assert(sectionsNoH.length === 0, `Doc without headings returns 0 sections`);

// ─── Test matchSection ──────────────────────────────────────────────────────

console.log('\n=== matchSection ===');

const actualSections = [
  { heading: 'Cenário Organizacional e de Governança', word_count: 100, content: 'test' },
  { heading: 'Requisitos Funcionais (RFs)', word_count: 200, content: 'test' },
  { heading: 'Requisitos Não Funcionais (RNFs)', word_count: 150, content: 'test' },
  { heading: 'Backlog Revisado', word_count: 80, content: 'test' },
];

// Exact match
const m1 = matchSection('Backlog Revisado', actualSections);
assert(m1 !== null, 'Exact match: "Backlog Revisado" found');
assert(m1.heading === 'Backlog Revisado', 'Exact match returns correct heading');

// Substring match
const m2 = matchSection('Requisitos Funcionais', actualSections);
assert(m2 !== null, 'Substring match: "Requisitos Funcionais" found');
assert(m2.heading === 'Requisitos Funcionais (RFs)', 'Substring match returns full heading');

// Accent-insensitive match
const m3 = matchSection('Cenario Organizacional e de Governanca', actualSections);
assert(m3 !== null, 'Accent-insensitive match works');

// No match
const m4 = matchSection('Seção Inexistente', actualSections);
assert(m4 === null, 'Non-existing section returns null');

// Word overlap match
const m5 = matchSection('Requisitos Não Funcionais', actualSections);
assert(m5 !== null, 'Word overlap match works for "Requisitos Não Funcionais"');

// ─── Test placeholder detection via section content ─────────────────────────

console.log('\n=== Placeholder detection (via extractSections) ===');

const docWithPlaceholders = `# Documento

## Seção Boa

Este é um conteúdo completo com bastante texto e informações relevantes sobre o projeto.
A equipe realizou um levantamento detalhado e documentou todos os requisitos.

## Seção Placeholder

TODO: preencher esta seção com conteúdo real.

## Seção em Desenvolvimento

Esta seção será completada na próxima sprint. Em desenvolvimento.
`;

const sectionsP = extractSections(docWithPlaceholders);
assert(sectionsP.length === 4, `Extracts 4 sections including title (got ${sectionsP.length})`);
// sectionsP[0] = "Documento" (title), [1] = "Seção Boa", [2] = "Seção Placeholder", [3] = "Seção em Desenvolvimento"
assert(sectionsP[1].word_count > 15, `Good section has >15 words (got ${sectionsP[1].word_count})`);
assert(sectionsP[2].content.includes('TODO'), `Placeholder section contains TODO`);

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
