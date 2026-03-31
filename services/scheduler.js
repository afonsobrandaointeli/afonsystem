const cron = require('node-cron');
const { runEvaluation } = require('./conformance-evaluator');
const { runSemanticPipeline } = require('./semantic-pipeline');

function startScheduler() {
  // Daily at midnight: run full 4-phase evaluation
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Daily evaluation triggered at', new Date().toISOString());
    try {
      // Phase 1+2 (existing): CEP quantitative evaluation
      await runEvaluation();

      // Phase 2a+2b+3+4: Structural + Diff + Semantic + Synthesis
      await runSemanticPipeline();
    } catch (err) {
      console.error('[Scheduler] Evaluation error:', err.message);
    }
  });

  console.log('[Scheduler] Daily evaluation scheduled (cron: 0 0 * * *)');
}

module.exports = { startScheduler };
