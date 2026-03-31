const express = require('express');
const path    = require('path');
const { connectDB, getDB } = require('./config/db');
const { startScheduler } = require('./services/scheduler');
const { runEvaluation }  = require('./services/conformance-evaluator');
const { seed }           = require('./seeds/simulation-data-generator');
const { seedDocuments }  = require('./seeds/simulation-document-generator');
const { runSemanticPipeline } = require('./services/semantic-pipeline');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/',          require('./routes/index'));
app.use('/projects',  require('./routes/projects'));
app.use('/members',   require('./routes/members'));
app.use('/api',       require('./routes/api'));

app.use((req, res) => res.status(404).render('pages/404'));

async function start() {
  await connectDB();

  // Seed simulation data if requested (LGPD-safe demo mode)
  if (process.env.SEED_ON_START === 'true') {
    console.log('[App] SEED_ON_START=true — loading LGPD-safe simulation data...');
    await seed();

    // Collect commits per project for diff generation
    const db = getDB();
    const projects = await db.collection('projects').find({}).toArray();
    const commitsByProject = {};
    for (const p of projects) {
      commitsByProject[p.project_id] = await db.collection('commits')
        .find({ project_id: p.project_id }).toArray();
    }

    // Seed document content and commit diffs
    const teams = projects.map(p => ({
      project_id: p.project_id,
      name: p.name,
      pattern: p.pattern,
      members: [], // not needed for doc seed
    }));
    await seedDocuments(db, teams, commitsByProject);

    console.log('[App] Running initial CEP evaluation...');
    await runEvaluation('2026-03-30');

    console.log('[App] Running semantic pipeline...');
    await runSemanticPipeline('ES11-S1');
  }

  startScheduler();

  app.listen(PORT, () => {
    console.log(`[App] PBLRepositoryMetrics v2.0.0 running on http://localhost:${PORT}`);
    console.log(`[App] Mode: ${process.env.SEED_ON_START === 'true' ? 'DEMO (simulation data)' : 'LIVE (GitLab)'}`);
    console.log(`[App] Semantic: ${process.env.ANTHROPIC_API_KEY ? 'LLM (Claude)' : 'Mock'}`);
  });
}

start().catch(err => {
  console.error('[App] Startup error:', err);
  process.exit(1);
});
