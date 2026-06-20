import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuiteModal from '../components/SuiteModal';

const STATUS_BADGE = {
  'draft': 'bg-slate-700 text-slate-500',
  'ready': 'bg-blue-900/40 text-blue-300',
  'in-progress': 'bg-amber-900/40 text-amber-300',
  'passed': 'bg-green-900/40 text-green-300',
  'failed': 'bg-red-900/40 text-red-300',
};

export default function TestSuites() {
  const navigate = useNavigate();
  const [suites, setSuites] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSuites = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    try {
      const res = await fetch(`/api/suites?${params}`);
      const json = await res.json();
      if (json.success) setSuites(json.data);
      else setFetchError('Failed to load suites.');
    } catch {
      setFetchError('Failed to load suites. Check your connection and try again.');
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchSuites(); }, [fetchSuites]);

  const handleSaved = (suite) => {
    setModalOpen(false);
    navigate(`/test-suites/${suite.id}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this suite?')) return;
    await fetch(`/api/suites/${id}`, { method: 'DELETE' });
    fetchSuites();
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Test Suites</h1>
            <p className="text-sm text-slate-500 mt-0.5">{suites.length} total</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Suite
          </button>
        </div>

        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-600 rounded-md px-3 py-2 text-sm bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="in-progress">In Progress</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Feature</th>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Cases</th>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Updated</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
              ) : fetchError ? (
                <tr><td colSpan={6} className="text-center py-12 text-red-500 text-sm">{fetchError}</td></tr>
              ) : suites.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No suites found.</td></tr>
              ) : (
                suites.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/test-suites/${s.id}`)}
                    className="hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.feature}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.case_count}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(s.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(e, s.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                        aria-label="Delete suite"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <SuiteModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
