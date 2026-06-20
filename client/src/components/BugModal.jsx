import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import useFocusTrap from '../hooks/useFocusTrap';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['high', 'medium', 'low'];

export default function BugModal({ bug, onClose, onSaved }) {
  const isEdit = Boolean(bug);
  const { settings } = useSettings() || {};
  const [form, setForm] = useState({
    title: '', description: '', severity: 'Major', priority: 'medium',
    steps: '', expected: '', actual: '', environment: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  useEffect(() => {
    if (!isEdit && settings?.default_severity_for_new_bugs) {
      setForm(f => ({ ...f, severity: settings.default_severity_for_new_bugs }));
    }
  }, [settings?.default_severity_for_new_bugs, isEdit]);

  useEffect(() => {
    if (bug) {
      setForm({
        title: bug.title,
        description: bug.description,
        severity: bug.severity,
        priority: bug.priority,
        steps: (bug.steps_to_reproduce || []).join('\n'),
        expected: bug.expected || '',
        actual: bug.actual || '',
        environment: bug.environment || '',
      });
    }
  }, [bug]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      priority: form.priority,
      steps_to_reproduce: form.steps.split('\n').map(s => s.trim()).filter(Boolean),
      expected: form.expected.trim(),
      actual: form.actual.trim(),
      environment: form.environment.trim(),
    };
    try {
      const res = await fetch(
        isEdit ? `/api/bugs/${bug.id}` : '/api/bugs',
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Something went wrong.'); setSaving(false); return; }
      onSaved(json.data);
    } catch {
      setError('Failed to save. Check your connection.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="bug-modal-title" className="relative bg-white rounded shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
          <h2 id="bug-modal-title" className="text-lg font-semibold text-stone-900">{isEdit ? 'Edit Bug' : 'Report Bug'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={set('title')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Short description of what is broken" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Full description of the issue" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Severity *</label>
              <select value={form.severity} onChange={set('severity')}
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')}
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Steps to Reproduce</label>
            <textarea value={form.steps} onChange={set('steps')} rows={4}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder={"One step per line:\nOpen the app\nClick Login\nObserve the error"} />
            <p className="text-xs text-stone-400 mt-1">One step per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Expected</label>
            <input type="text" value={form.expected} onChange={set('expected')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="What should happen" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Actual</label>
            <input type="text" value={form.actual} onChange={set('actual')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="What actually happens" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Environment</label>
            <input type="text" value={form.environment} onChange={set('environment')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. iOS 16.4, Safari, iPhone 13" />
          </div>

          <div className="flex justify-end gap-3 pt-2 pb-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-md text-sm text-stone-700 hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Report Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
