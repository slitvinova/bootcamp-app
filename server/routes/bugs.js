const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];
const VALID_TRANSITIONS = {
  'open':        ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  'resolved':    ['closed', 'reopened'],
  'closed':      ['reopened'],
  'reopened':    ['in-progress', 'closed'],
};

router.get('/', async (req, res) => {
  try {
    const { status, severity, priority, search, sort, order } = req.query;
    const bugs = await db.bugs.list({ status, severity, priority, search, sort, order });
    res.json({ success: true, data: bugs, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title, description, severity,
      priority = 'medium',
      steps_to_reproduce = [],
      expected = '', actual = '', environment = '',
    } = req.body;

    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({ success: false, data: null, error: 'title and description are required.' });
    }
    if (!severity) {
      return res.status(400).json({ success: false, data: null, error: 'severity is required.' });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, data: null, error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}.` });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, data: null, error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
    }
    if (!Array.isArray(steps_to_reproduce)) {
      return res.status(400).json({ success: false, data: null, error: 'steps_to_reproduce must be an array.' });
    }

    const bug = await db.bugs.create({
      title: title.trim(), description: description.trim(), severity, priority,
      status: 'open', steps_to_reproduce, expected, actual, environment,
    });
    res.status(201).json({ success: true, data: bug, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bug = await db.bugs.get(req.params.id);
    if (!bug) return res.status(404).json({ success: false, data: null, error: 'Bug not found.' });
    const activity = await db.bugs.getActivity(req.params.id);
    res.json({ success: true, data: { ...bug, activity }, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await db.bugs.get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found.' });

    const { title, description, severity, priority, steps_to_reproduce, expected, actual, environment, github_issue_url } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, data: null, error: 'title cannot be empty.' });
    }
    if (description !== undefined && !description.trim()) {
      return res.status(400).json({ success: false, data: null, error: 'description cannot be empty.' });
    }
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ success: false, data: null, error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}.` });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, data: null, error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
    }
    if (steps_to_reproduce !== undefined && !Array.isArray(steps_to_reproduce)) {
      return res.status(400).json({ success: false, data: null, error: 'steps_to_reproduce must be an array.' });
    }

    const updated = await db.bugs.update(req.params.id, {
      title:               title !== undefined       ? title.trim()       : existing.title,
      description:         description !== undefined ? description.trim() : existing.description,
      severity:            severity            ?? existing.severity,
      priority:            priority            ?? existing.priority,
      steps_to_reproduce:  steps_to_reproduce  ?? existing.steps_to_reproduce,
      expected:            expected            ?? existing.expected,
      actual:              actual              ?? existing.actual,
      environment:         environment         ?? existing.environment,
      github_issue_url:    github_issue_url    ?? existing.github_issue_url,
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await db.bugs.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, data: null, error: 'Bug not found.' });
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const existing = await db.bugs.get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, data: null, error: 'Bug not found.' });

    const { status, message = '' } = req.body;
    if (!status) return res.status(400).json({ success: false, data: null, error: 'status is required.' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      return res.status(422).json({
        success: false, data: null,
        error: `Cannot transition from "${existing.status}" to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none'}.`,
      });
    }

    const updated = await db.bugs.changeStatus(req.params.id, status, message, existing.status);
    const activity = await db.bugs.getActivity(req.params.id);
    res.json({ success: true, data: { ...updated, activity }, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const bug = await db.bugs.get(req.params.id);
    if (!bug) return res.status(404).json({ success: false, data: null, error: 'Bug not found.' });

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, data: null, error: 'message is required.' });
    }

    await db.bugs.addComment(req.params.id, message.trim());
    const activity = await db.bugs.getActivity(req.params.id);
    res.json({ success: true, data: { ...bug, activity }, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
