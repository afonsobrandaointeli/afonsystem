const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const { buildCommitFilter, buildMRFilter, buildIssueFilter } = require('../utils/filters');

// Commits per student (CEP input: member distribution)
router.get('/commits-per-student', async (req, res) => {
  const db = getDB();
  const filter = buildCommitFilter(req.query);
  const result = await db.collection('commits').aggregate([
    { $match: filter },
    { $group: { _id: '$author_name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  res.json({
    labels: result.map(r => r._id),
    datasets: [{ label: 'Commits', data: result.map(r => r.count) }],
  });
});

// Commits over time (CEP input: temporal distribution)
router.get('/commits-over-time', async (req, res) => {
  const db = getDB();
  const filter = buildCommitFilter(req.query);
  const result = await db.collection('commits').aggregate([
    { $match: filter },
    { $group: {
      _id: { $substr: ['$committed_date', 0, 10] },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]).toArray();
  res.json({
    labels: result.map(r => r._id),
    datasets: [{ label: 'Commits', data: result.map(r => r.count) }],
  });
});

// Code churn per student
router.get('/lines-per-student', async (req, res) => {
  const db = getDB();
  const filter = buildCommitFilter(req.query);
  const result = await db.collection('commits').aggregate([
    { $match: filter },
    { $group: {
      _id: '$author_name',
      lines: { $sum: { $add: ['$additions', '$deletions'] } },
    }},
    { $sort: { lines: -1 } },
  ]).toArray();
  res.json({
    labels: result.map(r => r._id),
    datasets: [{ label: 'Lines Changed', data: result.map(r => r.lines) }],
  });
});

// MR status
router.get('/mr-status', async (req, res) => {
  const db = getDB();
  const filter = buildMRFilter(req.query);
  const result = await db.collection('merge_requests').aggregate([
    { $match: filter },
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  res.json({
    labels: result.map(r => r._id),
    datasets: [{ data: result.map(r => r.count) }],
  });
});

// Issue status
router.get('/issue-status', async (req, res) => {
  const db = getDB();
  const filter = buildIssueFilter(req.query);
  const result = await db.collection('issues').aggregate([
    { $match: filter },
    { $group: { _id: '$state', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  res.json({
    labels: result.map(r => r._id),
    datasets: [{ data: result.map(r => r.count) }],
  });
});

// SCM Conformance: latest result for a project
router.get('/conformance', async (req, res) => {
  const db = getDB();
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.sprint_id)  filter.sprint_id  = req.query.sprint_id;

  const results = await db.collection('daily_conformance')
    .find(filter)
    .sort({ sprint_day: -1 })
    .limit(req.query.project_id ? 1 : 50)
    .toArray();

  res.json(results);
});

// SCM Conformance trajectory (all days for one project+sprint)
router.get('/conformance/trajectory', async (req, res) => {
  const db = getDB();
  if (!req.query.project_id) return res.status(400).json({ error: 'project_id required' });

  const records = await db.collection('daily_conformance').find({
    project_id: parseInt(req.query.project_id),
    ...(req.query.sprint_id ? { sprint_id: req.query.sprint_id } : {}),
  }).sort({ sprint_day: 1 }).toArray();

  res.json({
    labels: records.map(r => `Day ${r.sprint_day}`),
    scores: records.map(r => r.score),
    expected_commits: records.map(r => r.expected.commits_cumulative),
    actual_commits:   records.map(r => r.actual.commits_cumulative),
    records,
  });
});

// Summary: all projects' latest conformance (for dashboard ranking)
router.get('/conformance/summary', async (req, res) => {
  const db = getDB();
  const sprintId = req.query.sprint_id || 'M7-S3';

  const projects = await db.collection('projects').find({}).toArray();
  const summary  = [];

  for (const p of projects) {
    const latest = await db.collection('daily_conformance').findOne(
      { project_id: p.project_id, sprint_id: sprintId },
      { sort: { sprint_day: -1 } }
    );
    summary.push({
      project_id:  p.project_id,
      name:        p.name,
      pattern:     p.pattern,
      score:       latest ? latest.score : null,
      trend:       latest ? latest.trend : null,
      sprint_day:  latest ? latest.sprint_day : null,
      patterns:    latest ? latest.patterns.map(pt => pt.type) : [],
      strong_points: latest ? latest.strong_points : [],
      weak_points:   latest ? latest.weak_points   : [],
    });
  }

  summary.sort((a, b) => (b.score || 0) - (a.score || 0));
  res.json(summary);
});

// Deliverable conformance: per-deliverable composite scores
router.get('/deliverable-conformance', async (req, res) => {
  const db = getDB();
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.sprint_id)  filter.sprint_id  = req.query.sprint_id;
  if (req.query.deliverable_id) filter.deliverable_id = req.query.deliverable_id;

  const results = await db.collection('deliverable_conformance')
    .find(filter).sort({ deliverable_id: 1 }).toArray();
  res.json(results);
});

// Project conformance summary: weighted score across all deliverables
router.get('/deliverable-conformance/summary', async (req, res) => {
  const db = getDB();
  const sprintId = req.query.sprint_id || 'ES11-S1';

  const summaries = await db.collection('project_conformance_summary')
    .find({ sprint_id: sprintId })
    .sort({ weighted_score: -1 })
    .toArray();

  // Enrich with project names
  const projects = await db.collection('projects').find({}).toArray();
  const projectMap = Object.fromEntries(projects.map(p => [p.project_id, p]));

  const enriched = summaries.map(s => ({
    ...s,
    project_name: projectMap[s.project_id]?.name || `Project ${s.project_id}`,
    project_pattern: projectMap[s.project_id]?.pattern || 'unknown',
  }));

  res.json(enriched);
});

// Semantic assessments: LLM analysis results
router.get('/semantic-assessments', async (req, res) => {
  const db = getDB();
  const filter = {};
  if (req.query.project_id) filter.project_id = parseInt(req.query.project_id);
  if (req.query.sprint_id)  filter.sprint_id  = req.query.sprint_id;

  const results = await db.collection('semantic_assessments')
    .find(filter).sort({ deliverable_id: 1 }).toArray();
  res.json(results);
});

// Diff metrics: commit quality analysis
router.get('/diff-metrics', async (req, res) => {
  const db = getDB();
  if (!req.query.project_id) return res.status(400).json({ error: 'project_id required' });

  const { analyzeProject } = require('../services/diff-analyzer');
  const metrics = await analyzeProject(
    parseInt(req.query.project_id),
    req.query.sprint_id || 'ES11-S1'
  );
  res.json(metrics);
});

// Export: all artifacts for a project (audit trail)
router.get('/export', async (req, res) => {
  const db = getDB();
  const filter = buildCommitFilter(req.query);
  const mrFilter    = buildMRFilter(req.query);
  const issueFilter = buildIssueFilter(req.query);

  const [commits, mrs, issues, conformance] = await Promise.all([
    db.collection('commits').find(filter).toArray(),
    db.collection('merge_requests').find(mrFilter).toArray(),
    db.collection('issues').find(issueFilter).toArray(),
    req.query.project_id
      ? db.collection('daily_conformance')
          .find({ project_id: parseInt(req.query.project_id) })
          .sort({ sprint_day: -1 }).limit(1).toArray()
      : Promise.resolve([]),
  ]);

  res.json({
    exported_at: new Date().toISOString(),
    filters: req.query,
    summary: {
      commits: commits.length,
      merge_requests: mrs.length,
      issues: issues.length,
    },
    conformance: conformance[0] || null,
    commits,
    merge_requests: mrs,
    issues,
  });
});

// Baseline management: promote a grade-10 project as new baseline
router.post('/baseline/promote', async (req, res) => {
  const { promoteToGrade10 } = require('../services/baseline-manager');
  const { sprint_id, project_id, professor_note } = req.body;
  if (!sprint_id || !project_id) {
    return res.status(400).json({ error: 'sprint_id and project_id required' });
  }
  try {
    const newBaseline = await promoteToGrade10(sprint_id, parseInt(project_id), professor_note);
    res.json({ message: 'Baseline promoted', baseline: newBaseline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Baseline history: evolution trail
router.get('/baseline/history', async (req, res) => {
  const { getBaselineHistory } = require('../services/baseline-manager');
  const sprintId = req.query.sprint_id || 'ES11-S1';
  const history = await getBaselineHistory(sprintId);
  res.json(history);
});

module.exports = router;
