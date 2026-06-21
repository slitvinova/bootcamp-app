const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const VALID_PAGE_SIZES = [10, 20, 50, 100];

router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: await db.settings.get(), error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { theme, default_severity_for_new_bugs, default_page_size, timezone, auto_generate_report_after_run } = req.body;
    const errors = [];
    if (theme !== undefined && !VALID_THEMES.includes(theme)) errors.push('theme must be light, dark, or system');
    if (default_severity_for_new_bugs !== undefined && !VALID_SEVERITIES.includes(default_severity_for_new_bugs)) errors.push('invalid severity');
    if (default_page_size !== undefined && !VALID_PAGE_SIZES.includes(Number(default_page_size))) errors.push('page size must be 10, 20, 50, or 100');
    if (auto_generate_report_after_run !== undefined && typeof auto_generate_report_after_run !== 'boolean') errors.push('auto_generate_report_after_run must be boolean');
    if (errors.length) return res.json({ success: false, data: null, error: errors.join('; ') });

    const updates = {};
    if (theme !== undefined) updates.theme = theme;
    if (default_severity_for_new_bugs !== undefined) updates.default_severity_for_new_bugs = default_severity_for_new_bugs;
    if (default_page_size !== undefined) updates.default_page_size = Number(default_page_size);
    if (timezone !== undefined) updates.timezone = timezone;
    if (auto_generate_report_after_run !== undefined) updates.auto_generate_report_after_run = auto_generate_report_after_run;

    const updated = await db.settings.update(updates);
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

module.exports = router;
