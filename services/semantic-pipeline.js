/**
 * Semantic Pipeline — Orchestrates Phases 2a, 2b, 3, 4
 *
 * Runs after the existing CEP evaluation (Phase 2) to add:
 *   Phase 2a: Structural check (deterministic)
 *   Phase 2b: Diff analysis (deterministic)
 *   Phase 3:  Semantic analysis (LLM or mock)
 *   Phase 4:  Synthesis (composite score)
 *
 * Uses the ES11 Sprint Descriptor for document deliverables.
 */

const { getDB } = require('../config/db');
const { checkAllDeliverables } = require('./structural-checker');
const { analyzeProject } = require('./diff-analyzer');
const { analyzeAllDeliverables } = require('./semantic-analyzer');
const { synthesizeProject } = require('./synthesis');

async function runSemanticPipeline(sprintId) {
  const db = getDB();

  // Find the target sprint descriptor (ES11-S1 by default)
  const targetSprintId = sprintId || 'ES11-S1';
  const descriptor = await db.collection('sprint_descriptors')
    .findOne({ sprint_id: targetSprintId });

  if (!descriptor) {
    console.log(`[Pipeline] No sprint descriptor found for ${targetSprintId}. Skipping semantic pipeline.`);
    return [];
  }

  // Only process document deliverables
  const docDeliverables = descriptor.deliverables.filter(d => d.type === 'document');
  if (docDeliverables.length === 0) {
    console.log('[Pipeline] No document deliverables in this sprint. Skipping.');
    return [];
  }

  console.log(`[Pipeline] Running semantic pipeline for sprint ${targetSprintId} (${docDeliverables.length} document deliverables)`);

  // Clear previous results
  await Promise.all([
    db.collection('semantic_assessments').deleteMany({ sprint_id: targetSprintId }),
    db.collection('deliverable_conformance').deleteMany({ sprint_id: targetSprintId }),
    db.collection('project_conformance_summary').deleteMany({ sprint_id: targetSprintId }),
  ]);

  const projects = await db.collection('projects').find({}).toArray();
  const allResults = [];

  for (const project of projects) {
    console.log(`\n[Pipeline] ── ${project.name} ──`);

    // Phase 2a: Structural check
    console.log('[Pipeline] Phase 2a: Structural check...');
    const structuralResults = await checkAllDeliverables(
      project.project_id, descriptor
    );

    // Phase 2b: Diff analysis
    console.log('[Pipeline] Phase 2b: Diff analysis...');
    const diffMetrics = await analyzeProject(
      project.project_id, targetSprintId
    );

    // Phase 3: Semantic analysis (LLM or mock)
    console.log('[Pipeline] Phase 3: Semantic analysis...');
    const semanticResults = await analyzeAllDeliverables(
      project.project_id, descriptor, structuralResults, diffMetrics
    );

    // Get existing CEP result for this project
    const cepResult = await db.collection('daily_conformance').findOne(
      { project_id: project.project_id },
      { sort: { sprint_day: -1 } }
    );

    // Phase 4: Synthesis
    console.log('[Pipeline] Phase 4: Synthesis...');
    const synthesis = await synthesizeProject(
      project.project_id, descriptor,
      structuralResults, semanticResults,
      diffMetrics, cepResult
    );

    allResults.push({
      project_id: project.project_id,
      project_name: project.name,
      weighted_score: synthesis.summary.weighted_score,
      deliverables: synthesis.summary.deliverables,
    });

    console.log(`[Pipeline] → Weighted score: ${synthesis.summary.weighted_score}`);
  }

  // Print ranking
  console.log('\n[Pipeline] ═══ Final Ranking ═══');
  allResults
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.project_name}: ${r.weighted_score}`);
    });

  return allResults;
}

module.exports = { runSemanticPipeline };
