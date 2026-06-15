import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BugModal from '../components/BugModal';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700',
  Major:    'bg-orange-100 text-orange-700',
  Minor:    'bg-yellow-100 text-yellow-700',
  Trivial:  'bg-gray-100 text-gray-500',
};

const STATUS_BADGE = {
  'open':        'bg-red-100 text-red-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'resolved':    'bg-green-100 text-green-700',
  'closed':      'bg-gray-100 text-gray-500',
  'reopened':    'bg-purple-100 text-purple-700',
};

const PRIORITY_BADGE = {
  high:   'bg-red-50 text-red-600',
  medium: 'bg-yellow-50 text-yellow-700',
  low:    'bg-gray-50 text-gray-500',
};

export default function Bugs() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (filterStatus)   params.set('status',   filterStatus);
    if (filterSeverity) params.set('severity', filterSeverity);
    if (filterPriority) params.set('priority', filterPriority);
    if (search)         params.set('search',   search);
    params.set('sort',  sortField);
    params.set('order', sortOrder);
    try {
      const res = await fetch(`/api/bugs?${params}`);
      const json = await res.json();
      if (json.success) setBugs(json.data);
      else setFetchError('Failed to load bugs.');
    } catch {
      setFetchError('Failed to load bugs. Check your connection and try again.');
    }
    setLoading(false);
  }, [filterStatus, filterSeverity, filterPriority, search, sortField, sortOrder]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this bug?')) return;
    try {
      await fetch(`/api/bugs/${id}`, { method: 'DELETE' });
      fetchBugs();
    } catch { /* list refresh handles state */ }
  };

  const handleSaved = (bug) => {
    setModalOpen(false);
    navigate(`/bugs/${bug.id}`);
  };

  const sortIcon = (field) => sortField === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Bugs</h1>
            <p className="text-sm text-gray-500 mt-0.5">{bugs.length} total</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Report Bug
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="reopened">Reopened</option>
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Trivial">Trivial</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or description…"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('title')}>Title{sortIcon('title')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('severity')}>Severity{sortIcon('severity')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('priority')}>Priority{sortIcon('priority')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('status')}>Status{sortIcon('status')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('created_at')}>Created{sortIcon('created_at')}</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : fetchError ? (
                <tr><td colSpan={7} className="text-center py-12 text-red-500 text-sm">{fetchError}</td></tr>
              ) : bugs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No bugs found.</td></tr>
              ) : bugs.map(b => (
                <tr key={b.id} onClick={() => navigate(`/bugs/${b.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{b.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{b.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[b.severity]}`}>{b.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${PRIORITY_BADGE[b.priority]}`}>{b.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => handleDelete(e, b.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <BugModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />}
    </div>
  );
}
