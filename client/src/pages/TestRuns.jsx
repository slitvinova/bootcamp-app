import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  pending:   'bg-gray-100 text-gray-500',
  running:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

export default function TestRuns() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/test-runs').then(r => r.json()),
      fetch('/api/suites').then(r => r.json()),
    ]).then(([runsJson, suitesJson]) => {
      if (runsJson.success) setRuns(runsJson.data);
      if (suitesJson.success) setSuites(suitesJson.data);
    }).finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setSelectedSuite(suites[0]?.id?.toString() || '');
    setCreateError('');
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedSuite) { setCreateError('Pick a suite.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/test-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite_id: Number(selectedSuite), created_by: 'user' }),
      });
      const json = await res.json();
      if (json.success) {
        navigate(`/test-runs/${json.data.id}`);
      } else {
        setCreateError(json.error || 'Failed to create run.');
      }
    } catch {
      setCreateError('Failed to create run. Check your connection.');
    }
    setCreating(false);
  };

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Test Runs</h1>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            + New Run
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 py-16 text-center">
            <p className="text-gray-400 text-sm">No test runs yet.</p>
            <p className="text-gray-400 text-xs mt-1">Click "+ New Run" to start one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Suite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Results</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Started</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map(run => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{run.suite_name}</p>
                      <p className="text-xs text-gray-400">#{run.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium">{run.pass_count} passed</span>
                        <span className="text-red-600 font-medium">{run.fail_count} failed</span>
                        <span className="text-yellow-600 font-medium">{run.skip_count} skipped</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(run.start_time)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/test-runs/${run.id}`)}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">New Test Run</h2>

            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{createError}</p>
            )}

            <label className="block text-xs font-medium text-gray-600 mb-1">Suite</label>
            <select
              value={selectedSuite}
              onChange={e => setSelectedSuite(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-5"
            >
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedSuite}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Start Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
