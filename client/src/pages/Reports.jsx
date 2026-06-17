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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
        )}

        {!error && reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm py-16 text-center">
            <p className="text-gray-400 text-sm">No reports yet.</p>
            <p className="text-gray-300 text-xs mt-1">Open a completed test run and click Generate Report.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Suite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Run Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Results</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Generated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{r.suite_name}</p>
                      <p className="text-xs text-gray-400">Run #{r.run_id} &nbsp;·&nbsp; Report #{r.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.run_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600 font-medium">{r.passed_count}P</span>
                        <span className="text-red-600 font-medium">{r.failed_count}F</span>
                        <span className="text-yellow-600 font-medium">{r.skipped_count}S</span>
                        <span className="text-gray-400">/ {r.total_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.generated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/reports/${r.id}`)}
                        className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded hover:bg-indigo-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
