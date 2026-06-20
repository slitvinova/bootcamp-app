import { useState, useEffect } from 'react';

const STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

export default function SuiteModal({ suite, onClose, onSaved }) {
  const isEdit = Boolean(suite);
  const [form, setForm] = useState({ name: '', feature: '', status: 'draft' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (suite) setForm({ name: suite.name, feature: suite.feature, status: suite.status });
  }, [suite]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.feature) {
      setError('Name and feature are required.');
      return;
    }
    setSaving(true);
    const res = await fetch(
      isEdit ? `/api/suites/${suite.id}` : '/api/suites',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    );
    const json = await res.json();
    if (!json.success) { setError(json.error || 'Something went wrong.'); setSaving(false); return; }
    onSaved(json.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">{isEdit ? 'Edit Suite' : 'New Suite'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Login Smoke Suite"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Feature *</label>
            <input
              type="text"
              value={form.feature}
              onChange={set('feature')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. login, rewards, profile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 pb-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-md text-sm text-stone-700 hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
