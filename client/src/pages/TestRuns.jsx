import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  pending:   'bg-slate-700 text-slate-500',
  running:   'bg-amber-900/40 text-amber-300',
  completed: 'bg-green-900/40 text-green-300',
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading…</div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Test Runs</h1>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            + New Run
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="bg-slate-800 rounded border border-slate-700 py-16 text-center">
            <p className="text-slate-400 text-sm">No test runs yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click "+ New Run" to start one.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Suite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Results</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Started</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {runs.map(run => (
                  <tr key={run.id} className="hover:bg-slate-900">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{run.suite_name}</p>
                      <p className="text-xs text-slate-400">#{run.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 font-medium">{run.pass_count} passed</span>
                        <span className="text-red-400 font-medium">{run.fail_count} failed</span>
                        <span className="text-yellow-400 font-medium">{run.skip_count} skipped</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(run.start_time)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/test-runs/${run.id}`)}
                        className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 border border-blue-800 rounded hover:bg-slate-700"
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4">New Test Run</h2>

            {createError && (
              <p className="text-sm text-red-400 bg-red-900/40 border border-red-800 rounded px-3 py-2 mb-3">{createError}</p>
            )}

            <label className="block text-xs font-medium text-slate-300 mb-1">Suite</label>
            <select
              value={selectedSuite}
              onChange={e => setSelectedSuite(e.target.value)}
              className="w-full border border-slate-600 rounded-md px-3 py-2 text-sm bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-5"
            >
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-300 border border-slate-600 rounded-md hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedSuite}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
