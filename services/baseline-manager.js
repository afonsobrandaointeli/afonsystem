/**
 * Baseline Manager — Evolutionary Baseline Service
 *
 * Manages Sprint Descriptor baselines with versioning and promotion.
 * When a professor evaluates a project as "grade 10" (reference quality),
 * the system captures that project's actual metrics and uses them to
 * generate an upgraded baseline for the next sprint cycle.
 *
 * This implements the principle: "the grade-10 project becomes the new
 * baseline, always raising the bar for the next cohort."
 *
 * Baseline lifecycle:
 *   1. Initial baseline loaded from metaproject (origin: 'metaproject')
 *   2. Professor promotes a grade-10 project
 *   3. System creates a new baseline version (origin: 'professor_grade_10')
 *      with metrics derived from the promoted project
 *   4. Next evaluation cycle uses the evolved baseline
 */

const { getDB } = require('../config/db');

/**
 * Get the active (latest version) baseline for a sprint pattern.
 * Falls back to the original metaproject baseline if no evolved version exists.
 */
async function getActiveBaseline(sprintId) {
  const db = getDB();

  // Find the latest version for this sprint pattern
  const baseline = await db.collection('sprint_descriptors')
    .findOne(
      { sprint_id: { $regex: `^${sprintId.replace(/(-v\d+)$/, '')}` } },
      { sort: { baseline_version: -1 } }
    );

  return baseline;
}

/**
 * Promote a project's actual performance to become the new baseline.
 * The professor has evaluated this project as "grade 10" — its metrics
 * become the reference for the next cohort.
 *
 * @param {string} sprintId - The sprint to evolve (e.g., 'ES11-S1')
 * @param {number} projectId - The grade-10 project
 * @param {string} professorNote - Optional note from the professor
 * @returns {Object} The new baseline descriptor
 */
async function promoteToGrade10(sprintId, projectId, professorNote) {
  const db = getDB();

  // 1. Get the current baseline
  const currentBaseline = await db.collection('sprint_descriptors')
    .findOne({ sprint_id: sprintId });

  if (!currentBaseline) {
    throw new Error(`No baseline found for sprint ${sprintId}`);
  }

  // 2. Get the promoted project's actual metrics
  const conformance = await db.collection('daily_conformance')
    .findOne(
      { project_id: projectId, sprint_id: sprintId },
      { sort: { sprint_day: -1 } }
    );

  const diffMetrics = await db.collection('commit_diffs')
    .find({ project_id: projectId }).toArray();

  const deliverableScores = await db.collection('deliverable_conformance')
    .find({ project_id: projectId, sprint_id: sprintId }).toArray();

  // 3. Compute evolved baseline from grade-10 project's actual performance
  const currentVersion = currentBaseline.baseline_version || 1;
  const newVersion = currentVersion + 1;
  const newSprintId = `${sprintId}-v${newVersion}`;

  // Raise the bar: use the grade-10 project's actual values as new minimums
  const evolvedDescriptor = {
    ...currentBaseline,
    _id: undefined, // let MongoDB generate new _id
    sprint_id: newSprintId,
    baseline_version: newVersion,
    baseline_origin: 'professor_grade_10',
    previous_baseline_id: currentBaseline.sprint_id,
    promoted_project_id: projectId,
    promoted_at: new Date().toISOString(),
    professor_note: professorNote || null,

    // Evolve commit requirements based on actual grade-10 performance
    commit_requirements: {
      ...currentBaseline.commit_requirements,
      min_total: conformance
        ? Math.max(
            currentBaseline.commit_requirements?.min_total || 0,
            conformance.actual.commits_cumulative
          )
        : currentBaseline.commit_requirements?.min_total || 0,
    },

    // Evolve expected daily pace
    expected_daily_pace: {
      commits_per_day: conformance
        ? Math.max(
            currentBaseline.expected_daily_pace.commits_per_day,
            +(conformance.actual.commits_cumulative / Math.max(conformance.sprint_day, 1)).toFixed(1)
          )
        : currentBaseline.expected_daily_pace.commits_per_day,
      active_members_ratio: Math.min(
        currentBaseline.expected_daily_pace.active_members_ratio + 0.1,
        0.9
      ),
      issues_closed_per_week: currentBaseline.expected_daily_pace.issues_closed_per_week,
    },

    // Preserve rubric and assessment weights (professor can adjust manually)
    rubric_weights: { ...currentBaseline.rubric_weights },
    assessment_weights: { ...currentBaseline.assessment_weights },
  };

  // Remove MongoDB _id before insert
  delete evolvedDescriptor._id;

  // 4. Persist the evolved baseline
  await db.collection('sprint_descriptors').insertOne(evolvedDescriptor);

  // 5. Log the promotion
  await db.collection('baseline_history').insertOne({
    action: 'promote_grade_10',
    from_sprint_id: sprintId,
    to_sprint_id: newSprintId,
    project_id: projectId,
    professor_note: professorNote,
    previous_version: currentVersion,
    new_version: newVersion,
    actual_metrics: conformance ? {
      commits: conformance.actual.commits_cumulative,
      mrs_merged: conformance.actual.mrs_merged,
      issues_closed: conformance.actual.issues_closed,
      score: conformance.score,
    } : null,
    deliverable_scores: deliverableScores.map(d => ({
      deliverable_id: d.deliverable_id,
      final_score: d.final_score,
    })),
    created_at: new Date().toISOString(),
  });

  console.log(`[Baseline] Promoted project ${projectId} as grade-10 reference.`);
  console.log(`[Baseline] New baseline: ${newSprintId} (v${newVersion}, origin: professor_grade_10)`);

  return evolvedDescriptor;
}

/**
 * Get the baseline evolution history for a sprint pattern.
 */
async function getBaselineHistory(sprintId) {
  const db = getDB();
  const baseSprintId = sprintId.replace(/(-v\d+)$/, '');

  return db.collection('baseline_history')
    .find({ from_sprint_id: { $regex: `^${baseSprintId}` } })
    .sort({ created_at: -1 })
    .toArray();
}

module.exports = { getActiveBaseline, promoteToGrade10, getBaselineHistory };
