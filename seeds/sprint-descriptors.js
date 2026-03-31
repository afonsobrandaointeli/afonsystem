// Sprint Descriptors — operationalize TAPI as SCM baseline
// One descriptor per sprint per module. This is the "configuration baseline"
// against which daily repository state is evaluated by the CEP layer.

const SPRINT_DESCRIPTORS = [
  {
    sprint_id: 'M7-S3',
    module: 'M7',
    sprint_number: 3,
    title: 'Backend API e Integração com Parceiro',
    partner: 'TechCorp S.A.',
    start_date: '2026-03-23',
    end_date: '2026-04-09',
    working_days: 14,
    deliverables: [
      {
        id: 'D1',
        name: 'Backend API funcional',
        type: 'code',
        requirements: {
          commits: {
            min_total: 20,
            conventional_format: true,
            min_per_member: 3,
            no_last_day_cramming: true,
          },
          merge_requests: {
            min_merged: 2,
            review_required: true,
          },
          issues: {
            labels: ['sprint-3'],
            all_closed_by_end: true,
            min_total: 5,
          },
        },
      },
      {
        id: 'D2',
        name: 'Documentação arquitetural',
        type: 'document',
        requirements: {
          commits: {
            path_hint: 'docs/',
            min_total: 2,
            conventional_format: true,
          },
        },
      },
    ],
    expected_daily_pace: {
      commits_per_day: 2.0,
      active_members_ratio: 0.6,
      issues_closed_per_week: 2,
    },
    rubric_weights: {
      commit_quality: 0.30,
      review_process: 0.25,
      issue_tracking: 0.20,
      delivery_cadence: 0.25,
    },
  },
];

module.exports = { SPRINT_DESCRIPTORS };
