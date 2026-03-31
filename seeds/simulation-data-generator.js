/**
 * Simulation Data Generator — LGPD-safe synthetic data
 *
 * Generates synthetic PBL sprint data for 5 teams, each exhibiting a
 * distinct SCM conformance pattern detectable by the CEP evaluation layer:
 *
 *   Team Alpha   — Consistent delivery (reference team)
 *   Team Beta    — Cramming pattern (commits concentrated at sprint end)
 *   Team Gamma   — Ghost member (one contributor silent for the sprint)
 *   Team Delta   — MR bottleneck (PRs opened but never reviewed/merged)
 *   Team Epsilon — Recovering team (slow start, accelerating cadence)
 *
 * All names, emails, and identifiers are synthetic.
 * No real student or institution data is used.
 */

const { MongoClient } = require('mongodb');
const { SPRINT_DESCRIPTORS } = require('./sprint-descriptors');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afonsystem';

// ─── Sprint window ────────────────────────────────────────────────────────────
const SPRINT = SPRINT_DESCRIPTORS[0];
const SPRINT_START = new Date('2026-03-23T08:00:00Z');
const SPRINT_END   = new Date('2026-04-09T23:59:59Z');
const TODAY        = new Date('2026-03-30T23:59:59Z'); // simulated "today"

// Working days in the sprint (Mon-Fri only)
function workingDays(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const ALL_WORKING_DAYS   = workingDays(SPRINT_START, SPRINT_END);
const PAST_WORKING_DAYS  = workingDays(SPRINT_START, TODAY);
const DAY_COUNT          = PAST_WORKING_DAYS.length; // days elapsed so far

// ─── Team definitions ─────────────────────────────────────────────────────────
const TEAMS = [
  {
    project_id: 1001,
    name: 'Team Alpha — M7 Sprint 3',
    path: 'inteli-m7/team-alpha-s3',
    description: 'Consistent delivery team. Reference pattern for CEP evaluation.',
    pattern: 'consistent',
    members: [
      { user_id: 101, username: 'alice.lima',     name: 'Alice Lima',     access_level: 40 },
      { user_id: 102, username: 'bruno.santos',   name: 'Bruno Santos',   access_level: 30 },
      { user_id: 103, username: 'carol.oliveira', name: 'Carol Oliveira', access_level: 30 },
      { user_id: 104, username: 'diego.costa',    name: 'Diego Costa',    access_level: 30 },
      { user_id: 105, username: 'eva.martins',    name: 'Eva Martins',    access_level: 30 },
    ],
  },
  {
    project_id: 1002,
    name: 'Team Beta — M7 Sprint 3',
    path: 'inteli-m7/team-beta-s3',
    description: 'Cramming pattern team. Low activity early; commit burst expected at end.',
    pattern: 'cramming',
    members: [
      { user_id: 201, username: 'felipe.rocha',   name: 'Felipe Rocha',   access_level: 40 },
      { user_id: 202, username: 'gabi.ferreira',  name: 'Gabi Ferreira',  access_level: 30 },
      { user_id: 203, username: 'henrique.melo',  name: 'Henrique Melo',  access_level: 30 },
      { user_id: 204, username: 'iris.souza',     name: 'Iris Souza',     access_level: 30 },
      { user_id: 205, username: 'joao.alves',     name: 'João Alves',     access_level: 30 },
    ],
  },
  {
    project_id: 1003,
    name: 'Team Gamma — M7 Sprint 3',
    path: 'inteli-m7/team-gamma-s3',
    description: 'Ghost member pattern. One contributor has zero commits this sprint.',
    pattern: 'ghost_member',
    ghost_member: 'lucas.pinto',
    members: [
      { user_id: 301, username: 'karen.nunes',    name: 'Karen Nunes',    access_level: 40 },
      { user_id: 302, username: 'lucas.pinto',    name: 'Lucas Pinto',    access_level: 30 },
      { user_id: 303, username: 'marina.leal',    name: 'Marina Leal',    access_level: 30 },
      { user_id: 304, username: 'nuno.barbosa',   name: 'Nuno Barbosa',   access_level: 30 },
      { user_id: 305, username: 'olivia.freitas', name: 'Olivia Freitas', access_level: 30 },
    ],
  },
  {
    project_id: 1004,
    name: 'Team Delta — M7 Sprint 3',
    path: 'inteli-m7/team-delta-s3',
    description: 'MR bottleneck pattern. Merge requests opened but never reviewed or merged.',
    pattern: 'mr_bottleneck',
    members: [
      { user_id: 401, username: 'pedro.xavier',   name: 'Pedro Xavier',   access_level: 40 },
      { user_id: 402, username: 'quintina.reis',  name: 'Quintina Reis',  access_level: 30 },
      { user_id: 403, username: 'rafael.duarte',  name: 'Rafael Duarte',  access_level: 30 },
      { user_id: 404, username: 'sara.viana',     name: 'Sara Viana',     access_level: 30 },
      { user_id: 405, username: 'thiago.carmo',   name: 'Thiago Carmo',   access_level: 30 },
    ],
  },
  {
    project_id: 1005,
    name: 'Team Epsilon — M7 Sprint 3',
    path: 'inteli-m7/team-epsilon-s3',
    description: 'Recovering team. Slow start; cadence improving toward baseline.',
    pattern: 'recovering',
    members: [
      { user_id: 501, username: 'ursula.moura',   name: 'Ursula Moura',   access_level: 40 },
      { user_id: 502, username: 'vitor.araujo',   name: 'Vitor Araújo',   access_level: 30 },
      { user_id: 503, username: 'wendy.campos',   name: 'Wendy Campos',   access_level: 30 },
      { user_id: 504, username: 'xande.figueiredo', name: 'Xande Figueiredo', access_level: 30 },
      { user_id: 505, username: 'yasmin.paiva',   name: 'Yasmin Paiva',   access_level: 30 },
    ],
  },
];

// ─── Conventional commit message pool ────────────────────────────────────────
const CONVENTIONAL = [
  'feat: add user authentication endpoint',
  'feat(api): implement product listing route',
  'feat(auth): add JWT token validation',
  'fix: resolve null pointer in order service',
  'fix(db): correct connection pool timeout',
  'fix(api): handle empty request body gracefully',
  'docs: update architecture decision record',
  'docs(readme): add setup instructions',
  'refactor: extract validation logic to helper',
  'refactor(auth): simplify token refresh flow',
  'test: add unit tests for payment service',
  'test(integration): cover checkout flow',
  'chore: update dependencies to latest versions',
  'ci: add lint step to pipeline',
  'perf: optimize database query with index',
];

const NON_CONVENTIONAL = [
  'fix things',
  'update',
  'changed stuff',
  'WIP',
  'fixing bug',
  'more changes',
  'done',
];

// ─── Helper: random item from array ──────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Helper: generate a timestamp on a given working day ─────────────────────
function timestampOnDay(day, hourMin = 8, hourMax = 22) {
  const d = new Date(day);
  d.setHours(hourMin + Math.floor(Math.random() * (hourMax - hourMin)));
  d.setMinutes(Math.floor(Math.random() * 60));
  d.setSeconds(Math.floor(Math.random() * 60));
  return d.toISOString();
}

// ─── Helper: generate a SHA-like string ──────────────────────────────────────
let shaCounter = 1000;
function syntheticSha() {
  shaCounter++;
  return `${shaCounter.toString(16).padStart(8, '0')}abcdef${Math.random().toString(16).slice(2, 10)}`;
}

// ─── Commit generators per pattern ───────────────────────────────────────────
function generateCommits(team) {
  const commits = [];
  const activeMembers = team.members.filter(m => m.username !== team.ghost_member);

  switch (team.pattern) {
    case 'consistent': {
      // 2–3 commits per working day, spread across all members, ~90% conventional
      for (const day of PAST_WORKING_DAYS) {
        const dailyCommitters = pickN(team.members, 2 + Math.floor(Math.random() * 2));
        for (const member of dailyCommitters) {
          const isConventional = Math.random() < 0.9;
          commits.push({
            project_id: team.project_id,
            sha: syntheticSha(),
            author_name: member.name,
            author_email: `${member.username}@inteli.edu.br`,
            committed_date: timestampOnDay(day, 9, 18),
            message: isConventional ? pick(CONVENTIONAL) : pick(NON_CONVENTIONAL),
            additions: 20 + Math.floor(Math.random() * 80),
            deletions: 5 + Math.floor(Math.random() * 30),
          });
        }
      }
      break;
    }

    case 'cramming': {
      // Very few commits in days 1-4, sparse in days 5-6 (no burst yet — it's coming)
      for (const [i, day] of PAST_WORKING_DAYS.entries()) {
        const density = i < 4 ? 0.3 : 0.5; // low activity
        if (Math.random() < density) {
          const member = pick(team.members);
          commits.push({
            project_id: team.project_id,
            sha: syntheticSha(),
            author_name: member.name,
            author_email: `${member.username}@inteli.edu.br`,
            committed_date: timestampOnDay(day, 14, 22),
            message: pick(NON_CONVENTIONAL), // also poor quality
            additions: 10 + Math.floor(Math.random() * 40),
            deletions: 2 + Math.floor(Math.random() * 15),
          });
        }
      }
      break;
    }

    case 'ghost_member': {
      // Normal activity but ghost member (lucas.pinto) contributes nothing
      for (const day of PAST_WORKING_DAYS) {
        const dailyCommitters = pickN(activeMembers, 2 + Math.floor(Math.random() * 2));
        for (const member of dailyCommitters) {
          commits.push({
            project_id: team.project_id,
            sha: syntheticSha(),
            author_name: member.name,
            author_email: `${member.username}@inteli.edu.br`,
            committed_date: timestampOnDay(day, 9, 19),
            message: pick(CONVENTIONAL),
            additions: 15 + Math.floor(Math.random() * 60),
            deletions: 5 + Math.floor(Math.random() * 20),
          });
        }
      }
      break;
    }

    case 'mr_bottleneck': {
      // Commits exist but go directly to main; few MRs, none merged
      for (const day of PAST_WORKING_DAYS) {
        const dailyCommitters = pickN(team.members, 2 + Math.floor(Math.random() * 2));
        for (const member of dailyCommitters) {
          commits.push({
            project_id: team.project_id,
            sha: syntheticSha(),
            author_name: member.name,
            author_email: `${member.username}@inteli.edu.br`,
            committed_date: timestampOnDay(day, 9, 20),
            message: pick(CONVENTIONAL),
            additions: 25 + Math.floor(Math.random() * 70),
            deletions: 8 + Math.floor(Math.random() * 25),
          });
        }
      }
      break;
    }

    case 'recovering': {
      // Days 1-3: 0-1 commits. Days 4-6: 2-3 commits (recovery in progress)
      for (const [i, day] of PAST_WORKING_DAYS.entries()) {
        const count = i < 3 ? (Math.random() < 0.3 ? 1 : 0) : (2 + Math.floor(Math.random() * 2));
        const committers = pickN(team.members, Math.min(count, team.members.length));
        for (const member of committers) {
          commits.push({
            project_id: team.project_id,
            sha: syntheticSha(),
            author_name: member.name,
            author_email: `${member.username}@inteli.edu.br`,
            committed_date: timestampOnDay(day, 9, 21),
            message: pick(CONVENTIONAL),
            additions: 20 + Math.floor(Math.random() * 60),
            deletions: 5 + Math.floor(Math.random() * 20),
          });
        }
      }
      break;
    }
  }

  return commits;
}

// ─── MR generators per pattern ───────────────────────────────────────────────
function generateMRs(team) {
  const mrs = [];
  const day2 = PAST_WORKING_DAYS[1];
  const day4 = PAST_WORKING_DAYS[3] || PAST_WORKING_DAYS[PAST_WORKING_DAYS.length - 1];

  switch (team.pattern) {
    case 'consistent':
    case 'ghost_member': {
      // 2 MRs: one merged, one still open (being reviewed)
      mrs.push({
        project_id: team.project_id,
        iid: 1,
        title: 'feat: implement product listing API',
        author_username: team.members[1].username,
        author_name: team.members[1].name,
        state: 'merged',
        source_branch: 'feat/product-listing',
        target_branch: 'main',
        created_at: timestampOnDay(day2, 10, 12),
        merged_at: timestampOnDay(day4, 14, 17),
        closed_at: null,
        merge_commit_sha: syntheticSha(),
      });
      mrs.push({
        project_id: team.project_id,
        iid: 2,
        title: 'feat: add authentication middleware',
        author_username: team.members[2].username,
        author_name: team.members[2].name,
        state: 'opened',
        source_branch: 'feat/auth-middleware',
        target_branch: 'main',
        created_at: timestampOnDay(PAST_WORKING_DAYS[4] || day4, 9, 11),
        merged_at: null,
        closed_at: null,
        merge_commit_sha: null,
      });
      break;
    }

    case 'cramming': {
      // No MRs yet (sprint is behind, no branching strategy being used)
      break;
    }

    case 'mr_bottleneck': {
      // 3 MRs all opened, none merged, all stale (>3 days)
      for (let i = 0; i < 3; i++) {
        mrs.push({
          project_id: team.project_id,
          iid: i + 1,
          title: `feat: module ${i + 1} implementation`,
          author_username: team.members[i].username,
          author_name: team.members[i].name,
          state: 'opened',
          source_branch: `feat/module-${i + 1}`,
          target_branch: 'main',
          created_at: timestampOnDay(PAST_WORKING_DAYS[i] || day2, 9, 11),
          merged_at: null,
          closed_at: null,
          merge_commit_sha: null,
        });
      }
      break;
    }

    case 'recovering': {
      // 1 MR opened recently (recovery)
      mrs.push({
        project_id: team.project_id,
        iid: 1,
        title: 'feat: initial backend structure',
        author_username: team.members[0].username,
        author_name: team.members[0].name,
        state: 'opened',
        source_branch: 'feat/backend-init',
        target_branch: 'main',
        created_at: timestampOnDay(PAST_WORKING_DAYS[4] || day4, 10, 12),
        merged_at: null,
        closed_at: null,
        merge_commit_sha: null,
      });
      break;
    }
  }

  return mrs;
}

// ─── Issue generators per pattern ────────────────────────────────────────────
function generateIssues(team) {
  const issues = [];
  const sprintLabel = 'sprint-3';

  const templates = [
    { title: 'Set up project structure and boilerplate', effort: 'easy' },
    { title: 'Implement user authentication flow', effort: 'medium' },
    { title: 'Design database schema for products', effort: 'medium' },
    { title: 'Create REST API for order management', effort: 'hard' },
    { title: 'Write integration tests for checkout', effort: 'medium' },
    { title: 'Document API endpoints with OpenAPI', effort: 'easy' },
    { title: 'Implement partner webhook integration', effort: 'hard' },
  ];

  const day1 = PAST_WORKING_DAYS[0];

  switch (team.pattern) {
    case 'consistent': {
      // 6 issues: 4 closed, 2 open (good progress)
      for (let i = 0; i < 6; i++) {
        const isClosed = i < 4;
        const closedDay = PAST_WORKING_DAYS[Math.min(i + 1, PAST_WORKING_DAYS.length - 1)];
        issues.push({
          project_id: team.project_id,
          iid: i + 1,
          title: templates[i].title,
          author_username: team.members[0].username,
          author_name: team.members[0].name,
          state: isClosed ? 'closed' : 'opened',
          labels: [sprintLabel, templates[i].effort],
          created_at: timestampOnDay(day1, 9, 11),
          closed_at: isClosed ? timestampOnDay(closedDay, 14, 18) : null,
          assignees: [{ username: team.members[i % 5].username, name: team.members[i % 5].name }],
        });
      }
      break;
    }

    case 'cramming': {
      // 5 issues: only 1 closed (severe delay)
      for (let i = 0; i < 5; i++) {
        const isClosed = i === 0;
        issues.push({
          project_id: team.project_id,
          iid: i + 1,
          title: templates[i].title,
          author_username: team.members[0].username,
          author_name: team.members[0].name,
          state: isClosed ? 'closed' : 'opened',
          labels: [sprintLabel],
          created_at: timestampOnDay(day1, 9, 11),
          closed_at: isClosed ? timestampOnDay(PAST_WORKING_DAYS[3], 16, 18) : null,
          assignees: [{ username: team.members[i % 5].username, name: team.members[i % 5].name }],
        });
      }
      break;
    }

    case 'ghost_member': {
      // 6 issues: 3 closed, but ghost member's issues untouched
      const ghost = team.members.find(m => m.username === team.ghost_member);
      for (let i = 0; i < 6; i++) {
        const isGhostIssue = i >= 4;
        const isClosed = !isGhostIssue && i < 3;
        const closedDay = PAST_WORKING_DAYS[Math.min(i + 1, PAST_WORKING_DAYS.length - 1)];
        issues.push({
          project_id: team.project_id,
          iid: i + 1,
          title: templates[i].title,
          author_username: team.members[0].username,
          author_name: team.members[0].name,
          state: isClosed ? 'closed' : 'opened',
          labels: [sprintLabel, templates[i].effort],
          created_at: timestampOnDay(day1, 9, 11),
          closed_at: isClosed ? timestampOnDay(closedDay, 14, 18) : null,
          assignees: [{ username: isGhostIssue ? ghost.username : team.members[i % 4].username,
                        name: isGhostIssue ? ghost.name : team.members[i % 4].name }],
        });
      }
      break;
    }

    case 'mr_bottleneck': {
      // Issues exist but none closed — work is "in progress" in MRs that don't merge
      for (let i = 0; i < 5; i++) {
        issues.push({
          project_id: team.project_id,
          iid: i + 1,
          title: templates[i].title,
          author_username: team.members[0].username,
          author_name: team.members[0].name,
          state: 'opened',
          labels: [sprintLabel],
          created_at: timestampOnDay(day1, 9, 11),
          closed_at: null,
          assignees: [{ username: team.members[i % 5].username, name: team.members[i % 5].name }],
        });
      }
      break;
    }

    case 'recovering': {
      // 5 issues: 1 closed recently (recovery started)
      for (let i = 0; i < 5; i++) {
        const isClosed = i === 0;
        issues.push({
          project_id: team.project_id,
          iid: i + 1,
          title: templates[i].title,
          author_username: team.members[0].username,
          author_name: team.members[0].name,
          state: isClosed ? 'closed' : 'opened',
          labels: [sprintLabel],
          created_at: timestampOnDay(day1, 9, 11),
          closed_at: isClosed ? timestampOnDay(PAST_WORKING_DAYS[4], 15, 18) : null,
          assignees: [{ username: team.members[i % 5].username, name: team.members[i % 5].name }],
        });
      }
      break;
    }
  }

  return issues;
}

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    db.collection('projects').deleteMany({}),
    db.collection('members').deleteMany({}),
    db.collection('commits').deleteMany({}),
    db.collection('merge_requests').deleteMany({}),
    db.collection('issues').deleteMany({}),
    db.collection('sprint_descriptors').deleteMany({}),
    db.collection('daily_conformance').deleteMany({}),
  ]);

  console.log('[Seed] Inserting sprint descriptors...');
  await db.collection('sprint_descriptors').insertMany(SPRINT_DESCRIPTORS);

  for (const team of TEAMS) {
    console.log(`[Seed] Generating data for ${team.name} (pattern: ${team.pattern})...`);

    // Project
    await db.collection('projects').updateOne(
      { project_id: team.project_id },
      { $set: {
        project_id: team.project_id,
        name: team.name,
        path_with_namespace: team.path,
        description: team.description,
        created_at: SPRINT_START.toISOString(),
        default_branch: 'main',
        web_url: `https://gitlab.inteli.edu.br/${team.path}`,
        pattern: team.pattern,
      }},
      { upsert: true }
    );

    // Members
    const memberOps = team.members.map(m => ({
      updateOne: {
        filter: { project_id: team.project_id, user_id: m.user_id },
        update: { $set: { ...m, project_id: team.project_id } },
        upsert: true,
      },
    }));
    await db.collection('members').bulkWrite(memberOps);

    // Commits
    const commits = generateCommits(team);
    if (commits.length > 0) {
      const commitOps = commits.map(c => ({
        updateOne: {
          filter: { project_id: c.project_id, sha: c.sha },
          update: { $set: c },
          upsert: true,
        },
      }));
      await db.collection('commits').bulkWrite(commitOps);
    }

    // Merge Requests
    const mrs = generateMRs(team);
    if (mrs.length > 0) {
      const mrOps = mrs.map(mr => ({
        updateOne: {
          filter: { project_id: mr.project_id, iid: mr.iid },
          update: { $set: mr },
          upsert: true,
        },
      }));
      await db.collection('merge_requests').bulkWrite(mrOps);
    }

    // Issues
    const issues = generateIssues(team);
    if (issues.length > 0) {
      const issueOps = issues.map(is => ({
        updateOne: {
          filter: { project_id: is.project_id, iid: is.iid },
          update: { $set: is },
          upsert: true,
        },
      }));
      await db.collection('issues').bulkWrite(issueOps);
    }

    console.log(`  → ${commits.length} commits, ${mrs.length} MRs, ${issues.length} issues`);
  }

  // Summary
  const counts = await Promise.all([
    db.collection('projects').countDocuments(),
    db.collection('members').countDocuments(),
    db.collection('commits').countDocuments(),
    db.collection('merge_requests').countDocuments(),
    db.collection('issues').countDocuments(),
  ]);
  console.log('\n[Seed] Done.');
  console.log(`  projects: ${counts[0]}`);
  console.log(`  members:  ${counts[1]}`);
  console.log(`  commits:  ${counts[2]}`);
  console.log(`  mrs:      ${counts[3]}`);
  console.log(`  issues:   ${counts[4]}`);

  await client.close();
}

// Run if called directly
if (require.main === module) {
  seed().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seed };
