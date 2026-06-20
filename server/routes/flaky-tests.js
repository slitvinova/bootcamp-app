const express = require('express');
const router = express.Router();
const db = require('../db');

function computeLeaderboard() {
  const allResults = db.testRuns.listAllResults().filter(r => r.result !== null);

  // Group by test_case_id
  const byTest = {};
  for (const r of allResults) {
    const id = r.test_case_id;
    if (!byTest[id]) {
      byTest[id] = {
        test_case_id: id,
        test_case_title: r.test_case_title,
        test_case_severity: r.test_case_severity,
        results: [],
      };
    }
    byTest[id].results.push(r);
  }

  const leaderboard = [];

  for (const entry of Object.values(byTest)) {
    const { results } = entry;
    const passes = results.filter(r => r.result === 'passed').length;
    const fails  = results.filter(r => r.result === 'failed').length;

    // Only include truly flaky tests (at least one pass AND one fail)
    if (passes < 1 || fails < 1) continue;

    const run_count = results.length;
    const flake_rate = Math.round((fails / (passes + fails)) * 100) / 100;

    // Recent pattern: last 10 results sorted chronologically
    const sorted = [...results].sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1));
    const recent_pattern = sorted.slice(-10).map(r => r.result);

    const cached = db.flakeCache.get(entry.test_case_id) || {};

    leaderboard.push({
      test_case_id: entry.test_case_id,
      test_case_title: entry.test_case_title,
      test_case_severity: entry.test_case_severity,
      run_count,
      pass_count: passes,
      fail_count: fails,
      flake_rate,
      recent_pattern,
      hypothesis: cached.hypothesis || null,
      generated_at: cached.generated_at || null,
    });
  }

  leaderboard.sort((a, b) => b.flake_rate - a.flake_rate);
  return leaderboard.slice(0, 10);
}

// GET /api/flaky-tests — top-10 flakiest tests
router.get('/', (req, res) => {
  const leaderboard = computeLeaderboard();
  const totalRuns = db.testRuns.list().length;
  res.json({
    success: true,
    data: { leaderboard, total_flaky: leaderboard.length, total_runs: totalRuns },
    error: null,
  });
});

// GET /api/flaky-tests/pending — entries awaiting Discord notification
router.get('/pending', (req, res) => {
  const pending = db.flakeCache.pending();
  res.json({ success: true, data: pending, error: null });
});

// PUT /api/flaky-tests/:id/hypothesis — store AI-generated hypothesis
router.put('/:id/hypothesis', (req, res) => {
  const { hypothesis } = req.body;
  if (!hypothesis || typeof hypothesis !== 'string') {
    return res.status(400).json({ success: false, data: null, error: 'hypothesis is required.' });
  }
  const entry = db.flakeCache.set(req.params.id, {
    hypothesis: hypothesis.trim(),
    generated_at: new Date().toISOString(),
  });
  res.json({ success: true, data: entry, error: null });
});

// POST /api/flaky-tests/:id/mark-notified — mark Discord alert as sent
router.post('/:id/mark-notified', (req, res) => {
  const entry = db.flakeCache.set(req.params.id, {
    notified_at: new Date().toISOString(),
  });
  res.json({ success: true, data: entry, error: null });
});

module.exports = router;
