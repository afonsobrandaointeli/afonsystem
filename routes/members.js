const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/db');

router.get('/:username', async (req, res) => {
  const db = getDB();
  const { username } = req.params;

  const memberRecords = await db.collection('members').find({ username }).toArray();
  const projectIds    = memberRecords.map(m => m.project_id);

  const [projects, commits, mrs, issues] = await Promise.all([
    db.collection('projects').find({ project_id: { $in: projectIds } }).toArray(),
    db.collection('commits').find({ author_name: { $regex: username.replace('.', ' '), $options: 'i' } }).sort({ committed_date: -1 }).toArray(),
    db.collection('merge_requests').find({ author_username: username }).sort({ created_at: -1 }).toArray(),
    db.collection('issues').find({ 'assignees.username': username }).sort({ created_at: -1 }).toArray(),
  ]);

  const member = memberRecords[0] || { username, name: username };

  res.render('pages/member', { member, projects, commits, mrs, issues });
});

module.exports = router;
