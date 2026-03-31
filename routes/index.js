const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/db');
const { buildCommitFilter, buildMRFilter, buildIssueFilter } = require('../utils/filters');

router.get('/', async (req, res) => {
  const db = getDB();
  const query = req.query;

  const commitFilter = buildCommitFilter(query);
  const mrFilter     = buildMRFilter(query);
  const issueFilter  = buildIssueFilter(query);

  const [projects, members, commits, mrs, issues, conformanceRaw, sprintDescriptor] =
    await Promise.all([
      db.collection('projects').find({}).sort({ name: 1 }).toArray(),
      db.collection('members').distinct('name'),
      db.collection('commits').countDocuments(commitFilter),
      db.collection('merge_requests').countDocuments(mrFilter),
      db.collection('issues').countDocuments(issueFilter),
      db.collection('daily_conformance').aggregate([
        { $sort: { sprint_day: -1 } },
        { $group: { _id: '$project_id', doc: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$doc' } },
        { $sort: { score: -1 } },
      ]).toArray(),
      db.collection('sprint_descriptors').findOne({ sprint_id: 'M7-S3' }),
    ]);

  // Enrich conformance records with project name and pattern
  const projectMap = Object.fromEntries(projects.map(p => [p.project_id, p]));
  const conformanceSummary = conformanceRaw.map(c => ({
    ...c,
    name:     projectMap[c.project_id]?.name    || `Project ${c.project_id}`,
    pattern:  projectMap[c.project_id]?.pattern || '',
    patterns: (c.patterns || []).map(p => (typeof p === 'string' ? p : p.type)),
  }));

  // Conventional commit breakdown
  const CONVENTIONAL = /^(feat|fix|docs|refactor|test|chore|ci|perf|style|build)(\(.+\))?!?:/;
  const allCommits = await db.collection('commits').find(commitFilter).toArray();
  const conventionalTypes = {};
  allCommits.forEach(c => {
    const match = c.message.match(/^(\w+)(\(.+\))?!?:/);
    if (match) {
      const type = match[1];
      conventionalTypes[type] = (conventionalTypes[type] || 0) + 1;
    }
  });

  res.render('pages/index', {
    query,
    projects,
    members,
    counts: { commits, mrs, issues, projects: projects.length },
    conventionalTypes,
    conformanceSummary,
    sprintDescriptor,
  });
});

module.exports = router;
