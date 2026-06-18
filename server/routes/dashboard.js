const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/metrics', (req, res) => {
  const { total: totalTestCases } = db.list({ limit: 1 });

  const allBugs = db.bugs.list();
  const openBugs = allBugs.filter(b => !['resolved', 'closed'].includes(b.status)).length;

  const allRuns = db.testRuns.list();
  const totalPassed = allRuns.reduce((s, r) => s + r.pass_count, 0);
  const totalRecorded = allRuns.reduce((s, r) => s + r.pass_count + r.fail_count + r.skip_count, 0);
  const passRate = totalRecorded > 0 ? Math.round((totalPassed / totalRecorded) * 100) : null;

  const completedRuns = allRuns.filter(r => r.status === 'completed' && r.start_time && r.end_time);
  let avgDurationMs = null;
  if (completedRuns.length > 0) {
    const totalMs = completedRuns.reduce((s, r) =>
      s + (new Date(r.end_time) - new Date(r.start_time)), 0);
    avgDurationMs = Math.round(totalMs / completedRuns.length);
  }

  res.json({
    success: true,
    data: {
      metrics: {
        total_test_cases: totalTestCases,
        pass_rate: passRate,
        open_bugs: openBugs,
        avg_duration_ms: avgDurationMs,
      },
      recent_runs: allRuns.slice(0, 10),
      recent_activity: db.bugs.recentActivity(10),
    },
    error: null,
  });
});

router.get('/trends', (req, res) => {
  // Pass rate per run — last 10 runs in chronological order
  const allRuns = db.testRuns.list();
  const trendRuns = allRuns.slice(0, 10).reverse();
  const pass_rate_trend = trendRuns.map(r => {
    const total = r.pass_count + r.fail_count + r.skip_count;
    const date = r.start_time
      ? new Date(r.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      : `#${r.id}`;
    return { date, pass_rate: total > 0 ? Math.round((r.pass_count / total) * 100) : null };
  });

  // Bugs opened vs closed — last 8 calendar weeks
  const nowMs = Date.now();
  const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
  const allBugs = db.bugs.list();
  const allActivity = db.bugs.recentActivity(9999);
  const bugs_by_week = [];
  for (let i = 7; i >= 0; i--) {
    const endMs = nowMs - i * MS_WEEK;
    const startMs = endMs - MS_WEEK;
    const label = new Date(startMs).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    bugs_by_week.push({
      week: label,
      opened: allBugs.filter(b => {
        const t = new Date(b.created_at).getTime();
        return t >= startMs && t < endMs;
      }).length,
      closed: allActivity.filter(a => {
        if (!['resolved', 'closed'].includes(a.new_value)) return false;
        const t = new Date(a.timestamp).getTime();
        return t >= startMs && t < endMs;
      }).length,
    });
  }

  // Test case counts by status
  const { rows: allCases } = db.list({ limit: 99999 });
  const counts = {};
  for (const tc of allCases) counts[tc.status] = (counts[tc.status] || 0) + 1;
  const coverage = ['draft', 'ready', 'passed', 'failed', 'skipped']
    .map(s => ({ status: s, count: counts[s] || 0 }))
    .filter(s => s.count > 0);

  res.json({ success: true, data: { pass_rate_trend, bugs_by_week, coverage }, error: null });
});

module.exports = router;
