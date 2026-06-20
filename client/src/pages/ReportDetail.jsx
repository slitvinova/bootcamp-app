import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RESULT_BADGE = {
  passed:  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  failed:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  skipped: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800',
  Major:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
  Minor:    'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
  Trivial:  'bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setReport(j.data);
        else setError('Report not found.');
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading…</div>
  );
  if (error) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">{error}</div>
  );
  if (!report) return null;

  const passRate = report.total_count > 0
    ? Math.round((report.passed_count / report.total_count) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/reports')}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-1">
          ← All Reports
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Report #{report.id} &nbsp;·&nbsp; Run #{report.run_id}</p>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{report.suite_name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Run {formatDate(report.run_date)} &nbsp;·&nbsp; Generated {formatDate(report.generated_at)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Print / Save as PDF
              </button>
              <a
                href={`/api/reports/${id}/export/html`}
                download
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-1"
              >
                Download HTML
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total',   value: report.total_count,   color: 'text-slate-900 dark:text-white' },
            { label: 'Passed',  value: report.passed_count,  color: 'text-green-400' },
            { label: 'Failed',  value: report.failed_count,  color: 'text-red-400' },
            { label: 'Skipped', value: report.skipped_count, color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className={`text-3xl font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pass rate bar */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Pass Rate</p>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-blue-600 text-white rounded-full transition-all"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">{passRate}%</p>
        </div>

        {/* Results table */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">Test Results</h2>
          </div>
          {report.results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No results in this report.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-white dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Test Case</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Severity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Result</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {report.results.map((r, i) => (
                  <tr key={i} className={r.result === 'failed' ? 'bg-red-900/40' : ''}>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[r.severity] || 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.result ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${RESULT_BADGE[r.result] || 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                          {r.result}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">not run</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.notes && <p className="text-xs text-slate-600 dark:text-slate-300">{r.notes}</p>}
                      {r.github_issue_url && (
                        <a href={r.github_issue_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                          </svg>
                          GitHub Issue
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
