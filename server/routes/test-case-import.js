const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('../db');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.match(/\.csv$/i)) {
      return cb(Object.assign(new Error('Only .csv files are accepted.'), { code: 'WRONG_TYPE' }));
    }
    cb(null, true);
  },
});

const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_STATUSES   = ['draft', 'ready', 'passed', 'failed', 'skipped'];

function normaliseHeaders(record) {
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    out[k.toLowerCase().trim()] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

function validateRow(raw, rowNum) {
  const r = normaliseHeaders(raw);

  // Accept 'steps' as an alias for 'scenario'
  const title    = r.title    || '';
  const severity = r.severity || '';
  const scenario = r.scenario || r.steps || '';
  const status   = (r.status  || '').toLowerCase();

  const errors = [];

  if (!title)    errors.push('title is required');
  if (!severity) {
    errors.push('severity is required');
  } else if (!VALID_SEVERITIES.map(s => s.toLowerCase()).includes(severity.toLowerCase())) {
    errors.push(`severity must be Critical, Major, Minor, or Trivial (got "${severity}")`);
  }
  if (!scenario) errors.push('scenario / steps is required');
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be draft, ready, passed, failed, or skipped (got "${status}")`);
  }

  const normSeverity = VALID_SEVERITIES.find(s => s.toLowerCase() === severity.toLowerCase()) || severity;

  return {
    row_num: rowNum,
    valid: errors.length === 0,
    errors,
    data: {
      title,
      severity: normSeverity,
      scenario,
      status: status || 'draft',
    },
  };
}

// POST /api/test-cases/import/preview
router.post('/preview', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, data: null, error: 'No file uploaded.' });
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (e) {
    return res.json({ success: false, data: null, error: `Could not parse CSV: ${e.message}` });
  }

  if (!records.length) {
    return res.json({ success: false, data: null, error: 'File is empty or has no data rows.' });
  }

  // Check required headers (case-insensitive; accept 'steps' as alias for 'scenario')
  const fileHeaders = Object.keys(records[0]).map(h => h.toLowerCase().trim());
  const hasScenario = fileHeaders.includes('scenario') || fileHeaders.includes('steps');
  const missing = [];
  if (!fileHeaders.includes('title'))    missing.push('title');
  if (!fileHeaders.includes('severity')) missing.push('severity');
  if (!hasScenario)                      missing.push('scenario (or steps)');

  if (missing.length) {
    return res.json({
      success: false,
      data: null,
      error: `Missing required columns: ${missing.join(', ')}. Found: ${fileHeaders.join(', ')}.`,
    });
  }

  const rows = records.map((r, i) => validateRow(r, i + 2)); // +2: row 1 is headers
  const valid_count   = rows.filter(r => r.valid).length;
  const invalid_count = rows.length - valid_count;

  res.json({ success: true, data: { total: rows.length, valid_count, invalid_count, rows }, error: null });
});

// POST /api/test-cases/import/commit
router.post('/commit', (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) {
    return res.json({ success: false, data: null, error: 'No rows provided.' });
  }

  let imported = 0;
  for (const row of rows) {
    try {
      db.create({
        title:    row.title,
        severity: row.severity,
        scenario: row.scenario,
        status:   row.status || 'draft',
      });
      imported++;
    } catch {
      // skip rows that fail at the db level
    }
  }

  res.json({ success: true, data: { imported }, error: null });
});

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err.code === 'WRONG_TYPE' || err.code === 'LIMIT_FILE_SIZE') {
    return res.json({ success: false, data: null, error: err.message });
  }
  res.json({ success: false, data: null, error: 'File upload failed.' });
});

module.exports = router;
