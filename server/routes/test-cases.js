const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

router.get('/', (req, res) => {
  const { page = 1, status, search, sort = 'updated_at', order = 'desc' } = req.query;
  const result = db.list({
    page: Number(page),
    limit: 20,
    status,
    search,
    sort,
    order,
  });
  res.json({ success: true, data: { ...result, page: Number(page), limit: 20 }, error: null });
});

router.post('/', (req, res) => {
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

  const record = db.create({ title, scenario, severity, status });
  res.status(201).json({ success: true, data: record, error: null });
});

router.put('/:id', (req, res) => {
  const existing = db.get(req.params.id);
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

  const updated = db.update(req.params.id, {
    title: title ?? existing.title,
    scenario: scenario ?? existing.scenario,
    severity: severity ?? existing.severity,
    status: status ?? existing.status,
  });

  res.json({ success: true, data: updated, error: null });
});

router.delete('/:id', (req, res) => {
  const removed = db.remove(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, data: null, error: 'Test case not found.' });
  }
  res.json({ success: true, data: null, error: null });
});

module.exports = router;
