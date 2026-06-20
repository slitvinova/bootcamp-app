import { useState, useEffect, useRef } from 'react';
import GherkinEditor from './GherkinEditor';
import useFocusTrap from '../hooks/useFocusTrap';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

export default function TestCaseModal({ testCase, onClose, onSaved }) {
  const isEdit = Boolean(testCase);
  const [form, setForm] = useState({
    title: '',
    scenario: '',
    severity: 'Critical',
    status: 'draft',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  useEffect(() => {
    if (testCase) {
      setForm({
        title: testCase.title || '',
        scenario: testCase.scenario || '',
        severity: testCase.severity || 'Critical',
        status: testCase.status || 'draft',
      });
    }
  }, [testCase]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.scenario || !form.severity) {
      setError('Title, scenario, and severity are required.');
      return;
    }
    if (!form.scenario.toLowerCase().includes('then')) {
      setError('Scenario must include a Then line.');
      return;
    }
    setSaving(true);
    const res = await fetch(
      isEdit ? `/api/test-cases/${testCase.id}` : '/api/test-cases',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    );
    const json = await res.json();
    if (!json.success) {
      setError(json.error || 'Something went wrong.');
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="tc-modal-title" className="relative bg-white dark:bg-slate-800 rounded shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="tc-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Test Case' : 'New Test Case'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/40 border border-red-800 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Short, imperative description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Scenario * <span className="font-normal text-slate-500 dark:text-slate-400">— Given / When / Then / And</span>
            </label>
            <GherkinEditor
              value={form.scenario}
              onChange={set('scenario')}
              rows={6}
              placeholder={"Given ...\nWhen ...\nThen ...\nAnd ... (if needed)"}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Severity *</label>
              <select
                value={form.severity}
                onChange={set('severity')}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
