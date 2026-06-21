const pool = require('./pg');

// ── DDL ───────────────────────────────────────────────────────────────────

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS suites (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      feature TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS suite_cases (
      suite_id INTEGER NOT NULL,
      test_case_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (suite_id, test_case_id)
    );
    CREATE TABLE IF NOT EXISTS bugs (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      steps_to_reproduce JSONB NOT NULL DEFAULT '[]',
      expected TEXT NOT NULL DEFAULT '',
      actual TEXT NOT NULL DEFAULT '',
      environment TEXT NOT NULL DEFAULT '',
      github_issue_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bug_activity (
      id SERIAL PRIMARY KEY,
      bug_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      message TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS test_runs (
      id SERIAL PRIMARY KEY,
      suite_id INTEGER,
      suite_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      pass_count INTEGER NOT NULL DEFAULT 0,
      fail_count INTEGER NOT NULL DEFAULT 0,
      skip_count INTEGER NOT NULL DEFAULT 0,
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS test_run_results (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL,
      test_case_id INTEGER,
      test_case_title TEXT,
      test_case_severity TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      result TEXT,
      duration_ms INTEGER,
      notes TEXT DEFAULT '',
      failed_at TIMESTAMPTZ,
      github_issue_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL,
      suite_name TEXT,
      run_date TIMESTAMPTZ,
      total_count INTEGER NOT NULL DEFAULT 0,
      passed_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      results JSONB NOT NULL DEFAULT '[]',
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS flake_cache (
      test_case_id INTEGER PRIMARY KEY,
      test_case_title TEXT,
      flake_rate NUMERIC,
      hypothesis TEXT,
      generated_at TIMESTAMPTZ,
      notified_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'system',
      default_severity_for_new_bugs TEXT NOT NULL DEFAULT 'Minor',
      default_page_size INTEGER NOT NULL DEFAULT 20,
      timezone TEXT NOT NULL DEFAULT '',
      auto_generate_report_after_run BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);
}

// ── Seeding ───────────────────────────────────────────────────────────────

async function seedIfEmpty(client) {
  const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int as count FROM test_cases');
  if (count > 0) return;

  const now = new Date();
  const d2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const ts = now.toISOString();

  // Test cases
  const tcRows = [];
  const SEED_TC = [
    { title: 'Log in with valid credentials', scenario: 'Given a registered user account exists\nWhen they enter a valid email and password on the login screen\nAnd click the login button\nThen the user is authenticated and redirected to the home screen', severity: 'Critical', status: 'passed' },
    { title: 'Log in with invalid password', scenario: 'Given a registered user account exists\nWhen they enter a valid email and an incorrect password on the login screen\nAnd click the login button\nThen an error message is displayed\nAnd the user remains on the login screen', severity: 'Critical', status: 'ready' },
    { title: 'Link a partner account', scenario: 'Given the user is logged in\nWhen they go to the Rewards page\nAnd open the partnership entry point\nAnd submit valid partner credentials\nThen the partner account is linked and visible in the app', severity: 'Major', status: 'draft' },
    { title: 'View rewards balance', scenario: 'Given the user is logged in\nWhen they navigate to the Rewards page\nThen the page loads and displays the current rewards balance', severity: 'Minor', status: 'ready' },
    { title: 'Log out of the app', scenario: 'Given the user is logged in\nWhen they click the logout button\nThen the user is signed out and redirected to the login screen', severity: 'Major', status: 'passed' },
  ];
  for (const tc of SEED_TC) {
    const { rows } = await client.query(
      `INSERT INTO test_cases (title, scenario, severity, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
      [tc.title, tc.scenario, tc.severity, tc.status, ts]
    );
    tcRows.push(rows[0]);
  }
  const [tc0, tc1, tc2, tc3, tc4] = tcRows.map(r => r.id);

  // Suites
  const { rows: [s1] } = await client.query(
    `INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
    ['Login Smoke Suite', 'login', 'ready', ts]
  );
  const { rows: [s2] } = await client.query(
    `INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`,
    ['Rewards Flow Suite', 'rewards', 'draft', ts]
  );
  for (const [sid, tcid, so] of [[s1.id, tc0, 1], [s1.id, tc1, 2], [s1.id, tc4, 3], [s2.id, tc0, 1], [s2.id, tc2, 2], [s2.id, tc3, 3]]) {
    await client.query(`INSERT INTO suite_cases (suite_id, test_case_id, sort_order) VALUES ($1, $2, $3)`, [sid, tcid, so]);
  }

  // Bugs
  const SEED_BUGS = [
    { title: 'Login button unresponsive on iOS Safari', description: 'The login button does not respond to taps on iOS Safari 16+. The issue occurs consistently and completely blocks users from signing in on that browser.', severity: 'Critical', priority: 'high', status: 'open', steps: ['Open the app in iOS Safari 16 or later', 'Enter a valid email and password', 'Tap the Login button'], expected: 'User is authenticated and redirected to the home screen.', actual: 'Nothing happens. The button briefly highlights on tap but no action is taken.', environment: 'iOS 16.4+, Safari, iPhone 13' },
    { title: 'Rewards balance does not update after redemption', description: 'After redeeming points, the balance shown on the Rewards page still reflects the pre-redemption amount until the user manually refreshes the page.', severity: 'Major', priority: 'medium', status: 'in-progress', steps: ['Log in to the app', 'Navigate to the Rewards page', 'Redeem any available offer', 'Observe the rewards balance displayed on screen'], expected: 'The balance decrements immediately after redemption to show the correct remaining points.', actual: 'The pre-redemption balance is still displayed. Refreshing the page shows the correct value.', environment: 'All platforms, all browsers' },
    { title: 'Profile avatar does not update in nav bar after upload', description: 'Uploading a new avatar on the Profile page updates the profile view but the avatar in the navigation bar continues to show the old image until the page is fully refreshed.', severity: 'Minor', priority: 'low', status: 'resolved', steps: ['Log in to the app', 'Navigate to Profile settings', 'Upload a new avatar image', 'Observe the avatar shown in the top navigation bar'], expected: 'The navigation bar avatar updates immediately after the upload completes.', actual: 'The old avatar remains in the nav bar. A full page refresh is required to see the new one.', environment: 'Chrome 120, macOS Sonoma' },
  ];
  const bugIds = [];
  for (const b of SEED_BUGS) {
    const { rows } = await client.query(
      `INSERT INTO bugs (title, description, severity, priority, status, steps_to_reproduce, expected, actual, environment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`,
      [b.title, b.description, b.severity, b.priority, b.status, JSON.stringify(b.steps), b.expected, b.actual, b.environment, ts]
    );
    bugIds.push(rows[0].id);
  }

  // Bug activity
  for (const a of [
    { bug_id: bugIds[1], action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Assigned to rewards team. Investigation started.', timestamp: d2 },
    { bug_id: bugIds[2], action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Picked up for fix.', timestamp: d2 },
    { bug_id: bugIds[2], action: 'status_change', old_value: 'in-progress', new_value: 'resolved', message: 'Fixed by subscribing the nav bar avatar to the profile state store.', timestamp: d1 },
  ]) {
    await client.query(
      `INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp) VALUES ($1, $2, $3, $4, $5, $6)`,
      [a.bug_id, a.action, a.old_value, a.new_value, a.message, a.timestamp]
    );
  }

  // Test runs
  const { rows: [run1] } = await client.query(
    `INSERT INTO test_runs (suite_id, suite_name, status, pass_count, fail_count, skip_count, start_time, end_time, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $7, $7) RETURNING id`,
    [s1.id, 'Login Smoke Suite', 'completed', 1, 1, 1, d2, 'seed']
  );
  const { rows: [run2] } = await client.query(
    `INSERT INTO test_runs (suite_id, suite_name, status, pass_count, fail_count, skip_count, start_time, end_time, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $7, $7) RETURNING id`,
    [s1.id, 'Login Smoke Suite', 'completed', 2, 1, 0, d1, 'seed']
  );

  // Run 1 results (2 days ago)
  for (const r of [
    { tc: tc0, title: 'Log in with valid credentials', sev: 'Critical', so: 1, res: 'passed', ms: 342, notes: '', fa: null, gh: null },
    { tc: tc1, title: 'Log in with invalid password', sev: 'Critical', so: 2, res: 'failed', ms: 891, notes: 'Error message not displayed — page reloads silently instead of showing validation feedback.', fa: d2, gh: 'https://github.com/slitvinova/bootcamp-app/issues/2' },
    { tc: tc4, title: 'Log out of the app', sev: 'Major', so: 3, res: 'skipped', ms: null, notes: 'Skipped — blocked by login failure.', fa: null, gh: null },
  ]) {
    await client.query(
      `INSERT INTO test_run_results (run_id, test_case_id, test_case_title, test_case_severity, sort_order, result, duration_ms, notes, failed_at, github_issue_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
      [run1.id, r.tc, r.title, r.sev, r.so, r.res, r.ms, r.notes, r.fa, r.gh, d2]
    );
  }

  // Run 2 results (1 day ago)
  for (const r of [
    { tc: tc0, title: 'Log in with valid credentials', sev: 'Critical', so: 1, res: 'failed', ms: 1203, notes: 'Login succeeded but redirect to home timed out — user landed on blank screen.', fa: d1, gh: null },
    { tc: tc1, title: 'Log in with invalid password', sev: 'Critical', so: 2, res: 'passed', ms: 412, notes: '', fa: null, gh: null },
    { tc: tc4, title: 'Log out of the app', sev: 'Major', so: 3, res: 'passed', ms: 289, notes: '', fa: null, gh: null },
  ]) {
    await client.query(
      `INSERT INTO test_run_results (run_id, test_case_id, test_case_title, test_case_severity, sort_order, result, duration_ms, notes, failed_at, github_issue_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
      [run2.id, r.tc, r.title, r.sev, r.so, r.res, r.ms, r.notes, r.fa, r.gh, d1]
    );
  }

  // Report for run 1
  await client.query(
    `INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [run1.id, 'Login Smoke Suite', d2, 3, 1, 1, 1, JSON.stringify([
      { test_case_id: tc0, title: 'Log in with valid credentials', severity: 'Critical', result: 'passed', notes: '', github_issue_url: null, duration_ms: 342 },
      { test_case_id: tc1, title: 'Log in with invalid password', severity: 'Critical', result: 'failed', notes: 'Error message not displayed — page reloads silently instead of showing validation feedback.', github_issue_url: 'https://github.com/slitvinova/bootcamp-app/issues/2', duration_ms: 891 },
      { test_case_id: tc4, title: 'Log out of the app', severity: 'Major', result: 'skipped', notes: 'Skipped — blocked by login failure.', github_issue_url: null, duration_ms: null },
    ]), ts]
  );

  // Flake cache (tc0 and tc1 appear in both runs with mixed results)
  for (const entry of [
    { id: tc0, title: 'Log in with valid credentials', rate: 0.5, hypothesis: 'Likely a race condition between the session write and the post-login redirect handler under variable server load.', gen: d2, notified: d2 },
    { id: tc1, title: 'Log in with invalid password', rate: 0.5, hypothesis: 'Error message rendering depends on a DOM paint cycle that completes inconsistently in CI environments.', gen: d2, notified: d2 },
  ]) {
    await client.query(
      `INSERT INTO flake_cache (test_case_id, test_case_title, flake_rate, hypothesis, generated_at, notified_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [entry.id, entry.title, entry.rate, entry.hypothesis, entry.gen, entry.notified]
    );
  }
}

async function setup() {
  await createTables();
  // Ensure the single user_preferences row exists
  await pool.query(`
    INSERT INTO user_preferences (id, theme, default_severity_for_new_bugs, default_page_size, timezone, auto_generate_report_after_run)
    VALUES (1, 'system', 'Minor', 20, '', TRUE)
    ON CONFLICT (id) DO NOTHING
  `);
  // Seed initial data if the database is empty
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seedIfEmpty(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Test Cases ────────────────────────────────────────────────────────────

const SEVERITY_ORDER = `CASE severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 WHEN 'Minor' THEN 3 WHEN 'Trivial' THEN 4 ELSE 5 END`;

const db = {
  async list({ page = 1, limit = 20, status, search, sort = 'updated_at', order = 'desc' } = {}) {
    const LIMIT = [10, 20, 50, 100].includes(Number(limit)) ? Number(limit) : 20;
    const offset = (Number(page) - 1) * LIMIT;
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    const VALID_SORT = { updated_at: 'updated_at', created_at: 'created_at', severity: null };
    const sortCol = Object.prototype.hasOwnProperty.call(VALID_SORT, sort) ? sort : 'updated_at';
    const orderClause = sortCol === 'severity' ? `${SEVERITY_ORDER} ${dir}` : `${sortCol} ${dir}`;

    const params = [];
    let where = '';
    if (status) { params.push(status); where += ` AND status = $${params.length}`; }
    if (search) { params.push(`%${search.toLowerCase()}%`); where += ` AND LOWER(title) LIKE $${params.length}`; }

    const base = `FROM test_cases WHERE 1=1${where}`;
    const [dataRes, countRes] = await Promise.all([
      pool.query(`SELECT * ${base} ORDER BY ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, LIMIT, offset]),
      pool.query(`SELECT COUNT(*)::int as total ${base}`, params),
    ]);
    return { rows: dataRes.rows, total: countRes.rows[0].total };
  },

  async get(id) {
    const { rows } = await pool.query('SELECT * FROM test_cases WHERE id = $1', [Number(id)]);
    return rows[0] || null;
  },

  async create(fields) {
    const { title, scenario, severity, status = 'draft' } = fields;
    const { rows } = await pool.query(
      `INSERT INTO test_cases (title, scenario, severity, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [title, scenario, severity, status]
    );
    return rows[0];
  },

  async update(id, fields) {
    const { title, scenario, severity, status } = fields;
    const { rows } = await pool.query(
      `UPDATE test_cases SET title=$1, scenario=$2, severity=$3, status=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [title, scenario, severity, status, Number(id)]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await pool.query('DELETE FROM test_cases WHERE id = $1', [Number(id)]);
    return rowCount > 0;
  },

  // ── Suites ──────────────────────────────────────────────────────────────

  suites: {
    async list({ status } = {}) {
      const params = [];
      let where = '';
      if (status) { params.push(status); where = ` WHERE s.status = $1`; }
      const { rows } = await pool.query(
        `SELECT s.*, COUNT(sc.test_case_id)::int as case_count
         FROM suites s
         LEFT JOIN suite_cases sc ON sc.suite_id = s.id
         ${where}
         GROUP BY s.id
         ORDER BY s.updated_at DESC`,
        params
      );
      return rows;
    },

    async get(id) {
      const { rows: suiteRows } = await pool.query('SELECT * FROM suites WHERE id = $1', [Number(id)]);
      if (!suiteRows[0]) return null;
      const { rows: caseRows } = await pool.query(
        `SELECT tc.*, sc.sort_order FROM suite_cases sc JOIN test_cases tc ON tc.id = sc.test_case_id WHERE sc.suite_id = $1 ORDER BY sc.sort_order ASC`,
        [Number(id)]
      );
      return { ...suiteRows[0], cases: caseRows };
    },

    async create(fields) {
      const { name, feature, status = 'draft' } = fields;
      const { rows } = await pool.query(
        `INSERT INTO suites (name, feature, status, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`,
        [name, feature, status]
      );
      return rows[0];
    },

    async update(id, fields) {
      const { name, feature, status } = fields;
      const { rows } = await pool.query(
        `UPDATE suites SET name=$1, feature=$2, status=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
        [name, feature, status, Number(id)]
      );
      return rows[0] || null;
    },

    async remove(id) {
      await pool.query('DELETE FROM suite_cases WHERE suite_id = $1', [Number(id)]);
      const { rowCount } = await pool.query('DELETE FROM suites WHERE id = $1', [Number(id)]);
      return rowCount > 0;
    },

    async addCase(suiteId, testCaseId) {
      const { rows: exists } = await pool.query(
        'SELECT 1 FROM suite_cases WHERE suite_id = $1 AND test_case_id = $2',
        [Number(suiteId), Number(testCaseId)]
      );
      if (exists.length > 0) return null;
      const { rows: [{ max_order }] } = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM suite_cases WHERE suite_id = $1',
        [Number(suiteId)]
      );
      await pool.query(
        'INSERT INTO suite_cases (suite_id, test_case_id, sort_order) VALUES ($1, $2, $3)',
        [Number(suiteId), Number(testCaseId), max_order + 1]
      );
      await pool.query('UPDATE suites SET updated_at = NOW() WHERE id = $1', [Number(suiteId)]);
      return true;
    },

    async removeCase(suiteId, testCaseId) {
      const { rowCount } = await pool.query(
        'DELETE FROM suite_cases WHERE suite_id = $1 AND test_case_id = $2',
        [Number(suiteId), Number(testCaseId)]
      );
      if (rowCount === 0) return false;
      // Re-normalise sort_order
      const { rows } = await pool.query(
        'SELECT test_case_id FROM suite_cases WHERE suite_id = $1 ORDER BY sort_order ASC',
        [Number(suiteId)]
      );
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (let i = 0; i < rows.length; i++) {
          await client.query(
            'UPDATE suite_cases SET sort_order = $1 WHERE suite_id = $2 AND test_case_id = $3',
            [i + 1, Number(suiteId), rows[i].test_case_id]
          );
        }
        await client.query('UPDATE suites SET updated_at = NOW() WHERE id = $1', [Number(suiteId)]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return true;
    },

    async reorder(suiteId, orderedIds) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
          await client.query(
            'UPDATE suite_cases SET sort_order = $1 WHERE suite_id = $2 AND test_case_id = $3',
            [i + 1, Number(suiteId), Number(orderedIds[i])]
          );
        }
        await client.query('UPDATE suites SET updated_at = NOW() WHERE id = $1', [Number(suiteId)]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return true;
    },
  },

  // ── Bugs ──────────────────────────────────────────────────────────────────

  bugs: {
    async list({ status, severity, priority, search, sort = 'created_at', order = 'desc' } = {}) {
      const dir = order === 'asc' ? 'ASC' : 'DESC';
      const PRIORITY_ORDER = `CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END`;
      const VALID_SORT = { created_at: `created_at ${dir}`, updated_at: `updated_at ${dir}`, severity: `${SEVERITY_ORDER} ${dir}`, priority: `${PRIORITY_ORDER} ${dir}` };
      const orderClause = VALID_SORT[sort] || `created_at ${dir}`;

      const params = [];
      let where = '';
      const add = (cond, val) => { params.push(val); where += ` AND ${cond.replace('?', `$${params.length}`)}`; };
      if (status) add('status = ?', status);
      if (severity) add('severity = ?', severity);
      if (priority) add('priority = ?', priority);
      if (search) { params.push(`%${search.toLowerCase()}%`); where += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`; }

      const { rows } = await pool.query(`SELECT * FROM bugs WHERE 1=1${where} ORDER BY ${orderClause}`, params);
      return rows;
    },

    async get(id) {
      const { rows } = await pool.query('SELECT * FROM bugs WHERE id = $1', [Number(id)]);
      return rows[0] || null;
    },

    async create(fields) {
      const { title, description, severity, priority, status, steps_to_reproduce, expected, actual, environment } = fields;
      const { rows } = await pool.query(
        `INSERT INTO bugs (title, description, severity, priority, status, steps_to_reproduce, expected, actual, environment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
        [title, description, severity, priority, status, JSON.stringify(steps_to_reproduce || []), expected || '', actual || '', environment || '']
      );
      return rows[0];
    },

    async update(id, fields) {
      const { title, description, severity, priority, steps_to_reproduce, expected, actual, environment, github_issue_url } = fields;
      const { rows } = await pool.query(
        `UPDATE bugs SET title=$1, description=$2, severity=$3, priority=$4, steps_to_reproduce=$5, expected=$6, actual=$7, environment=$8, github_issue_url=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
        [title, description, severity, priority, JSON.stringify(steps_to_reproduce || []), expected || '', actual || '', environment || '', github_issue_url || null, Number(id)]
      );
      return rows[0] || null;
    },

    async remove(id) {
      await pool.query('DELETE FROM bug_activity WHERE bug_id = $1', [Number(id)]);
      const { rowCount } = await pool.query('DELETE FROM bugs WHERE id = $1', [Number(id)]);
      return rowCount > 0;
    },

    async changeStatus(id, newStatus, message, oldStatus) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: bugRows } = await client.query(
          `UPDATE bugs SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
          [newStatus, Number(id)]
        );
        if (!bugRows[0]) { await client.query('ROLLBACK'); return null; }
        await client.query(
          `INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [Number(id), 'status_change', oldStatus, newStatus, message || '']
        );
        await client.query('COMMIT');
        return bugRows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },

    async addComment(id, message) {
      const { rows } = await pool.query(
        `INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp) VALUES ($1, 'comment', NULL, NULL, $2, NOW()) RETURNING *`,
        [Number(id), message]
      );
      return rows[0];
    },

    async getActivity(id) {
      const { rows } = await pool.query(
        'SELECT * FROM bug_activity WHERE bug_id = $1 ORDER BY timestamp ASC',
        [Number(id)]
      );
      return rows;
    },

    async recentActivity(limit = 10) {
      const { rows } = await pool.query(
        `SELECT ba.*, b.title as bug_title FROM bug_activity ba LEFT JOIN bugs b ON b.id = ba.bug_id ORDER BY ba.timestamp DESC LIMIT $1`,
        [limit]
      );
      return rows;
    },
  },

  // ── Test Runs ─────────────────────────────────────────────────────────────

  testRuns: {
    async list() {
      const { rows } = await pool.query('SELECT * FROM test_runs ORDER BY created_at DESC');
      return rows;
    },

    async get(id) {
      const { rows: runRows } = await pool.query('SELECT * FROM test_runs WHERE id = $1', [Number(id)]);
      if (!runRows[0]) return null;
      const { rows: resultRows } = await pool.query(
        'SELECT * FROM test_run_results WHERE run_id = $1 ORDER BY sort_order ASC',
        [Number(id)]
      );
      return { ...runRows[0], results: resultRows };
    },

    async getResult(runId, resultId) {
      const { rows } = await pool.query(
        'SELECT * FROM test_run_results WHERE id = $1 AND run_id = $2',
        [Number(resultId), Number(runId)]
      );
      return rows[0] || null;
    },

    async getAllResultsForTestCase(testCaseId) {
      const { rows } = await pool.query(
        'SELECT * FROM test_run_results WHERE test_case_id = $1 AND result IS NOT NULL',
        [Number(testCaseId)]
      );
      return rows;
    },

    async listAllResults() {
      const { rows } = await pool.query('SELECT * FROM test_run_results');
      return rows;
    },

    async create(suiteId, createdBy) {
      const { rows: suiteRows } = await pool.query('SELECT * FROM suites WHERE id = $1', [Number(suiteId)]);
      if (!suiteRows[0]) return null;
      const suite = suiteRows[0];

      const { rows: caseRows } = await pool.query(
        `SELECT tc.*, sc.sort_order FROM suite_cases sc JOIN test_cases tc ON tc.id = sc.test_case_id WHERE sc.suite_id = $1 ORDER BY sc.sort_order ASC`,
        [Number(suiteId)]
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows: [run] } = await client.query(
          `INSERT INTO test_runs (suite_id, suite_name, status, pass_count, fail_count, skip_count, start_time, end_time, created_by, created_at, updated_at)
           VALUES ($1, $2, 'pending', 0, 0, 0, NOW(), NULL, $3, NOW(), NOW()) RETURNING *`,
          [Number(suiteId), suite.name, createdBy || 'user']
        );
        const resultRows = [];
        for (const tc of caseRows) {
          const { rows: [result] } = await client.query(
            `INSERT INTO test_run_results (run_id, test_case_id, test_case_title, test_case_severity, sort_order, result, duration_ms, notes, failed_at, github_issue_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NULL, NULL, '', NULL, NULL, NOW(), NOW()) RETURNING *`,
            [run.id, tc.id, tc.title, tc.severity, tc.sort_order]
          );
          resultRows.push(result);
        }
        await client.query('COMMIT');
        return { ...run, results: resultRows };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },

    async updateResult(runId, resultId, fields) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows: existingRows } = await client.query(
          'SELECT * FROM test_run_results WHERE id = $1 AND run_id = $2',
          [Number(resultId), Number(runId)]
        );
        if (!existingRows[0]) { await client.query('ROLLBACK'); return null; }
        const prev = existingRows[0];

        const failedAt = fields.result === 'failed' ? (prev.failed_at || new Date()) : null;
        const { rows: [updated] } = await client.query(
          `UPDATE test_run_results SET result=$1, notes=$2, duration_ms=$3, github_issue_url=$4, failed_at=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
          [fields.result, fields.notes ?? prev.notes, fields.duration_ms ?? prev.duration_ms, fields.github_issue_url !== undefined ? fields.github_issue_url : prev.github_issue_url, failedAt, Number(resultId)]
        );

        // Recalculate run counts
        const { rows: allResults } = await client.query(
          'SELECT result FROM test_run_results WHERE run_id = $1',
          [Number(runId)]
        );
        const pass_count = allResults.filter(r => r.result === 'passed').length;
        const fail_count = allResults.filter(r => r.result === 'failed').length;
        const skip_count = allResults.filter(r => r.result === 'skipped').length;
        const recorded = pass_count + fail_count + skip_count;
        const status = recorded === 0 ? 'pending' : recorded === allResults.length ? 'completed' : 'running';

        const { rows: [run] } = await client.query(
          `UPDATE test_runs SET pass_count=$1, fail_count=$2, skip_count=$3, status=$4, end_time=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
          [pass_count, fail_count, skip_count, status, status === 'completed' ? new Date() : null, Number(runId)]
        );

        await client.query('COMMIT');

        const { rows: resultRows } = await pool.query(
          'SELECT * FROM test_run_results WHERE run_id = $1 ORDER BY sort_order ASC',
          [Number(runId)]
        );
        return { ...run, results: resultRows };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
  },

  // ── Reports ───────────────────────────────────────────────────────────────

  reports: {
    async list() {
      const { rows } = await pool.query('SELECT * FROM reports ORDER BY generated_at DESC');
      return rows;
    },

    async get(id) {
      const { rows } = await pool.query('SELECT * FROM reports WHERE id = $1', [Number(id)]);
      return rows[0] || null;
    },

    async create(runId) {
      const { rows: runRows } = await pool.query('SELECT * FROM test_runs WHERE id = $1', [Number(runId)]);
      if (!runRows[0]) return null;
      const run = runRows[0];

      const { rows: resultRows } = await pool.query(
        'SELECT * FROM test_run_results WHERE run_id = $1 ORDER BY sort_order ASC',
        [Number(runId)]
      );
      const rr = resultRows.map(r => ({
        test_case_id: r.test_case_id,
        title: r.test_case_title,
        severity: r.test_case_severity,
        result: r.result,
        notes: r.notes,
        github_issue_url: r.github_issue_url,
        duration_ms: r.duration_ms,
      }));

      const { rows: [report] } = await pool.query(
        `INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [Number(runId), run.suite_name, run.start_time, rr.length,
         rr.filter(r => r.result === 'passed').length,
         rr.filter(r => r.result === 'failed').length,
         rr.filter(r => r.result === 'skipped').length,
         JSON.stringify(rr)]
      );
      return report;
    },
  },

  // ── Flake Cache ───────────────────────────────────────────────────────────

  flakeCache: {
    async get(testCaseId) {
      const { rows } = await pool.query('SELECT * FROM flake_cache WHERE test_case_id = $1', [Number(testCaseId)]);
      return rows[0] || null;
    },

    async set(testCaseId, patch) {
      const { rows: existing } = await pool.query('SELECT * FROM flake_cache WHERE test_case_id = $1', [Number(testCaseId)]);
      const base = existing[0] || {};
      const merged = { test_case_id: Number(testCaseId), ...base, ...patch };
      const { rows } = await pool.query(
        `INSERT INTO flake_cache (test_case_id, test_case_title, flake_rate, hypothesis, generated_at, notified_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (test_case_id) DO UPDATE SET
           test_case_title = $2, flake_rate = $3, hypothesis = $4, generated_at = $5, notified_at = $6
         RETURNING *`,
        [merged.test_case_id, merged.test_case_title || null, merged.flake_rate || null,
         merged.hypothesis || null, merged.generated_at || null, merged.notified_at || null]
      );
      return rows[0];
    },

    async pending() {
      const { rows } = await pool.query('SELECT * FROM flake_cache WHERE notified_at IS NULL');
      return rows;
    },

    async getAll() {
      const { rows } = await pool.query('SELECT * FROM flake_cache');
      return Object.fromEntries(rows.map(r => [r.test_case_id, r]));
    },
  },

  // ── Settings ──────────────────────────────────────────────────────────────

  settings: {
    async get() {
      const { rows } = await pool.query('SELECT * FROM user_preferences WHERE id = 1');
      return rows[0] || null;
    },

    async update(fields) {
      const allowed = ['theme', 'default_severity_for_new_bugs', 'default_page_size', 'timezone', 'auto_generate_report_after_run'];
      const sets = [];
      const params = [];
      for (const key of allowed) {
        if (key in fields) {
          params.push(fields[key]);
          sets.push(`${key} = $${params.length}`);
        }
      }
      if (sets.length === 0) return db.settings.get();
      params.push(1);
      const { rows } = await pool.query(
        `UPDATE user_preferences SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      return rows[0];
    },
  },

  setup,
};

module.exports = db;
