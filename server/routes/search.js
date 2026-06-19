const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) {
    return res.json({ success: true, data: { test_cases: [], bugs: [], suites: [] }, error: null });
  }

  const { rows: test_cases } = db.list({ search: q, limit: 5 });
  const allBugs = db.bugs.list({ search: q });
  const ql = q.toLowerCase();
  const suites = db.suites.list({})
    .filter(s => s.name.toLowerCase().includes(ql) || (s.feature || '').toLowerCase().includes(ql))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      test_cases: test_cases.slice(0, 5),
      bugs: allBugs.slice(0, 5),
      suites,
    },
    error: null,
  });
});

module.exports = router;
