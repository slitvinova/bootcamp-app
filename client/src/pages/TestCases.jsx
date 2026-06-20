import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TestCaseModal from '../components/TestCaseModal';
import { useSettings } from '../context/SettingsContext';

const SEVERITY_BADGE = {
  Critical: 'bg-red-900/40 text-red-300 border border-red-800',
  Major: 'bg-blue-900/40 text-blue-300 border border-blue-800',
  Minor: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
  Trivial: 'bg-slate-700 text-slate-500 border border-slate-600',
};

const STATUS_BADGE = {
  draft: 'bg-slate-700 text-slate-500',
  ready: 'bg-blue-900/40 text-blue-300',
  passed: 'bg-green-900/40 text-green-300',
  failed: 'bg-red-900/40 text-red-300',
  skipped: 'bg-yellow-900/40 text-yellow-300',
};

function SortIcon({ field, sortField, sortOrder }) {
  if (sortField !== field) return <span className="ml-1 text-slate-300">↕</span>;
  return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export default function TestCases() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);

  const { settings } = useSettings() || {};
  const LIMIT = settings?.default_page_size || 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [filterStatus, sortField, sortOrder]);
  useEffect(() => { setPage(1); }, [LIMIT]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT, sort: sortField, order: sortOrder });
    if (filterStatus) params.set('status', filterStatus);
    if (debouncedSearch) params.set('search', debouncedSearch);
    const res = await fetch(`/api/test-cases?${params}`);
    const json = await res.json();
    if (json.success) {
      setRows(json.data.rows);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [page, LIMIT, sortField, sortOrder, filterStatus, debouncedSearch]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test case?')) return;
    await fetch(`/api/test-cases/${id}`, { method: 'DELETE' });
    fetchCases();
  };

  const openEdit = (tc) => { setEditingCase(tc); setModalOpen(true); };
  const openNew = () => { setEditingCase(null); setModalOpen(true); };
  const handleSaved = () => { setModalOpen(false); setEditingCase(null); fetchCases(); };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Test Cases</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} total</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/test-cases/export"
              download="test-cases.csv"
              className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Export CSV
            </a>
            <button
              onClick={() => navigate('/test-cases/import')}
              className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Import CSV
            </button>
            <button
              onClick={openNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Test Case
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search test cases"
            className="border border-slate-600 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-800"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-600 rounded-md px-3 py-2 text-sm bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Title</th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-300 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort('severity')}
                >
                  Severity <SortIcon field="severity" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-300">Status</th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-300 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort('updated_at')}
                >
                  Updated <SortIcon field="updated_at" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No test cases found.</td>
                </tr>
              ) : (
                rows.map(tc => (
                  <tr key={tc.id} className="hover:bg-slate-900 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{tc.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[tc.severity]}`}>
                        {tc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[tc.status]}`}>
                        {tc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(tc.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(tc)}
                        className="text-slate-400 hover:text-blue-400 mr-3 transition-colors"
                        title="Edit"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(tc.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                        aria-label="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-300">
            <span>{total} total</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-600 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-slate-600 rounded-md disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <TestCaseModal
          testCase={editingCase}
          onClose={() => { setModalOpen(false); setEditingCase(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
