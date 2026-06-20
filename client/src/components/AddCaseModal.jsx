import { useState, useEffect } from 'react';

const SEVERITY_BADGE = {
  Critical: 'bg-red-900/40 text-red-300 border border-red-800',
  Major: 'bg-blue-900/40 text-blue-300 border border-blue-800',
  Minor: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  Trivial: 'bg-slate-700 text-slate-500 border border-slate-600',
};

export default function AddCaseModal({ suiteId, existingIds, onClose, onAdded }) {
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    fetch('/api/test-cases?limit=200')
      .then(r => r.json())
      .then(json => {
        if (json.success) setAllCases(json.data.rows);
        else setFetchError('Failed to load test cases.');
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Failed to load test cases. Check your connection and try again.');
        setLoading(false);
      });
  }, []);

  const available = allCases.filter(tc => !existingIds.includes(tc.id));

  const handleAdd = async (tc) => {
    setAdding(tc.id);
    const res = await fetch(`/api/suites/${suiteId}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_case_id: tc.id }),
    });
    const json = await res.json();
    if (json.success) onAdded(json.data);
    setAdding(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-slate-800 rounded shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Add Test Case</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-center py-10 text-slate-400 text-sm">Loading…</p>
          ) : fetchError ? (
            <p className="text-center py-10 text-red-500 text-sm">{fetchError}</p>
          ) : available.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">All test cases are already in this suite.</p>
          ) : (
            <ul className="divide-y divide-slate-700">
              {available.map(tc => (
                <li key={tc.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-900">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-white">{tc.title}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[tc.severity]}`}>
                      {tc.severity}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAdd(tc)}
                    disabled={adding === tc.id}
                    className="flex-shrink-0 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-60"
                  >
                    {adding === tc.id ? '…' : '+ Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-6 py-3 border-t border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-white">Done</button>
        </div>
      </div>
    </div>
  );
}
