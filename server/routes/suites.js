const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const suites = await db.suites.list({ status });
    res.json({ success: true, data: suites, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, feature, status = 'draft' } = req.body;
    if (!name || !feature) {
      return res.status(400).json({ success: false, data: null, error: 'name and feature are required.' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }
    const suite = await db.suites.create({ name, feature, status });
    res.status(201).json({ success: true, data: suite, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const suite = await db.suites.get(req.params.id);
    if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    res.json({ success: true, data: suite, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.suites.get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    const { name, feature, status } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }
    const updated = await db.suites.update(req.params.id, {
      name: name ?? existing.name,
      feature: feature ?? existing.feature,
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
    const removed = await db.suites.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/:id/cases', async (req, res) => {
  try {
    const suite = await db.suites.get(req.params.id);
    if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    const { test_case_id } = req.body;
    if (!test_case_id) return res.status(400).json({ success: false, data: null, error: 'test_case_id is required.' });
    const result = await db.suites.addCase(req.params.id, test_case_id);
    if (result === null) return res.status(409).json({ success: false, data: null, error: 'Test case is already in this suite.' });
    res.status(201).json({ success: true, data: await db.suites.get(req.params.id), error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.delete('/:id/cases/:caseId', async (req, res) => {
  try {
    const removed = await db.suites.removeCase(req.params.id, req.params.caseId);
    if (!removed) return res.status(404).json({ success: false, data: null, error: 'Test case not found in suite.' });
    res.json({ success: true, data: await db.suites.get(req.params.id), error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.put('/:id/reorder', async (req, res) => {
  try {
    const suite = await db.suites.get(req.params.id);
    if (!suite) return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ success: false, data: null, error: 'order must be an array of test case IDs.' });
    await db.suites.reorder(req.params.id, order);
    res.json({ success: true, data: await db.suites.get(req.params.id), error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
