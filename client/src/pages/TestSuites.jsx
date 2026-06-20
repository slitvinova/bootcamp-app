import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuiteModal from '../components/SuiteModal';

const STATUS_BADGE = {
  'draft': 'bg-stone-100 text-stone-500',
  'ready': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'passed': 'bg-green-100 text-green-700',
  'failed': 'bg-red-100 text-red-700',
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
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Test Suites</h1>
            <p className="text-sm text-stone-500 mt-0.5">{suites.length} total</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            + New Suite
          </button>
        </div>

        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="in-progress">In Progress</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-white rounded border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Feature</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Cases</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Updated</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400">Loading…</td></tr>
              ) : fetchError ? (
                <tr><td colSpan={6} className="text-center py-12 text-red-500 text-sm">{fetchError}</td></tr>
              ) : suites.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400">No suites found.</td></tr>
              ) : (
                suites.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/test-suites/${s.id}`)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">{s.name}</td>
                    <td className="px-4 py-3 text-stone-500">{s.feature}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{s.case_count}</td>
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{formatDate(s.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(e, s.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors"
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

      {modalOpen && (
        <SuiteModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
