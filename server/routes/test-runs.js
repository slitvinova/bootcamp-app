const express = require('express');
const router = express.Router();
const db = require('../db');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_REPO || 'slitvinova/bootcamp-app';

async function createGithubIssue(title, body) {
  if (!GITHUB_TOKEN) return null;
  const [owner, repo] = GITHUB_REPO.split('/');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels: ['bug'] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.html_url || null;
}

router.get('/', async (req, res) => {
  try {
    const runs = await db.testRuns.list();
    res.json({ success: true, data: runs, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { suite_id, created_by } = req.body;
    if (!suite_id) {
      return res.status(400).json({ success: false, data: null, error: 'suite_id is required.' });
    }
    const run = await db.testRuns.create(suite_id, created_by);
    if (!run) {
      return res.status(404).json({ success: false, data: null, error: 'Suite not found.' });
    }
    res.status(201).json({ success: true, data: run, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const run = await db.testRuns.get(req.params.id);
    if (!run) return res.status(404).json({ success: false, data: null, error: 'Run not found.' });
    res.json({ success: true, data: run, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.patch('/:runId/results/:resultId', async (req, res) => {
  try {
    const { result, notes, duration_ms } = req.body;
    const VALID = ['passed', 'failed', 'skipped'];
    if (!result || !VALID.includes(result)) {
      return res.status(400).json({
        success: false, data: null,
        error: `result must be one of: ${VALID.join(', ')}.`,
      });
    }

    const existing = await db.testRuns.getResult(req.params.runId, req.params.resultId);
    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: 'Result not found.' });
    }

    let github_issue_url = existing.github_issue_url;

    if (result === 'failed' && !github_issue_url) {
      const run = await db.testRuns.get(req.params.runId);
      const issueTitle = `Test failed: ${existing.test_case_title}`;
      const issueBody = [
        '## Test Failure',
        '',
        `**Test Case:** ${existing.test_case_title}`,
        `**Suite:** ${run ? run.suite_name : ''}`,
        '',
        '## Failure Notes',
        '',
        notes || 'No notes provided.',
        '',
        '---',
        '*Opened automatically by the test run executor.*',
      ].join('\n');
      try {
        github_issue_url = await createGithubIssue(issueTitle, issueBody);
      } catch {
        github_issue_url = null;
      }
    }

    if (result !== 'failed') {
      github_issue_url = null;
    }

    const updated = await db.testRuns.updateResult(req.params.runId, req.params.resultId, {
      result,
      notes: notes ?? existing.notes,
      duration_ms: duration_ms ?? existing.duration_ms,
      github_issue_url,
    });

    if (!updated) return res.status(404).json({ success: false, data: null, error: 'Result not found.' });

    // Flake detection
    const allResults = await db.testRuns.getAllResultsForTestCase(existing.test_case_id);
    const passes = allResults.filter(r => r.result === 'passed').length;
    const fails  = allResults.filter(r => r.result === 'failed').length;
    if (passes >= 1 && fails >= 1 && !(await db.flakeCache.get(existing.test_case_id))) {
      const flakeRate = fails / (passes + fails);
      await db.flakeCache.set(existing.test_case_id, {
        test_case_id: existing.test_case_id,
        test_case_title: existing.test_case_title,
        flake_rate: Math.round(flakeRate * 100) / 100,
        hypothesis: null,
        generated_at: null,
        notified_at: null,
      });
    }

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
