const express = require('express');
const router = express.Router();
const db = require('../db');

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildHtml(report) {
  const passRate = report.total_count > 0
    ? Math.round((report.passed_count / report.total_count) * 100)
    : 0;
  const barColor = passRate >= 75 ? '#16a34a' : passRate >= 50 ? '#d97706' : '#dc2626';

  const GITHUB_ICON = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="vertical-align:-2px;margin-right:3px"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

  const rows = (report.results || []).map((r, i) => {
    const rowClass = r.result === 'failed' ? ' class="row-failed"' : '';
    const rc  = r.result ? `badge-${r.result}` : 'badge-pending';
    const rl  = r.result || 'not run';
    const sc  = `sev-${r.severity || 'Trivial'}`;
    let extra = '';
    if (r.notes) extra += `<p class="notes">${escHtml(r.notes)}</p>`;
    if (r.github_issue_url) {
      extra += `<a href="${escHtml(r.github_issue_url)}" class="issue-link" target="_blank">${GITHUB_ICON}GitHub Issue</a>`;
    }
    return `<tr${rowClass}>
      <td class="nc">${i + 1}</td>
      <td class="tc">${escHtml(r.title)}</td>
      <td><span class="badge ${sc}">${escHtml(r.severity || '')}</span></td>
      <td><span class="badge ${rc}">${rl}</span></td>
      <td>${extra || '<span class="empty-notes">—</span>'}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test Report — ${escHtml(report.suite_name)}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Base ── */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #1e293b;
  background: #eef2f7;
  -webkit-font-smoothing: antialiased;
}

/* ── Page card ── */
.page {
  max-width: 880px;
  margin: 36px auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 32px rgba(15,23,42,.12), 0 1px 4px rgba(15,23,42,.08);
}

/* ── Header ── */
.hd {
  background: #312e81;
  background: linear-gradient(135deg, #1e1b6e 0%, #3730a3 55%, #4f46e5 100%);
  padding: 36px 44px 32px;
  color: #fff;
  position: relative;
}
.hd-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: #a5b4fc;
  margin-bottom: 10px;
}
.hd h1 {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -.4px;
  line-height: 1.2;
  margin-bottom: 18px;
  color: #fff;
}
.hd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-top: 1px solid rgba(255,255,255,.15);
  padding-top: 14px;
}
.hd-meta-item {
  padding: 0 20px 0 0;
  margin-right: 20px;
  border-right: 1px solid rgba(255,255,255,.15);
  font-size: 12px;
  color: rgba(255,255,255,.65);
}
.hd-meta-item:last-child { border-right: none; }
.hd-meta-item strong { color: #fff; font-weight: 600; display: block; font-size: 13px; margin-bottom: 1px; }

/* ── Body ── */
.body { padding: 36px 44px; }

/* ── Summary cards ── */
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.card {
  border-radius: 10px;
  padding: 20px 16px;
  text-align: center;
  border: 1.5px solid transparent;
}
.card-n { font-size: 40px; font-weight: 800; line-height: 1; }
.card-l { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-top: 7px; }

.card-total   { background: #f8fafc; border-color: #e2e8f0; }
.card-total   .card-n { color: #0f172a; }
.card-total   .card-l { color: #64748b; }

.card-passed  { background: #f0fdf4; border-color: #86efac; }
.card-passed  .card-n { color: #15803d; }
.card-passed  .card-l { color: #16a34a; }

.card-failed  { background: #fff1f2; border-color: #fda4af; }
.card-failed  .card-n { color: #be123c; }
.card-failed  .card-l { color: #e11d48; }

.card-skipped { background: #fffbeb; border-color: #fcd34d; }
.card-skipped .card-n { color: #92400e; }
.card-skipped .card-l { color: #b45309; }

/* ── Pass rate row ── */
.rate-row {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 22px;
  margin-bottom: 32px;
}
.rate-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #64748b;
  white-space: nowrap;
  min-width: 70px;
}
.bar-wrap { flex: 1; }
.bar-bg {
  background: #e2e8f0;
  border-radius: 99px;
  height: 10px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 99px;
  background: ${barColor};
}
.rate-pct {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  min-width: 54px;
  text-align: right;
}

/* ── Section label ── */
.section-lbl {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: #94a3b8;
  margin-bottom: 12px;
}

/* ── Results table ── */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
thead th {
  background: #f8fafc;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #94a3b8;
  padding: 11px 16px;
  border-bottom: 1.5px solid #e2e8f0;
}
tbody td {
  padding: 13px 16px;
  vertical-align: top;
  border-bottom: 1px solid #f1f5f9;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #fafbfc; }
tbody tr.row-failed td { background: #fff5f6; }
tbody tr.row-failed:hover td { background: #fff0f1; }

.nc { color: #cbd5e1; font-size: 12px; width: 30px; padding-right: 4px; }
.tc { font-weight: 500; color: #0f172a; max-width: 280px; }

/* ── Badges ── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .02em;
  white-space: nowrap;
  text-transform: capitalize;
}
.badge-passed  { background: #dcfce7; color: #15803d; }
.badge-failed  { background: #ffe4e6; color: #be123c; }
.badge-skipped { background: #fef3c7; color: #92400e; }
.badge-pending { background: #f1f5f9; color: #64748b; }

.sev-Critical { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
.sev-Major    { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.sev-Minor    { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.sev-Trivial  { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

/* ── Notes / issue ── */
.notes { font-size: 12px; color: #64748b; line-height: 1.45; margin-top: 4px; }
.empty-notes { color: #cbd5e1; }
.issue-link {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #4f46e5;
  text-decoration: none;
  margin-top: 5px;
  font-weight: 500;
}
.issue-link:hover { text-decoration: underline; }

/* ── Footer ── */
.ft {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1.5px solid #e2e8f0;
  font-size: 11.5px;
  color: #94a3b8;
}
.ft strong { color: #475569; font-weight: 600; }

/* ── Print ── */
@media print {
  body { background: #fff; }
  .page { margin: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
  .hd, .card, .bar-fill, .badge, .row-failed td {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { page-break-inside: auto; border: 1px solid #e2e8f0; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  .cards { page-break-inside: avoid; }
  .rate-row { page-break-inside: avoid; }
  @page { margin: 1.5cm; size: A4; }
}
</style>
</head>
<body>
<div class="page">

  <div class="hd">
    <div class="hd-eyebrow">QA Test Report</div>
    <h1>${escHtml(report.suite_name)}</h1>
    <div class="hd-meta">
      <div class="hd-meta-item"><strong>Run #${report.run_id}</strong>Identifier</div>
      <div class="hd-meta-item"><strong>${fmtDate(report.run_date)}</strong>Executed</div>
      <div class="hd-meta-item"><strong>${fmtDate(report.generated_at)}</strong>Generated</div>
    </div>
  </div>

  <div class="body">

    <div class="cards">
      <div class="card card-total">
        <div class="card-n">${report.total_count}</div>
        <div class="card-l">Total</div>
      </div>
      <div class="card card-passed">
        <div class="card-n">${report.passed_count}</div>
        <div class="card-l">Passed</div>
      </div>
      <div class="card card-failed">
        <div class="card-n">${report.failed_count}</div>
        <div class="card-l">Failed</div>
      </div>
      <div class="card card-skipped">
        <div class="card-n">${report.skipped_count}</div>
        <div class="card-l">Skipped</div>
      </div>
    </div>

    <div class="rate-row">
      <span class="rate-lbl">Pass Rate</span>
      <div class="bar-wrap">
        <div class="bar-bg"><div class="bar-fill" style="width:${passRate}%"></div></div>
      </div>
      <span class="rate-pct">${passRate}%</span>
    </div>

    <p class="section-lbl">Test Results</p>
    <table>
      <thead>
        <tr>
          <th class="nc">#</th>
          <th>Test Case</th>
          <th>Severity</th>
          <th>Result</th>
          <th>Notes / Issue</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="ft">
      <span><strong>${escHtml(report.suite_name)}</strong> &mdash; Run #${report.run_id}</span>
      <span>Generated ${fmtDate(report.generated_at)} &nbsp;&middot;&nbsp; QA Management App</span>
    </div>

  </div>
</div>
</body>
</html>`;
}

router.get('/', (req, res) => {
  res.json({ success: true, data: db.reports.list(), error: null });
});

router.post('/', (req, res) => {
  const { run_id } = req.body;
  if (!run_id) {
    return res.status(400).json({ success: false, data: null, error: 'run_id is required.' });
  }
  const report = db.reports.create(run_id);
  if (!report) {
    return res.status(404).json({ success: false, data: null, error: 'Test run not found.' });
  }
  res.status(201).json({ success: true, data: report, error: null });
});

router.get('/:id', (req, res) => {
  const report = db.reports.get(req.params.id);
  if (!report) return res.status(404).json({ success: false, data: null, error: 'Report not found.' });
  res.json({ success: true, data: report, error: null });
});

router.get('/:id/export/html', (req, res) => {
  const report = db.reports.get(req.params.id);
  if (!report) return res.status(404).json({ success: false, data: null, error: 'Report not found.' });
  const slug = report.suite_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="report-run${report.run_id}-${slug}.html"`);
  res.send(buildHtml(report));
});

module.exports = router;
