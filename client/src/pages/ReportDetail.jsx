import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RESULT_BADGE = {
  passed:  'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  skipped: 'bg-yellow-100 text-yellow-700',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 border border-red-300',
  Major:    'bg-orange-100 text-orange-700 border border-orange-300',
  Minor:    'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Trivial:  'bg-gray-100 text-gray-500 border border-gray-300',
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-sm">{error}</div>
  );
  if (!report) return null;

  const passRate = report.total_count > 0
    ? Math.round((report.passed_count / report.total_count) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/reports')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          ← All Reports
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Report #{report.id} &nbsp;·&nbsp; Run #{report.run_id}</p>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">{report.suite_name}</h1>
              <p className="text-xs text-gray-400">Run {formatDate(report.run_date)} &nbsp;·&nbsp; Generated {formatDate(report.generated_at)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Print / Save as PDF
              </button>
              <a
                href={`/api/reports/${id}/export/html`}
                download
                className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 inline-flex items-center gap-1"
              >
                Download HTML
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total',   value: report.total_count,   color: 'text-gray-900' },
            { label: 'Passed',  value: report.passed_count,  color: 'text-green-600' },
            { label: 'Failed',  value: report.failed_count,  color: 'text-red-600' },
            { label: 'Skipped', value: report.skipped_count, color: 'text-yellow-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
              <p className={`text-3xl font-semibold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pass rate bar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pass Rate</p>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <p className="text-xl font-semibold text-gray-900">{passRate}%</p>
        </div>

        {/* Results table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700">Test Results</h2>
          </div>
          {report.results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No results in this report.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Test Case</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Severity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Result</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.results.map((r, i) => (
                  <tr key={i} className={r.result === 'failed' ? 'bg-red-50/40' : ''}>
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[r.severity] || 'bg-gray-100 text-gray-500'}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.result ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${RESULT_BADGE[r.result] || 'bg-gray-100 text-gray-500'}`}>
                          {r.result}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">not run</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.notes && <p className="text-xs text-gray-600">{r.notes}</p>}
                      {r.github_issue_url && (
                        <a href={r.github_issue_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1">
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
          )}
        </div>
      </div>
    </div>
  );
}
