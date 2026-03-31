const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/db');

router.get('/:id', async (req, res) => {
  const db = getDB();
  const projectId = parseInt(req.params.id);

  const [project, members, commits, mrs, issues, conformance, trajectory] = await Promise.all([
    db.collection('projects').findOne({ project_id: projectId }),
    db.collection('members').find({ project_id: projectId }).toArray(),
    db.collection('commits').find({ project_id: projectId }).sort({ committed_date: -1 }).toArray(),
    db.collection('merge_requests').find({ project_id: projectId }).sort({ created_at: -1 }).toArray(),
    db.collection('issues').find({ project_id: projectId }).sort({ created_at: -1 }).toArray(),
    db.collection('daily_conformance').findOne(
      { project_id: projectId },
      { sort: { sprint_day: -1 } }
    ),
    db.collection('daily_conformance').find({ project_id: projectId })
      .sort({ sprint_day: 1 }).toArray(),
  ]);

  if (!project) return res.status(404).render('pages/404');

  // Commits grouped by author
  const commitsByAuthor = {};
  commits.forEach(c => {
    if (!commitsByAuthor[c.author_name]) commitsByAuthor[c.author_name] = [];
    commitsByAuthor[c.author_name].push(c);
  });

  res.render('pages/project', {
    project, members, commits, mrs, issues,
    commitsByAuthor, conformance, trajectory,
  });
});

module.exports = router;
