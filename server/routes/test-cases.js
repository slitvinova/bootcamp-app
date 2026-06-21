const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

router.get('/export', async (req, res) => {
  try {
    const { rows } = await db.list({ limit: 99999 });
    const headers = ['title', 'severity', 'scenario', 'status'];
    const lines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => csvCell(r[h])).join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="test-cases.csv"');
    res.send(lines.join('\r\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, sort = 'updated_at', order = 'desc' } = req.query;
    const LIMIT = [10, 20, 50, 100].includes(Number(limit)) ? Number(limit) : 20;
    const result = await db.list({ page: Number(page), limit: LIMIT, status, search, sort, order });
    res.json({ success: true, data: { ...result, page: Number(page), limit: LIMIT }, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, scenario, severity, status = 'draft' } = req.body;

    if (!title || !scenario || !severity) {
      return res.status(400).json({ success: false, data: null, error: 'title, scenario, and severity are required.' });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, data: null, error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}.` });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    const record = await db.create({ title, scenario, severity, status });
    res.status(201).json({ success: true, data: record, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: 'Test case not found.' });
    }

    const { title, scenario, severity, status } = req.body;

    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, data: null, error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}.` });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    const updated = await db.update(req.params.id, {
      title: title ?? existing.title,
      scenario: scenario ?? existing.scenario,
      severity: severity ?? existing.severity,
      status: status ?? existing.status,
    });

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await db.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, data: null, error: 'Test case not found.' });
    }
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
