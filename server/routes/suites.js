const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

router.get('/', (req, res) => {
  const { status } = req.query;
  const suites = db.suites.list({ status });
  res.json({ success: true, data: suites, error: null });
});

router.post('/', (req, res) => {
  const { name, feature, status = 'draft' } = req.body;
  if (!name || !feature) {
    return res.status(400).json({ success: false, data: null, error: 'name and feature are required.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }
  const suite = db.suites.create({ name, feature, status });
  res.status(201).json({ success: true, data: suite, error: null });
});

router.get('/:id', (req, res) => {
  const suite = db.suites.get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
  res.json({ success: true, data: suite, error: null });
});

router.put('/:id', (req, res) => {
  const existing = db.suites.get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
  const { name, feature, status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }
  const updated = db.suites.update(req.params.id, {
    name: name ?? existing.name,
    feature: feature ?? existing.feature,
    status: status ?? existing.status,
  });
  res.json({ success: true, data: updated, error: null });
});

router.delete('/:id', (req, res) => {
  const removed = db.suites.remove(req.params.id);
  if (!removed) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
  res.json({ success: true, data: null, error: null });
});

router.post('/:id/cases', (req, res) => {
  const suite = db.suites.get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
  const { test_case_id } = req.body;
  if (!test_case_id) return res.status(400).json({ success: false, data: null, error: 'test_case_id is required.' });
  const result = db.suites.addCase(req.params.id, test_case_id);
  if (result === null) return res.status(409).json({ success: false, data: null, error: 'Test case is already in this suite.' });
  res.status(201).json({ success: true, data: db.suites.get(req.params.id), error: null });
});

router.delete('/:id/cases/:caseId', (req, res) => {
  const removed = db.suites.removeCase(req.params.id, req.params.caseId);
  if (!removed) return res.status(404).json({ success: false, data: null, error: 'Test case not found in suite.' });
  res.json({ success: true, data: db.suites.get(req.params.id), error: null });
});

router.put('/:id/reorder', (req, res) => {
  const suite = db.suites.get(req.params.id);
  if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ success: false, data: null, error: 'order must be an array of test case IDs.' });
  db.suites.reorder(req.params.id, order);
  res.json({ success: true, data: db.suites.get(req.params.id), error: null });
});

module.exports = router;
