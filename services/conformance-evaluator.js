/**
 * Conformance Evaluator — CEP Layer
 *
 * Runs after each daily sync cycle. For every active project, it:
 *   1. Loads the active Sprint Descriptor (SCM baseline)
 *   2. Retrieves all SCM configuration items captured within the sprint window
 *   3. Computes the daily conformance distance (expected state - actual state)
 *   4. Detects complex temporal events (CEP patterns) across the event sequence
 *   5. Generates structured strong/weak points for evaluators
 *   6. Persists the result in daily_conformance collection
 *
 * Pattern catalogue (CEP complex events):
 *   CRAMMING_RISK    — >50% of commits in last 20% of sprint duration
 *   INACTIVE_MEMBER  — member with 0 commits after day 3 of sprint
 *   MR_BOTTLENECK    — MR open >3 days without merge
 *   LOW_CADENCE      — cumulative commits <40% of expected at current sprint day
 *   QUALITY_DRIFT    — conventional commit rate <50%
 */

const { getDB } = require('../config/db');

const CONVENTIONAL_REGEX =
  /^(feat|fix|docs|refactor|test|chore|ci|perf|style|build)(\(.+\))?!?:/;

const MS_PER_DAY = 86400000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function workingDaysBetween(start, end) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function sprintDayNumber(sprintStart, referenceDate) {
  const start = new Date(sprintStart);
  const ref = new Date(referenceDate);
  return workingDaysBetween(start, ref);
}

// ─── CEP Pattern detectors ────────────────────────────────────────────────────

function detectCramming(commits, sprintStart, sprintEnd) {
  if (commits.length < 3) return null;
  const duration = new Date(sprintEnd) - new Date(sprintStart);
  const lastWindowStart = new Date(new Date(sprintEnd).getTime() - duration * 0.2);
  const lastWindow = commits.filter(c => new Date(c.committed_date) >= lastWindowStart).length;
  const ratio = lastWindow / commits.length;
  if (ratio > 0.5) {
    return {
      type: 'CRAMMING_RISK',
      severity: 'warning',
      message: `${Math.round(ratio * 100)}% of commits concentrated in the last 20% of the sprint window`,
    };
  }
  return null;
}

function detectInactiveMembers(commits, members, sprintDay) {
  if (sprintDay < 4) return null;
  const committerSet = new Set(commits.map(c => c.author_name));
  const inactive = members.filter(m => !committerSet.has(m.name));
  if (inactive.length === 0) return null;
  return {
    type: 'INACTIVE_MEMBER',
    severity: 'critical',
    message: `${inactive.map(m => m.name).join(', ')} — 0 commits in ${sprintDay} sprint working days`,
    members: inactive.map(m => m.name),
  };
}

function detectMRBottleneck(mergeRequests, today) {
  const stale = mergeRequests.filter(mr => {
    if (mr.state !== 'opened') return false;
    const daysOpen = (new Date(today) - new Date(mr.created_at)) / MS_PER_DAY;
    return daysOpen > 3;
  });
  if (stale.length === 0) return null;
  return {
    type: 'MR_BOTTLENECK',
    severity: 'warning',
    message: `${stale.length} MR(s) open for more than 3 days without merge: ${stale.map(mr => `"${mr.title}"`).join(', ')}`,
    mr_ids: stale.map(mr => mr.iid),
  };
}

function detectLowCadence(actualCommits, expectedCommits) {
  if (expectedCommits === 0) return null;
  const ratio = actualCommits / expectedCommits;
  if (ratio < 0.4) {
    return {
      type: 'LOW_CADENCE',
      severity: 'critical',
      message: `Commit pace ${Math.round(ratio * 100)}% of expected — at this rate the team will not reach the sprint minimum`,
    };
  }
  return null;
}

function detectQualityDrift(commits) {
  if (commits.length === 0) return null;
  const conventional = commits.filter(c => CONVENTIONAL_REGEX.test(c.message)).length;
  const rate = conventional / commits.length;
  if (rate < 0.5) {
    return {
      type: 'QUALITY_DRIFT',
      severity: 'warning',
      message: `Only ${Math.round(rate * 100)}% of commits follow conventional commit format (threshold: 50%)`,
    };
  }
  return null;
}

// ─── Core evaluator ───────────────────────────────────────────────────────────

async function evaluateProject(projectId, descriptor, referenceDate) {
  const db = getDB();
  const today = referenceDate ? new Date(referenceDate) : new Date();

  const sprintStart = new Date(descriptor.start_date + 'T00:00:00Z');
  const sprintEnd   = new Date(descriptor.end_date   + 'T23:59:59Z');

  const totalWorkingDays = workingDaysBetween(sprintStart, sprintEnd);
  const elapsedDays      = sprintDayNumber(sprintStart, today);
  const progressRatio    = Math.min(elapsedDays / totalWorkingDays, 1.0);

  // Fetch SCM configuration items within the sprint window
  const [commits, mergeRequests, issues, members] = await Promise.all([
    db.collection('commits').find({
      project_id: projectId,
      committed_date: { $gte: sprintStart.toISOString(), $lte: today.toISOString() },
    }).toArray(),
    db.collection('merge_requests').find({
      project_id: projectId,
      created_at: { $gte: sprintStart.toISOString() },
    }).toArray(),
    db.collection('issues').find({
      project_id: projectId,
      created_at: { $gte: sprintStart.toISOString() },
    }).toArray(),
    db.collection('members').find({ project_id: projectId }).toArray(),
  ]);

  const totalMembers = members.length;
  const minRequired  = descriptor.deliverables[0].requirements;

  // Expected state at day elapsedDays
  const expectedCommits  = descriptor.expected_daily_pace.commits_per_day * elapsedDays;
  const expectedMembers  = Math.ceil(totalMembers * descriptor.expected_daily_pace.active_members_ratio);
  const expectedMRsMerged = minRequired.merge_requests.min_merged * progressRatio;
  const expectedIssuesClosed = (issues.length || minRequired.issues.min_total) * progressRatio;

  // Actual state
  const mergedMRs       = mergeRequests.filter(mr => mr.state === 'merged').length;
  const closedIssues    = issues.filter(i  => i.state === 'closed').length;

  const todayStart = new Date(today);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayCommittersSet = new Set(
    commits.filter(c => new Date(c.committed_date) >= todayStart).map(c => c.author_name)
  );
  const activeMembersToday = todayCommittersSet.size;

  // Conventional commit quality
  const conventionalCount = commits.filter(c => CONVENTIONAL_REGEX.test(c.message)).length;
  const conventionalRate  = commits.length > 0 ? conventionalCount / commits.length : 0;

  // Distance deltas (positive = ahead, negative = behind)
  const distance = {
    commits:  +(commits.length - expectedCommits).toFixed(1),
    members:  activeMembersToday - expectedMembers,
    mrs:      +(mergedMRs - expectedMRsMerged).toFixed(2),
    issues:   +(closedIssues - expectedIssuesClosed).toFixed(1),
  };

  // ── CEP pattern detection ────────────────────────────────────────────────
  const patterns = [];
  const crammingEvent  = detectCramming(commits, sprintStart, sprintEnd);
  const inactiveEvent  = detectInactiveMembers(commits, members, elapsedDays);
  const bottleneckEvent = detectMRBottleneck(mergeRequests, today);
  const cadenceEvent   = detectLowCadence(commits.length, expectedCommits);
  const qualityEvent   = detectQualityDrift(commits);

  if (crammingEvent)   patterns.push(crammingEvent);
  if (inactiveEvent)   patterns.push(inactiveEvent);
  if (bottleneckEvent) patterns.push(bottleneckEvent);
  if (cadenceEvent)    patterns.push(cadenceEvent);
  if (qualityEvent)    patterns.push(qualityEvent);

  // ── Score calculation (weighted rubric) ─────────────────────────────────
  const w = descriptor.rubric_weights;

  const commitQualityScore   = conventionalRate;
  const reviewProcessScore   = expectedMRsMerged > 0
    ? Math.min(mergedMRs / expectedMRsMerged, 1.0) : 1.0;
  const issueTrackingScore   = expectedIssuesClosed > 0
    ? Math.min(closedIssues / expectedIssuesClosed, 1.0) : 1.0;
  const deliveryCadenceScore = expectedCommits > 0
    ? Math.min(commits.length / expectedCommits, 1.0) : 1.0;

  const score = +(
    commitQualityScore   * w.commit_quality   +
    reviewProcessScore   * w.review_process   +
    issueTrackingScore   * w.issue_tracking   +
    deliveryCadenceScore * w.delivery_cadence
  ).toFixed(2);

  // ── Strong and weak points ───────────────────────────────────────────────
  const strongPoints = [];
  const weakPoints   = [];

  if (conventionalRate >= 0.9)
    strongPoints.push(`${Math.round(conventionalRate * 100)}% conventional commit compliance`);
  else if (conventionalRate < 0.5)
    weakPoints.push(`Low commit quality: only ${Math.round(conventionalRate * 100)}% conventional commits`);

  if (distance.commits >= 0)
    strongPoints.push(`Commit cadence on track (${commits.length} commits, expected ≥${Math.ceil(expectedCommits)})`);
  else
    weakPoints.push(`Commit cadence ${Math.abs(distance.commits)} behind expected for day ${elapsedDays}`);

  if (mergedMRs >= Math.ceil(expectedMRsMerged) && expectedMRsMerged > 0)
    strongPoints.push(`Merge request flow healthy (${mergedMRs} merged)`);
  else if (expectedMRsMerged > 0 && mergedMRs === 0)
    weakPoints.push(`No MRs merged yet (expected ≈${expectedMRsMerged.toFixed(1)} by now)`);

  if (closedIssues >= Math.ceil(expectedIssuesClosed) && expectedIssuesClosed > 0)
    strongPoints.push(`Issue closure rate on track (${closedIssues} closed)`);

  patterns.forEach(p => {
    if (p.severity === 'critical') weakPoints.unshift(`[CRITICAL] ${p.message}`);
    else weakPoints.push(`[WARNING] ${p.message}`);
  });

  // ── Velocity trend (compare with previous record) ───────────────────────
  const prev = await db.collection('daily_conformance').findOne(
    { project_id: projectId, sprint_id: descriptor.sprint_id },
    { sort: { sprint_day: -1 } }
  );
  let trend = 'stable';
  if (prev) {
    if (score > prev.score + 0.05) trend = 'improving';
    else if (score < prev.score - 0.05) trend = 'deteriorating';
  }

  const result = {
    project_id:            projectId,
    sprint_id:             descriptor.sprint_id,
    sprint_number:         descriptor.sprint_number,
    evaluated_at:          today.toISOString(),
    sprint_day:            elapsedDays,
    total_working_days:    totalWorkingDays,
    sprint_progress_ratio: +progressRatio.toFixed(2),
    total_members:         totalMembers,
    expected: {
      commits_cumulative:  +expectedCommits.toFixed(1),
      active_members:      expectedMembers,
      mrs_merged:          +expectedMRsMerged.toFixed(2),
      issues_closed:       +expectedIssuesClosed.toFixed(1),
    },
    actual: {
      commits_cumulative:  commits.length,
      active_members_today: activeMembersToday,
      mrs_merged:          mergedMRs,
      issues_closed:       closedIssues,
    },
    distance,
    conventional_commit_rate: +conventionalRate.toFixed(2),
    patterns,
    score,
    strong_points: strongPoints,
    weak_points:   weakPoints,
    trend,
    dimension_scores: {
      commit_quality:    +commitQualityScore.toFixed(2),
      review_process:    +reviewProcessScore.toFixed(2),
      issue_tracking:    +issueTrackingScore.toFixed(2),
      delivery_cadence:  +deliveryCadenceScore.toFixed(2),
    },
  };

  await db.collection('daily_conformance').updateOne(
    { project_id: projectId, sprint_id: descriptor.sprint_id, sprint_day: elapsedDays },
    { $set: result },
    { upsert: true }
  );

  return result;
}

// ─── Run evaluation for all projects ─────────────────────────────────────────

async function runEvaluation(referenceDate) {
  const db = getDB();
  const descriptor = await db.collection('sprint_descriptors')
    .findOne({ sprint_id: 'M7-S3' });
  if (!descriptor) {
    console.log('[CEP] No active sprint descriptor found. Skipping evaluation.');
    return;
  }

  const projects = await db.collection('projects').find({}).toArray();
  console.log(`[CEP] Evaluating ${projects.length} projects against sprint ${descriptor.sprint_id}...`);

  const results = [];
  for (const project of projects) {
    const result = await evaluateProject(project.project_id, descriptor, referenceDate);
    results.push({ name: project.name, score: result.score, trend: result.trend, patterns: result.patterns.map(p => p.type) });
    console.log(`  [${project.name}] score=${result.score} trend=${result.trend} patterns=[${result.patterns.map(p => p.type).join(', ')}]`);
  }

  console.log('[CEP] Evaluation complete.');
  return results;
}

module.exports = { runEvaluation, evaluateProject };
