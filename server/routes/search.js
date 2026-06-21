const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: { test_cases: [], bugs: [], suites: [] }, error: null });
    }

    const [{ rows: test_cases }, allBugs, suites] = await Promise.all([
      db.list({ search: q, limit: 5 }),
      db.bugs.list({ search: q }),
      db.suites.list({}),
    ]);

    const ql = q.toLowerCase();
    const filteredSuites = suites
      .filter(s => s.name.toLowerCase().includes(ql) || (s.feature || '').toLowerCase().includes(ql))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        test_cases: test_cases.slice(0, 5),
        bugs: allBugs.slice(0, 5),
        suites: filteredSuites,
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
