import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(j => {
        if (j.success) setReports(j.data);
        else setError(j.error || 'Failed to load reports.');
      })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading…</div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Reports</h1>

        {error && (
          <div className="bg-red-900/40 border border-red-800 rounded px-4 py-3 text-sm text-red-300 mb-6">{error}</div>
        )}

        {!error && reports.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 py-16 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No reports yet.</p>
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">Open a completed test run and click Generate Report.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-white dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Suite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Run Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Results</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Generated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{r.suite_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Run #{r.run_id} &nbsp;·&nbsp; Report #{r.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(r.run_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-400 font-medium">{r.passed_count}P</span>
                        <span className="text-red-400 font-medium">{r.failed_count}F</span>
                        <span className="text-yellow-400 font-medium">{r.skipped_count}S</span>
                        <span className="text-slate-500 dark:text-slate-400">/ {r.total_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(r.generated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/reports/${r.id}`)}
                        className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 border border-blue-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
