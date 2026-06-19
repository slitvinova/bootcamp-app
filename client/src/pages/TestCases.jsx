import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TestCaseModal from '../components/TestCaseModal';
import { useSettings } from '../context/SettingsContext';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 border border-red-300',
  Major: 'bg-orange-100 text-orange-700 border border-orange-300',
  Minor: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Trivial: 'bg-gray-100 text-gray-500 border border-gray-300',
};

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-500',
  ready: 'bg-blue-100 text-blue-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-yellow-100 text-yellow-700',
};

function SortIcon({ field, sortField, sortOrder }) {
  if (sortField !== field) return <span className="ml-1 text-gray-300">↕</span>;
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Test Cases</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/test-cases/export"
              download="test-cases.csv"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </a>
            <button
              onClick={() => navigate('/test-cases/import')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Import CSV
            </button>
            <button
              onClick={openNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort('severity')}
                >
                  Severity <SortIcon field="severity" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort('updated_at')}
                >
                  Updated <SortIcon field="updated_at" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">No test cases found.</td>
                </tr>
              ) : (
                rows.map(tc => (
                  <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{tc.title}</td>
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
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(tc.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(tc)}
                        className="text-gray-400 hover:text-indigo-600 mr-3 transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(tc.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>{total} total</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 transition-colors"
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
