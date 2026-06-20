import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { SHORTCUTS } from '../shortcuts';

const TIMEZONES = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Singapore'];

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PAGE_SIZES = [10, 20, 50, 100];

export default function Settings() {
  const { settings, updateSettings } = useSettings() || {};
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings && !form) {
      setForm({
        ...settings,
        timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [settings, form]);

  if (!form) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const result = await updateSettings({
      ...form,
      default_page_size: Number(form.default_page_size),
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error || 'Failed to save settings.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">Settings</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Preferences for this workspace.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Appearance */}
          <section className="bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 p-5">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Appearance</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Theme</label>
              <select
                value={form.theme}
                onChange={set('theme')}
                className="border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
              >
                <option value="system">System default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </section>

          {/* Defaults */}
          <section className="bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 p-5">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Defaults</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Default severity for new bugs
                </label>
                <select
                  value={form.default_severity_for_new_bugs}
                  onChange={set('default_severity_for_new_bugs')}
                  className="border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
                >
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Default page size
                </label>
                <select
                  value={form.default_page_size}
                  onChange={set('default_page_size')}
                  className="border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
                >
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Localization */}
          <section className="bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 p-5">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Localization</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Timezone</label>
              <select
                value={form.timezone}
                onChange={set('timezone')}
                className="border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-full max-w-xs"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Stored for reference — date display uses browser time.
              </p>
            </div>
          </section>

          {/* Automation */}
          <section className="bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 p-5">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Automation</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_generate_report_after_run}
                onChange={set('auto_generate_report_after_run')}
                className="mt-0.5 h-4 w-4 text-orange-600 border-stone-300 rounded focus:ring-orange-400"
              />
              <div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Auto-generate report after run
                </span>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  When the last test case in a run is marked, automatically create a report and navigate to it.
                </p>
              </div>
            </label>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 p-5">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-5">
              {SHORTCUTS.map(group => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    {group.group}
                  </p>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div key={item.display} className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">{item.description}</span>
                        <kbd className="text-xs font-mono bg-stone-100 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded px-2 py-0.5 text-stone-700 dark:text-stone-300">
                          {item.display}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            {saved && <span className="text-sm text-green-600">Saved ✓</span>}
          </div>

        </form>
      </div>
    </div>
  );
}
