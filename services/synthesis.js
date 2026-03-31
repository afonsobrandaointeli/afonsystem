/**
 * Synthesis Service — Final Composite Score
 *
 * Phase 4: Combines results from all previous phases into a single
 * deliverable_conformance record per deliverable per project:
 *
 *   - Structural conformance score (Phase 2a)
 *   - Commit/diff quality score (Phase 2b)
 *   - Semantic quality score (Phase 3)
 *   - Quantitative CEP score (existing Phase 2)
 *
 * Weights are configurable per sprint via assessment_weights in the
 * Sprint Descriptor.
 */

const { getDB } = require('../config/db');

// ─── Compute final score for one deliverable ────────────────────────────────

function computeDeliverableScore(structural, semantic, diffMetrics, cepScore, weights) {
  const w = weights || {
    structural_conformance: 0.25,
    semantic_quality: 0.35,
    commit_discipline: 0.20,
    quantitative_cep: 0.20,
  };

  const structuralScore = structural?.structural_completeness || 0;
  const semanticScore = semantic?.overall_semantic_score || 0;
  const commitScore = diffMetrics?.composite_score || 0;
  const cep = cepScore || 0;

  const finalScore = +(
    structuralScore * w.structural_conformance +
    semanticScore * w.semantic_quality +
    commitScore * w.commit_discipline +
    cep * w.quantitative_cep
  ).toFixed(2);

  // Merge all strong/weak points
  const strongPoints = [
    ...(structural?.strong_points || []),
    ...(semantic?.strengths || []),
  ];

  const weakPoints = [
    ...(structural?.weak_points || []),
    ...(semantic?.weaknesses || []),
  ];

  // Merge all patterns
  const allPatterns = [
    ...(diffMetrics?.patterns || []),
  ];

  return {
    structural_score: structuralScore,
    semantic_score: semanticScore,
    commit_score: commitScore,
    cep_score: cep,
    final_score: finalScore,
    strong_points: strongPoints,
    weak_points: weakPoints,
    patterns: allPatterns,
    recommended_actions: semantic?.recommended_actions || [],
    section_assessments: semantic?.section_assessments || [],
    member_contributions: diffMetrics?.contribution_by_member || [],
  };
}

// ─── Run synthesis for all deliverables of a project ────────────────────────

async function synthesizeProject(projectId, descriptor, structuralResults, semanticResults, diffMetrics, cepResult) {
  const db = getDB();
  const results = [];

  const cepScore = cepResult?.score || 0;
  const weights = descriptor.assessment_weights;

  for (const structural of structuralResults) {
    const semantic = semanticResults.find(s => s.deliverable_id === structural.deliverable_id);
    const deliverable = descriptor.deliverables.find(d => d.id === structural.deliverable_id);

    const score = computeDeliverableScore(
      structural, semantic, diffMetrics, cepScore, weights
    );

    const record = {
      project_id: projectId,
      sprint_id: descriptor.sprint_id,
      deliverable_id: structural.deliverable_id,
      deliverable_name: structural.deliverable_name,
      deliverable_weight: deliverable?.weight || 1,
      evaluated_at: new Date().toISOString(),
      ...score,
      executive_summary: semantic?.executive_summary || '',
    };

    await db.collection('deliverable_conformance').updateOne(
      {
        project_id: projectId,
        sprint_id: descriptor.sprint_id,
        deliverable_id: structural.deliverable_id,
      },
      { $set: record },
      { upsert: true }
    );

    results.push(record);
  }

  // Compute weighted average across all deliverables
  const totalWeight = results.reduce((sum, r) => sum + r.deliverable_weight, 0);
  const weightedScore = totalWeight > 0
    ? +(results.reduce((sum, r) => sum + r.final_score * r.deliverable_weight, 0) / totalWeight).toFixed(2)
    : 0;

  // Project-level summary
  const projectSummary = {
    project_id: projectId,
    sprint_id: descriptor.sprint_id,
    evaluated_at: new Date().toISOString(),
    deliverable_count: results.length,
    weighted_score: weightedScore,
    deliverables: results.map(r => ({
      id: r.deliverable_id,
      name: r.deliverable_name,
      weight: r.deliverable_weight,
      structural_score: r.structural_score,
      semantic_score: r.semantic_score,
      commit_score: r.commit_score,
      cep_score: r.cep_score,
      final_score: r.final_score,
    })),
    all_patterns: results.flatMap(r => r.patterns).map(p => p.type),
    top_weak_points: results.flatMap(r => r.weak_points).slice(0, 5),
    top_strong_points: results.flatMap(r => r.strong_points).slice(0, 5),
  };

  await db.collection('project_conformance_summary').updateOne(
    { project_id: projectId, sprint_id: descriptor.sprint_id },
    { $set: projectSummary },
    { upsert: true }
  );

  return { deliverables: results, summary: projectSummary };
}

module.exports = { computeDeliverableScore, synthesizeProject };
