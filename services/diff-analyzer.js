/**
 * Diff Analyzer — Commit Quality Metrics from Diffs
 *
 * Phase 2b: Analyzes commit diffs to produce quality metrics:
 *
 *   - Atomicity: median lines per commit (smaller = better)
 *   - Test ratio: commits touching test/ vs src/
 *   - Churn hotspots: files edited >5x in the sprint
 *   - Contributor balance: Gini-like concentration measure
 *   - Doc ratio: commits touching docs/ vs total
 *
 * Also detects CEP patterns:
 *   MONOLITHIC_COMMIT    — commit with >300 lines changed
 *   NO_TESTS             — code in src/ with zero test commits
 *   CHURN_HOTSPOT        — same file edited >5x in sprint
 *   LOAD_IMBALANCE       — 1 member contributing >70% of lines
 */

const { getDB } = require('../config/db');

// ─── Metrics computation ────────────────────────────────────────────────────

function computeMetrics(diffs, members) {
  if (diffs.length === 0) {
    return {
      total_commits: 0,
      median_commit_size: 0,
      atomic_ratio: 0,
      test_ratio: 0,
      doc_ratio: 0,
      churn_hotspots: [],
      contributor_balance: 0,
      contribution_by_member: [],
      patterns: [],
      composite_score: 0,
    };
  }

  // ── Commit sizes ────────────────────────────────────────────────────────
  const sizes = diffs.map(d => d.total_lines).sort((a, b) => a - b);
  const medianSize = sizes[Math.floor(sizes.length / 2)];
  const atomicCount = sizes.filter(s => s <= 100).length;
  const atomicRatio = +(atomicCount / sizes.length).toFixed(2);

  // ── Test ratio ──────────────────────────────────────────────────────────
  const allFiles = diffs.flatMap(d => d.files_changed);
  const testFiles = allFiles.filter(f => f.is_test);
  const srcFiles = allFiles.filter(f => !f.is_test && !f.is_doc && !f.is_config);
  const testRatio = srcFiles.length > 0
    ? +(testFiles.length / (testFiles.length + srcFiles.length)).toFixed(2)
    : 0;

  // ── Doc ratio ───────────────────────────────────────────────────────────
  const docFiles = allFiles.filter(f => f.is_doc);
  const docRatio = allFiles.length > 0
    ? +(docFiles.length / allFiles.length).toFixed(2)
    : 0;

  // ── Churn hotspots ──────────────────────────────────────────────────────
  const fileEditCounts = {};
  for (const f of allFiles) {
    fileEditCounts[f.path] = (fileEditCounts[f.path] || 0) + 1;
  }
  const churnHotspots = Object.entries(fileEditCounts)
    .filter(([, count]) => count > 5)
    .map(([path, count]) => ({ path, edit_count: count }))
    .sort((a, b) => b.edit_count - a.edit_count);

  // ── Contributor balance ─────────────────────────────────────────────────
  const linesByMember = {};
  for (const diff of diffs) {
    linesByMember[diff.author_name] = (linesByMember[diff.author_name] || 0) + diff.total_lines;
  }

  const totalLines = Object.values(linesByMember).reduce((s, v) => s + v, 0);
  const memberContributions = Object.entries(linesByMember)
    .map(([name, lines]) => ({
      name,
      lines,
      commits: diffs.filter(d => d.author_name === name).length,
      percentage: totalLines > 0 ? +(lines / totalLines * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);

  // Gini-like: 1 - max_concentration (1 = perfect balance, 0 = one person does all)
  const maxConcentration = totalLines > 0
    ? Math.max(...Object.values(linesByMember)) / totalLines
    : 0;
  const contributorBalance = +(1 - maxConcentration).toFixed(2);

  // ── Pattern detection ───────────────────────────────────────────────────
  const patterns = [];

  // MONOLITHIC_COMMIT
  const monolithicCommits = diffs.filter(d => d.total_lines > 300);
  if (monolithicCommits.length > 0) {
    patterns.push({
      type: 'MONOLITHIC_COMMIT',
      severity: 'warning',
      message: `${monolithicCommits.length} commit(s) com mais de 300 linhas alteradas — considerar commits menores e atômicos`,
      commits: monolithicCommits.map(d => d.sha.slice(0, 8)),
    });
  }

  // NO_TESTS
  if (srcFiles.length > 0 && testFiles.length === 0) {
    patterns.push({
      type: 'NO_TESTS',
      severity: 'warning',
      message: `${srcFiles.length} alterações em código-fonte sem nenhum commit em arquivos de teste`,
    });
  }

  // CHURN_HOTSPOT
  if (churnHotspots.length > 0) {
    patterns.push({
      type: 'CHURN_HOTSPOT',
      severity: 'warning',
      message: `Arquivos editados excessivamente: ${churnHotspots.map(h => `${h.path} (${h.edit_count}x)`).join(', ')}`,
      files: churnHotspots,
    });
  }

  // LOAD_IMBALANCE
  if (maxConcentration > 0.70 && members.length > 1) {
    const topContributor = memberContributions[0];
    patterns.push({
      type: 'LOAD_IMBALANCE',
      severity: 'warning',
      message: `${topContributor.name} concentra ${topContributor.percentage}% das alterações — distribuição desigual de trabalho`,
      top_contributor: topContributor.name,
      concentration: maxConcentration,
    });
  }

  // ── Composite score ─────────────────────────────────────────────────────
  // Higher is better. Weights emphasize atomicity and balance.
  const atomicityScore = Math.min(atomicRatio, 1.0);
  const balanceScore = contributorBalance;
  const testScore = Math.min(testRatio * 2, 1.0); // boost test presence
  const penaltyPerPattern = 0.1;
  const patternPenalty = Math.min(patterns.length * penaltyPerPattern, 0.4);

  const compositeScore = +Math.max(0, (
    atomicityScore * 0.35 +
    balanceScore * 0.30 +
    testScore * 0.20 +
    0.15 - // base
    patternPenalty
  )).toFixed(2);

  return {
    total_commits: diffs.length,
    median_commit_size: medianSize,
    atomic_ratio: atomicRatio,
    test_ratio: testRatio,
    doc_ratio: docRatio,
    churn_hotspots: churnHotspots,
    contributor_balance: contributorBalance,
    contribution_by_member: memberContributions,
    patterns,
    composite_score: Math.min(compositeScore, 1.0),
  };
}

// ─── Analyze a project ──────────────────────────────────────────────────────

async function analyzeProject(projectId, sprintId) {
  const db = getDB();

  const [diffs, members] = await Promise.all([
    db.collection('commit_diffs').find({ project_id: projectId }).toArray(),
    db.collection('members').find({ project_id: projectId }).toArray(),
  ]);

  return computeMetrics(diffs, members);
}

module.exports = { analyzeProject, computeMetrics };
