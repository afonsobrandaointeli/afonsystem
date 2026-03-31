/**
 * Unit tests for diff-analyzer.js
 * Runs without MongoDB — tests computeMetrics directly.
 */

const { computeMetrics } = require('../services/diff-analyzer');

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

// ─── Test empty diffs ───────────────────────────────────────────────────────

console.log('\n=== Empty diffs ===');

const empty = computeMetrics([], []);
assert(empty.total_commits === 0, 'Empty: total_commits = 0');
assert(empty.composite_score === 0, 'Empty: composite_score = 0');
assert(empty.patterns.length === 0, 'Empty: no patterns');

// ─── Test healthy project (atomic commits, tests, balanced) ─────────────────

console.log('\n=== Healthy project ===');

const healthyDiffs = [
  {
    project_id: 1, sha: 'aaa', author_name: 'Alice',
    committed_date: '2026-08-05T10:00:00Z', message: 'feat: add extract module',
    files_changed: [
      { path: 'src/etl/extract.py', additions: 20, deletions: 5, is_test: false, is_doc: false, is_config: false },
      { path: 'tests/test_extract.py', additions: 15, deletions: 0, is_test: true, is_doc: false, is_config: false },
    ],
    total_lines: 40,
  },
  {
    project_id: 1, sha: 'bbb', author_name: 'Bruno',
    committed_date: '2026-08-05T14:00:00Z', message: 'feat: add transform module',
    files_changed: [
      { path: 'src/etl/transform.py', additions: 25, deletions: 3, is_test: false, is_doc: false, is_config: false },
      { path: 'tests/test_transform.py', additions: 18, deletions: 0, is_test: true, is_doc: false, is_config: false },
    ],
    total_lines: 46,
  },
  {
    project_id: 1, sha: 'ccc', author_name: 'Carol',
    committed_date: '2026-08-06T09:00:00Z', message: 'docs: update requirements',
    files_changed: [
      { path: 'docs/requirements.md', additions: 30, deletions: 10, is_test: false, is_doc: true, is_config: false },
    ],
    total_lines: 40,
  },
];

const members = [
  { name: 'Alice' }, { name: 'Bruno' }, { name: 'Carol' },
];

const healthy = computeMetrics(healthyDiffs, members);

assert(healthy.total_commits === 3, `Healthy: total_commits = 3`);
assert(healthy.median_commit_size === 40, `Healthy: median = 40 (got ${healthy.median_commit_size})`);
assert(healthy.atomic_ratio === 1.0, `Healthy: all commits are atomic (got ${healthy.atomic_ratio})`);
assert(healthy.test_ratio > 0, `Healthy: test_ratio > 0 (got ${healthy.test_ratio})`);
assert(healthy.doc_ratio > 0, `Healthy: doc_ratio > 0 (got ${healthy.doc_ratio})`);
assert(healthy.contributor_balance > 0.5, `Healthy: balanced contributors (got ${healthy.contributor_balance})`);
assert(healthy.patterns.length === 0, `Healthy: no patterns detected`);
assert(healthy.composite_score > 0.5, `Healthy: composite_score > 0.5 (got ${healthy.composite_score})`);
assert(healthy.contribution_by_member.length === 3, `Healthy: 3 contributors`);

// ─── Test problematic project (monolithic, no tests, imbalanced) ────────────

console.log('\n=== Problematic project ===');

const badDiffs = [
  {
    project_id: 2, sha: 'xxx', author_name: 'Único',
    committed_date: '2026-08-05T22:00:00Z', message: 'update everything',
    files_changed: [
      { path: 'src/app.py', additions: 250, deletions: 80, is_test: false, is_doc: false, is_config: false },
      { path: 'src/utils.py', additions: 100, deletions: 20, is_test: false, is_doc: false, is_config: false },
    ],
    total_lines: 450,
  },
  {
    project_id: 2, sha: 'yyy', author_name: 'Único',
    committed_date: '2026-08-06T23:00:00Z', message: 'fix stuff',
    files_changed: [
      { path: 'src/app.py', additions: 50, deletions: 30, is_test: false, is_doc: false, is_config: false },
    ],
    total_lines: 80,
  },
];

const badMembers = [
  { name: 'Único' }, { name: 'Fantasma' }, { name: 'Ausente' },
];

const bad = computeMetrics(badDiffs, badMembers);

assert(bad.total_commits === 2, `Bad: total_commits = 2`);
assert(bad.atomic_ratio < 1.0, `Bad: not all atomic (got ${bad.atomic_ratio})`);
assert(bad.test_ratio === 0, `Bad: no tests (got ${bad.test_ratio})`);
assert(bad.contributor_balance === 0, `Bad: single contributor (got ${bad.contributor_balance})`);

// Check patterns
const patternTypes = bad.patterns.map(p => p.type);
assert(patternTypes.includes('MONOLITHIC_COMMIT'), `Bad: MONOLITHIC_COMMIT detected`);
assert(patternTypes.includes('NO_TESTS'), `Bad: NO_TESTS detected`);
assert(patternTypes.includes('LOAD_IMBALANCE'), `Bad: LOAD_IMBALANCE detected`);
assert(bad.composite_score < 0.3, `Bad: composite_score < 0.3 (got ${bad.composite_score})`);

// ─── Test churn detection ───────────────────────────────────────────────────

console.log('\n=== Churn hotspot detection ===');

const churnDiffs = [];
for (let i = 0; i < 8; i++) {
  churnDiffs.push({
    project_id: 3, sha: `churn${i}`, author_name: i % 2 === 0 ? 'A' : 'B',
    committed_date: `2026-08-0${5 + Math.floor(i / 2)}T10:00:00Z`,
    message: `fix: iteration ${i}`,
    files_changed: [
      { path: 'src/main.py', additions: 5, deletions: 3, is_test: false, is_doc: false, is_config: false },
    ],
    total_lines: 8,
  });
}

const churn = computeMetrics(churnDiffs, [{ name: 'A' }, { name: 'B' }]);
assert(churn.churn_hotspots.length > 0, `Churn: hotspot detected`);
assert(churn.churn_hotspots[0].path === 'src/main.py', `Churn: hotspot is src/main.py`);
assert(churn.churn_hotspots[0].edit_count === 8, `Churn: edited 8 times`);
const churnPatterns = churn.patterns.map(p => p.type);
assert(churnPatterns.includes('CHURN_HOTSPOT'), `Churn: CHURN_HOTSPOT pattern detected`);

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
