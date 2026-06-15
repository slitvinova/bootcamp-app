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
  },
};

module.exports = db;
