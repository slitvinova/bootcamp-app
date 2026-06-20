import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddCaseModal from '../components/AddCaseModal';
import SuiteModal from '../components/SuiteModal';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800',
  Major: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
  Minor: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
  Trivial: 'bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600',
};

const STATUS_BADGE = {
  draft: 'bg-slate-100 dark:bg-slate-700 text-slate-500',
  ready: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  passed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  failed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  skipped: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

const SUITE_STATUS_BADGE = {
  'draft': 'bg-slate-100 dark:bg-slate-700 text-slate-500',
  'ready': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'in-progress': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'passed': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  'failed': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

export default function SuiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reorderError, setReorderError] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const fetchSuite = async () => {
    try {
      const res = await fetch(`/api/suites/${id}`);
      const json = await res.json();
      if (json.success) setSuite(json.data);
    } catch {
      setLoadError('Failed to load suite. Check your connection and try again.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSuite(); }, [id]);

  const handleRemoveCase = async (tcId) => {
    if (!window.confirm('Remove this test case from the suite?')) return;
    const res = await fetch(`/api/suites/${id}/cases/${tcId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) setSuite(json.data);
  };

  const handleAdded = (updatedSuite) => {
    setSuite(updatedSuite);
  };

  const handleEditSaved = (updatedSuite) => {
    setEditModalOpen(false);
    setSuite(prev => ({ ...prev, ...updatedSuite }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this entire suite?')) return;
    await fetch(`/api/suites/${id}`, { method: 'DELETE' });
    navigate('/test-suites');
  };

  const handleNewRun = async () => {
    const res = await fetch('/api/test-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite_id: Number(id), created_by: 'user' }),
    });
    const json = await res.json();
    if (json.success) navigate(`/test-runs/${json.data.id}`);
  };

  // Drag-to-reorder handlers
  const onDragStart = (e, index) => {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(index);
  };

  const onDrop = async (e, toIndex) => {
    e.preventDefault();
    const fromIndex = dragFrom.current;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOver(null);
      return;
    }
    const prevCases = [...suite.cases];
    const newCases = [...suite.cases];
    const [moved] = newCases.splice(fromIndex, 1);
    newCases.splice(toIndex, 0, moved);
    setSuite(s => ({ ...s, cases: newCases }));
    setDragOver(null);
    dragFrom.current = null;
    setReorderError('');

    try {
      const res = await fetch(`/api/suites/${id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newCases.map(c => c.id) }),
      });
      const json = await res.json();
      if (!json.success) {
        setSuite(s => ({ ...s, cases: prevCases }));
        setReorderError('Failed to save new order. Please try again.');
      }
    } catch {
      setSuite(s => ({ ...s, cases: prevCases }));
      setReorderError('Failed to save new order. Please try again.');
    }
  };

  const onDragEnd = () => {
    dragFrom.current = null;
    setDragOver(null);
  };

  if (loading) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading…</div>;
  if (loadError) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  if (!suite) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Suite not found.</div>;

  const existingIds = suite.cases.map(c => c.id);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/test-suites')}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1"
          >
            ← All Suites
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{suite.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">Feature: <span className="font-medium text-slate-700 dark:text-slate-200">{suite.feature}</span></span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${SUITE_STATUS_BADGE[suite.status]}`}>
                  {suite.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewRun}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                ▶ Run Tests
              </button>
              <button
                onClick={() => setEditModalOpen(true)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 border border-red-800 rounded-md text-sm text-red-400 hover:bg-red-900/40"
              >
                Delete Suite
              </button>
            </div>
          </div>
        </div>

        {/* Cases */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Test Cases <span className="text-slate-500 dark:text-slate-400 font-normal">({suite.cases.length})</span>
            </h2>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
            >
              + Add Case
            </button>
          </div>

          {reorderError && (
            <p className="px-4 py-2 text-sm text-red-400 bg-red-900/40 border-b border-red-800">{reorderError}</p>
          )}

          {suite.cases.length === 0 ? (
            <p className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">No test cases yet. Add one above.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {suite.cases.map((tc, index) => (
                <li
                  key={tc.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    dragOver === index ? 'bg-blue-900/40 border-t-2 border-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  {/* Drag handle */}
                  <span className="text-slate-600 dark:text-slate-300 cursor-grab select-none text-lg leading-none" title="Drag to reorder">⠿</span>

                  {/* Order number */}
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-5 text-right flex-shrink-0">{index + 1}</span>

                  {/* Title */}
                  <span className="flex-1 text-sm text-slate-900 dark:text-white font-medium">{tc.title}</span>

                  {/* Severity */}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${SEVERITY_BADGE[tc.severity]}`}>
                    {tc.severity}
                  </span>

                  {/* Status */}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${STATUS_BADGE[tc.status]}`}>
                    {tc.status}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveCase(tc.id)}
                    className="text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 ml-1"
                    title="Remove from suite"
                    aria-label="Remove from suite"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">Drag rows to reorder</p>
      </div>

      {addModalOpen && (
        <AddCaseModal
          suiteId={id}
          existingIds={existingIds}
          onClose={() => setAddModalOpen(false)}
          onAdded={(updated) => { handleAdded(updated); }}
        />
      )}

      {editModalOpen && (
        <SuiteModal
          suite={suite}
          onClose={() => setEditModalOpen(false)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
