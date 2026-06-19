const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const SEED = [
  {
    title: 'Log in with valid credentials',
    scenario: 'Given a registered user account exists\nWhen they enter a valid email and password on the login screen\nAnd click the login button\nThen the user is authenticated and redirected to the home screen',
    severity: 'Critical',
    status: 'passed',
  },
  {
    title: 'Log in with invalid password',
    scenario: 'Given a registered user account exists\nWhen they enter a valid email and an incorrect password on the login screen\nAnd click the login button\nThen an error message is displayed\nAnd the user remains on the login screen',
    severity: 'Critical',
    status: 'ready',
  },
  {
    title: 'Link a partner account',
    scenario: 'Given the user is logged in\nWhen they go to the Rewards page\nAnd open the partnership entry point\nAnd submit valid partner credentials\nThen the partner account is linked and visible in the app',
    severity: 'Major',
    status: 'draft',
  },
  {
    title: 'View rewards balance',
    scenario: 'Given the user is logged in\nWhen they navigate to the Rewards page\nThen the page loads and displays the current rewards balance',
    severity: 'Minor',
    status: 'ready',
  },
  {
    title: 'Log out of the app',
    scenario: 'Given the user is logged in\nWhen they click the logout button\nThen the user is signed out and redirected to the login screen',
    severity: 'Major',
    status: 'passed',
  },
];

const SEED_SUITES = [
  { name: 'Login Smoke Suite', feature: 'login', status: 'ready' },
  { name: 'Rewards Flow Suite', feature: 'rewards', status: 'draft' },
];

// suite index (0-based) -> test case IDs in order
const SEED_SUITE_CASES = [
  [1, 2, 5], // Login Smoke Suite
  [1, 3, 4], // Rewards Flow Suite
];

const SEED_BUGS = [
  {
    title: 'Login button unresponsive on iOS Safari',
    description: 'The login button does not respond to taps on iOS Safari 16+. The issue occurs consistently and completely blocks users from signing in on that browser.',
    severity: 'Critical',
    priority: 'high',
    status: 'open',
    steps_to_reproduce: [
      'Open the app in iOS Safari 16 or later',
      'Enter a valid email and password',
      'Tap the Login button',
    ],
    expected: 'User is authenticated and redirected to the home screen.',
    actual: 'Nothing happens. The button briefly highlights on tap but no action is taken.',
    environment: 'iOS 16.4+, Safari, iPhone 13',
  },
  {
    title: 'Rewards balance does not update after redemption',
    description: 'After redeeming points, the balance shown on the Rewards page still reflects the pre-redemption amount until the user manually refreshes the page.',
    severity: 'Major',
    priority: 'medium',
    status: 'in-progress',
    steps_to_reproduce: [
      'Log in to the app',
      'Navigate to the Rewards page',
      'Redeem any available offer',
      'Observe the rewards balance displayed on screen',
    ],
    expected: 'The balance decrements immediately after redemption to show the correct remaining points.',
    actual: 'The pre-redemption balance is still displayed. Refreshing the page shows the correct value.',
    environment: 'All platforms, all browsers',
  },
  {
    title: 'Profile avatar does not update in nav bar after upload',
    description: 'Uploading a new avatar on the Profile page updates the profile view but the avatar in the navigation bar continues to show the old image until the page is fully refreshed.',
    severity: 'Minor',
    priority: 'low',
    status: 'resolved',
    steps_to_reproduce: [
      'Log in to the app',
      'Navigate to Profile settings',
      'Upload a new avatar image',
      'Observe the avatar shown in the top navigation bar',
    ],
    expected: 'The navigation bar avatar updates immediately after the upload completes.',
    actual: 'The old avatar remains in the nav bar. A full page refresh is required to see the new one.',
    environment: 'Chrome 120, macOS Sonoma',
  },
];

const SEED_TEST_RUNS = [
  {
    suite_id: 1,
    suite_name: 'Login Smoke Suite',
    status: 'completed',
    pass_count: 1,
    fail_count: 1,
    skip_count: 1,
    created_by: 'seed',
  },
];

function buildTestRunSeed(ts) {
  const d1ago = new Date(new Date(ts).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const runs = SEED_TEST_RUNS.map((r, i) => ({
    id: i + 1,
    ...r,
    start_time: d1ago,
    end_time: d1ago,
    created_at: d1ago,
    updated_at: d1ago,
  }));
  const results = [
    {
      id: 1, run_id: 1, test_case_id: 1,
      test_case_title: 'Log in with valid credentials', test_case_severity: 'Critical',
      sort_order: 1, result: 'passed', duration_ms: 342, notes: '',
      failed_at: null, github_issue_url: null, created_at: d1ago, updated_at: d1ago,
    },
    {
      id: 2, run_id: 1, test_case_id: 2,
      test_case_title: 'Log in with invalid password', test_case_severity: 'Critical',
      sort_order: 2, result: 'failed', duration_ms: 891,
      notes: 'Error message not displayed — page reloads silently instead of showing validation feedback.',
      failed_at: d1ago, github_issue_url: 'https://github.com/slitvinova/bootcamp-app/issues/2',
      created_at: d1ago, updated_at: d1ago,
    },
    {
      id: 3, run_id: 1, test_case_id: 5,
      test_case_title: 'Log out of the app', test_case_severity: 'Major',
      sort_order: 3, result: 'skipped', duration_ms: null,
      notes: 'Skipped — blocked by login failure.',
      failed_at: null, github_issue_url: null, created_at: d1ago, updated_at: d1ago,
    },
  ];
  return { runs, results };
}

function buildReportSeed(ts) {
  const { runs, results } = buildTestRunSeed(ts);
  const run = runs[0];
  const rr = results.filter(r => r.run_id === run.id);
  return [{
    id: 1,
    run_id: run.id,
    suite_name: run.suite_name,
    run_date: run.start_time,
    total_count: rr.length,
    passed_count: rr.filter(r => r.result === 'passed').length,
    failed_count: rr.filter(r => r.result === 'failed').length,
    skipped_count: rr.filter(r => r.result === 'skipped').length,
    results: rr.map(r => ({
      test_case_id: r.test_case_id,
      title: r.test_case_title,
      severity: r.test_case_severity,
      result: r.result,
      notes: r.notes,
      github_issue_url: r.github_issue_url,
      duration_ms: r.duration_ms,
    })),
    generated_at: ts,
  }];
}

function buildBugActivities(ts) {
  const d2ago = new Date(new Date(ts).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const d1ago = new Date(new Date(ts).getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  return [
    { bug_id: 2, action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Assigned to rewards team. Investigation started.', timestamp: d2ago },
    { bug_id: 3, action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Picked up for fix.', timestamp: d2ago },
    { bug_id: 3, action: 'status_change', old_value: 'in-progress', new_value: 'resolved', message: 'Fixed by subscribing the nav bar avatar to the profile state store.', timestamp: d1ago },
  ];
}

function now() {
  return new Date().toISOString();
}

function buildSuiteCases(ts) {
  return SEED_SUITE_CASES.flatMap((caseIds, si) =>
    caseIds.map((tcId, i) => ({
      suite_id: si + 1,
      test_case_id: tcId,
      sort_order: i + 1,
    }))
  );
}

function read() {
  if (!fs.existsSync(DB_PATH)) {
    const ts = now();
    const initial = {
      nextId: SEED.length + 1,
      testCases: SEED.map((tc, i) => ({ id: i + 1, ...tc, created_at: ts, updated_at: ts })),
      nextSuiteId: SEED_SUITES.length + 1,
      suites: SEED_SUITES.map((s, i) => ({ id: i + 1, ...s, created_at: ts, updated_at: ts })),
      suiteCases: buildSuiteCases(ts),
      nextSuiteCaseId: buildSuiteCases(ts).length + 1,
      nextBugId: SEED_BUGS.length + 1,
      bugs: SEED_BUGS.map((b, i) => ({ id: i + 1, ...b, created_at: ts, updated_at: ts })),
      nextBugActivityId: buildBugActivities(ts).length + 1,
      bugActivity: buildBugActivities(ts).map((a, i) => ({ id: i + 1, ...a })),
      nextTestRunId: 2,
      nextTestRunResultId: 4,
      testRuns: buildTestRunSeed(ts).runs,
      testRunResults: buildTestRunSeed(ts).results,
      nextReportId: 2,
      reports: buildReportSeed(ts),
      user_preferences: {
        theme: 'system',
        default_severity_for_new_bugs: 'Minor',
        default_page_size: 20,
        timezone: '',
        auto_generate_report_after_run: true,
      },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  // Migration: add suite tables if this is a pre-suite data.json
  if (!data.suites) {
    const ts = now();
    data.nextSuiteId = SEED_SUITES.length + 1;
    data.suites = SEED_SUITES.map((s, i) => ({ id: i + 1, ...s, created_at: ts, updated_at: ts }));
    data.suiteCases = buildSuiteCases(ts);
    data.nextSuiteCaseId = data.suiteCases.length + 1;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // Migration: add bugs tables if missing
  if (!data.bugs) {
    const ts = now();
    const acts = buildBugActivities(ts);
    data.nextBugId = SEED_BUGS.length + 1;
    data.bugs = SEED_BUGS.map((b, i) => ({ id: i + 1, ...b, created_at: ts, updated_at: ts }));
    data.nextBugActivityId = acts.length + 1;
    data.bugActivity = acts.map((a, i) => ({ id: i + 1, ...a }));
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // Migration: add test runs tables if missing
  if (!data.testRuns) {
    const ts = now();
    const seed = buildTestRunSeed(ts);
    data.nextTestRunId = 2;
    data.nextTestRunResultId = 4;
    data.testRuns = seed.runs;
    data.testRunResults = seed.results;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // Migration: add reports table if missing
  if (!data.reports) {
    const ts = now();
    const run1 = (data.testRuns || []).find(r => r.id === 1);
    if (run1) {
      const rr = (data.testRunResults || [])
        .filter(r => r.run_id === 1)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(r => ({
          test_case_id: r.test_case_id,
          title: r.test_case_title,
          severity: r.test_case_severity,
          result: r.result,
          notes: r.notes,
          github_issue_url: r.github_issue_url,
          duration_ms: r.duration_ms,
        }));
      data.reports = [{
        id: 1,
        run_id: 1,
        suite_name: run1.suite_name,
        run_date: run1.start_time,
        total_count: rr.length,
        passed_count: rr.filter(r => r.result === 'passed').length,
        failed_count: rr.filter(r => r.result === 'failed').length,
        skipped_count: rr.filter(r => r.result === 'skipped').length,
        results: rr,
        generated_at: ts,
      }];
      data.nextReportId = 2;
    } else {
      data.reports = [];
      data.nextReportId = 1;
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // Migration: add user_preferences if missing
  if (!data.user_preferences) {
    data.user_preferences = {
      theme: 'system',
      default_severity_for_new_bugs: 'Minor',
      default_page_size: 20,
      timezone: '',
      auto_generate_report_after_run: true,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  return data;
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const SEVERITY_RANK = { Critical: 1, Major: 2, Minor: 3, Trivial: 4 };

const db = {
  // ── Test Cases ────────────────────────────────────────────────────────────

  list({ page = 1, limit = 20, status, search, sort = 'updated_at', order = 'desc' }) {
    let rows = read().testCases;
    if (status) rows = rows.filter(r => r.status === status);
    if (search) rows = rows.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
    rows.sort((a, b) => {
      const cmp = sort === 'severity'
        ? SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
        : a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });
    const total = rows.length;
    return { rows: rows.slice((page - 1) * limit, (page - 1) * limit + limit), total };
  },

  get(id) {
    return read().testCases.find(r => r.id === Number(id)) || null;
  },

  create(fields) {
    const data = read();
    const ts = now();
    const record = { id: data.nextId++, ...fields, created_at: ts, updated_at: ts };
    data.testCases.push(record);
    write(data);
    return record;
  },

  update(id, fields) {
    const data = read();
    const idx = data.testCases.findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    data.testCases[idx] = { ...data.testCases[idx], ...fields, updated_at: now() };
    write(data);
    return data.testCases[idx];
  },

  remove(id) {
    const data = read();
    const idx = data.testCases.findIndex(r => r.id === Number(id));
    if (idx === -1) return false;
    data.testCases.splice(idx, 1);
    write(data);
    return true;
  },

  // ── Suites ────────────────────────────────────────────────────────────────

  suites: {
    list({ status } = {}) {
      const data = read();
      let suites = data.suites;
      if (status) suites = suites.filter(s => s.status === status);
      return suites
        .map(s => ({
          ...s,
          case_count: data.suiteCases.filter(sc => sc.suite_id === s.id).length,
        }))
        .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
    },

    get(id) {
      const data = read();
      const suite = data.suites.find(s => s.id === Number(id));
      if (!suite) return null;
      const cases = data.suiteCases
        .filter(sc => sc.suite_id === Number(id))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(sc => {
          const tc = data.testCases.find(t => t.id === sc.test_case_id);
          return tc ? { ...tc, sort_order: sc.sort_order } : null;
        })
        .filter(Boolean);
      return { ...suite, cases };
    },

    create(fields) {
      const data = read();
      const ts = now();
      const suite = { id: data.nextSuiteId++, ...fields, created_at: ts, updated_at: ts };
      data.suites.push(suite);
      write(data);
      return suite;
    },

    update(id, fields) {
      const data = read();
      const idx = data.suites.findIndex(s => s.id === Number(id));
      if (idx === -1) return null;
      data.suites[idx] = { ...data.suites[idx], ...fields, updated_at: now() };
      write(data);
      return data.suites[idx];
    },

    remove(id) {
      const data = read();
      const idx = data.suites.findIndex(s => s.id === Number(id));
      if (idx === -1) return false;
      data.suites.splice(idx, 1);
      data.suiteCases = data.suiteCases.filter(sc => sc.suite_id !== Number(id));
      write(data);
      return true;
    },

    addCase(suiteId, testCaseId) {
      const data = read();
      const already = data.suiteCases.find(
        sc => sc.suite_id === Number(suiteId) && sc.test_case_id === Number(testCaseId)
      );
      if (already) return null;
      const maxOrder = data.suiteCases
        .filter(sc => sc.suite_id === Number(suiteId))
        .reduce((m, sc) => Math.max(m, sc.sort_order), 0);
      data.suiteCases.push({ suite_id: Number(suiteId), test_case_id: Number(testCaseId), sort_order: maxOrder + 1 });
      const si = data.suites.findIndex(s => s.id === Number(suiteId));
      if (si !== -1) data.suites[si].updated_at = now();
      write(data);
      return true;
    },

    removeCase(suiteId, testCaseId) {
      const data = read();
      const idx = data.suiteCases.findIndex(
        sc => sc.suite_id === Number(suiteId) && sc.test_case_id === Number(testCaseId)
      );
      if (idx === -1) return false;
      data.suiteCases.splice(idx, 1);
      // Re-normalise sort_order
      data.suiteCases
        .filter(sc => sc.suite_id === Number(suiteId))
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((sc, i) => { sc.sort_order = i + 1; });
      const si = data.suites.findIndex(s => s.id === Number(suiteId));
      if (si !== -1) data.suites[si].updated_at = now();
      write(data);
      return true;
    },

    reorder(suiteId, orderedIds) {
      const data = read();
      orderedIds.forEach((tcId, i) => {
        const sc = data.suiteCases.find(
          s => s.suite_id === Number(suiteId) && s.test_case_id === Number(tcId)
        );
        if (sc) sc.sort_order = i + 1;
      });
      const si = data.suites.findIndex(s => s.id === Number(suiteId));
      if (si !== -1) data.suites[si].updated_at = now();
      write(data);
      return true;
    },
  },

  // ── Bugs ──────────────────────────────────────────────────────────────────

  bugs: {
    list({ status, severity, priority, search, sort = 'created_at', order = 'desc' } = {}) {
      const data = read();
      let rows = data.bugs || [];
      if (status)   rows = rows.filter(r => r.status === status);
      if (severity) rows = rows.filter(r => r.severity === severity);
      if (priority) rows = rows.filter(r => r.priority === priority);
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(r =>
          r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
        );
      }
      const SEVERITY_RANK = { Critical: 1, Major: 2, Minor: 3, Trivial: 4 };
      const PRIORITY_RANK = { high: 1, medium: 2, low: 3 };
      rows = [...rows].sort((a, b) => {
        let cmp;
        if (sort === 'severity') cmp = (SEVERITY_RANK[a.severity] || 5) - (SEVERITY_RANK[b.severity] || 5);
        else if (sort === 'priority') cmp = (PRIORITY_RANK[a.priority] || 5) - (PRIORITY_RANK[b.priority] || 5);
        else cmp = a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : 0;
        return order === 'asc' ? cmp : -cmp;
      });
      return rows;
    },

    get(id) {
      return (read().bugs || []).find(r => r.id === Number(id)) || null;
    },

    create(fields) {
      const data = read();
      const ts = now();
      data.bugs = data.bugs || [];
      const bug = { id: data.nextBugId++, ...fields, created_at: ts, updated_at: ts };
      data.bugs.push(bug);
      write(data);
      return bug;
    },

    update(id, fields) {
      const data = read();
      const idx = (data.bugs || []).findIndex(r => r.id === Number(id));
      if (idx === -1) return null;
      data.bugs[idx] = { ...data.bugs[idx], ...fields, updated_at: now() };
      write(data);
      return data.bugs[idx];
    },

    remove(id) {
      const data = read();
      const idx = (data.bugs || []).findIndex(r => r.id === Number(id));
      if (idx === -1) return false;
      data.bugs.splice(idx, 1);
      data.bugActivity = (data.bugActivity || []).filter(a => a.bug_id !== Number(id));
      write(data);
      return true;
    },

    changeStatus(id, newStatus, message, oldStatus) {
      const data = read();
      const idx = (data.bugs || []).findIndex(r => r.id === Number(id));
      if (idx === -1) return null;
      data.bugs[idx] = { ...data.bugs[idx], status: newStatus, updated_at: now() };
      data.bugActivity = data.bugActivity || [];
      data.bugActivity.push({
        id: data.nextBugActivityId++,
        bug_id: Number(id),
        action: 'status_change',
        old_value: oldStatus,
        new_value: newStatus,
        message: message || '',
        timestamp: now(),
      });
      write(data);
      return data.bugs[idx];
    },

    addComment(id, message) {
      const data = read();
      data.bugActivity = data.bugActivity || [];
      data.bugActivity.push({
        id: data.nextBugActivityId++,
        bug_id: Number(id),
        action: 'comment',
        old_value: null,
        new_value: null,
        message,
        timestamp: now(),
      });
      write(data);
      return data.bugActivity[data.bugActivity.length - 1];
    },

    getActivity(id) {
      return (read().bugActivity || [])
        .filter(a => a.bug_id === Number(id))
        .sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
    },

    recentActivity(limit = 10) {
      const data = read();
      const bugMap = Object.fromEntries((data.bugs || []).map(b => [b.id, b.title]));
      return (data.bugActivity || [])
        .slice()
        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
        .slice(0, limit)
        .map(a => ({ ...a, bug_title: bugMap[a.bug_id] || null }));
    },
  },
  // ── Test Runs ─────────────────────────────────────────────────────────────

  testRuns: {
    list() {
      const data = read();
      return (data.testRuns || []).slice().sort((a, b) =>
        b.created_at > a.created_at ? 1 : -1
      );
    },

    get(id) {
      const data = read();
      const run = (data.testRuns || []).find(r => r.id === Number(id));
      if (!run) return null;
      const results = (data.testRunResults || [])
        .filter(r => r.run_id === Number(id))
        .sort((a, b) => a.sort_order - b.sort_order);
      return { ...run, results };
    },

    getResult(runId, resultId) {
      return (read().testRunResults || [])
        .find(r => r.id === Number(resultId) && r.run_id === Number(runId)) || null;
    },

    create(suiteId, createdBy) {
      const data = read();
      const suite = (data.suites || []).find(s => s.id === Number(suiteId));
      if (!suite) return null;
      const suiteCases = (data.suiteCases || [])
        .filter(sc => sc.suite_id === Number(suiteId))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(sc => {
          const tc = (data.testCases || []).find(t => t.id === sc.test_case_id);
          return tc ? { ...tc, sort_order: sc.sort_order } : null;
        })
        .filter(Boolean);
      const ts = now();
      const run = {
        id: data.nextTestRunId++,
        suite_id: Number(suiteId),
        suite_name: suite.name,
        status: 'pending',
        pass_count: 0,
        fail_count: 0,
        skip_count: 0,
        start_time: ts,
        end_time: null,
        created_by: createdBy || 'user',
        created_at: ts,
        updated_at: ts,
      };
      data.testRuns = data.testRuns || [];
      data.testRuns.push(run);
      data.testRunResults = data.testRunResults || [];
      suiteCases.forEach(tc => {
        data.testRunResults.push({
          id: data.nextTestRunResultId++,
          run_id: run.id,
          test_case_id: tc.id,
          test_case_title: tc.title,
          test_case_severity: tc.severity,
          sort_order: tc.sort_order,
          result: null,
          duration_ms: null,
          notes: '',
          failed_at: null,
          github_issue_url: null,
          created_at: ts,
          updated_at: ts,
        });
      });
      write(data);
      const results = data.testRunResults
        .filter(r => r.run_id === run.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      return { ...run, results };
    },

    updateResult(runId, resultId, fields) {

      const data = read();
      const rIdx = (data.testRunResults || [])
        .findIndex(r => r.id === Number(resultId) && r.run_id === Number(runId));
      if (rIdx === -1) return null;
      const ts = now();
      const prev = data.testRunResults[rIdx];
      data.testRunResults[rIdx] = {
        ...prev,
        ...fields,
        failed_at: fields.result === 'failed'
          ? (prev.failed_at || ts)
          : null,
        updated_at: ts,
      };
      const runIdx = (data.testRuns || []).findIndex(r => r.id === Number(runId));
      if (runIdx === -1) return null;
      const all = (data.testRunResults || []).filter(r => r.run_id === Number(runId));
      const pass_count = all.filter(r => r.result === 'passed').length;
      const fail_count = all.filter(r => r.result === 'failed').length;
      const skip_count = all.filter(r => r.result === 'skipped').length;
      const recorded = pass_count + fail_count + skip_count;
      const status = recorded === 0 ? 'pending'
        : recorded === all.length ? 'completed'
        : 'running';
      data.testRuns[runIdx] = {
        ...data.testRuns[runIdx],
        pass_count,
        fail_count,
        skip_count,
        status,
        end_time: status === 'completed' ? ts : null,
        updated_at: ts,
      };
      write(data);
      const run = data.testRuns[runIdx];
      const results = all.sort((a, b) => a.sort_order - b.sort_order);
      return { ...run, results };
    },
  },
  // ── Reports ───────────────────────────────────────────────────────────────

  reports: {
    list() {
      return (read().reports || [])
        .slice()
        .sort((a, b) => (b.generated_at > a.generated_at ? 1 : -1));
    },

    get(id) {
      return (read().reports || []).find(r => r.id === Number(id)) || null;
    },

    create(runId) {
      const data = read();
      const run = (data.testRuns || []).find(r => r.id === Number(runId));
      if (!run) return null;
      const rr = (data.testRunResults || [])
        .filter(r => r.run_id === Number(runId))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(r => ({
          test_case_id: r.test_case_id,
          title: r.test_case_title,
          severity: r.test_case_severity,
          result: r.result,
          notes: r.notes,
          github_issue_url: r.github_issue_url,
          duration_ms: r.duration_ms,
        }));
      const ts = now();
      const report = {
        id: data.nextReportId++,
        run_id: Number(runId),
        suite_name: run.suite_name,
        run_date: run.start_time,
        total_count: rr.length,
        passed_count: rr.filter(r => r.result === 'passed').length,
        failed_count: rr.filter(r => r.result === 'failed').length,
        skipped_count: rr.filter(r => r.result === 'skipped').length,
        results: rr,
        generated_at: ts,
      };
      data.reports = data.reports || [];
      data.reports.push(report);
      write(data);
      return report;
    },
  },
};

db.settings = {
  get() {
    return read().user_preferences;
  },
  update(fields) {
    const data = read();
    Object.assign(data.user_preferences, fields);
    write(data);
    return data.user_preferences;
  },
};

module.exports = db;
