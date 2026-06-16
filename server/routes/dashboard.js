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

module.exports = router;
