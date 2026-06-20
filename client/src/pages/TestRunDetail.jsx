import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const RUN_STATUS_BADGE = {
  pending:   'bg-slate-100 dark:bg-slate-700 text-slate-500',
  running:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  completed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
};

const RESULT_BADGE = {
  passed:  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  failed:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  skipped: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800',
  Major:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
  Minor:    'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
  Trivial:  'bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600',
};

export default function TestRunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings() || {};
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState({});
  const [notes, setNotes] = useState({});
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetch(`/api/test-runs/${id}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setRun(j.data);
          const n = {};
          j.data.results.forEach(r => { n[r.id] = r.notes || ''; });
          setNotes(n);
        } else {
          setLoadError('Run not found.');
        }
      })
      .catch(() => setLoadError('Failed to load run.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setResult = async (resultId, result) => {
    const prevStatus = run?.status;
    setSaving(s => ({ ...s, [resultId]: true }));
    try {
      const res = await fetch(`/api/test-runs/${id}/results/${resultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, notes: notes[resultId] || '' }),
      });
      const json = await res.json();
      if (json.success) {
        setRun(json.data);
        const n = {};
        json.data.results.forEach(r => { n[r.id] = r.notes || ''; });
        setNotes(n);
        if (prevStatus !== 'completed' && json.data.status === 'completed' && settings?.auto_generate_report_after_run) {
          generateReport();
        }
      }
    } finally {
      setSaving(s => ({ ...s, [resultId]: false }));
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: Number(id) }),
      });
      const json = await res.json();
      if (json.success) navigate(`/reports/${json.data.id}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  if (loading) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading…</div>;
  if (loadError) return <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  if (!run) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/test-runs')}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-1">
          ← All Runs
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Run #{run.id}</p>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{run.suite_name}</h1>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${RUN_STATUS_BADGE[run.status]}`}>
                  {run.status}
                </span>
                <span className="text-xs text-green-400 font-medium">{run.pass_count} passed</span>
                <span className="text-xs text-red-400 font-medium">{run.fail_count} failed</span>
                <span className="text-xs text-yellow-400 font-medium">{run.skip_count} skipped</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingReport ? 'Generating…' : 'Generate Report'}
              </button>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p>Started {formatDate(run.start_time)}</p>
                {run.end_time && <p>Ended {formatDate(run.end_time)}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">Test Cases</h2>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {run.results.map((r, i) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-5 text-right flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{r.test_case_title}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[r.test_case_severity]}`}>
                        {r.test_case_severity}
                      </span>
                      {r.result && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${RESULT_BADGE[r.result]}`}>
                          {r.result}
                        </span>
                      )}
                      {r.github_issue_url && (
                        <a href={r.github_issue_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                          </svg>
                          GitHub Issue
                        </a>
                      )}
                    </div>

                    <textarea
                      value={notes[r.id] ?? ''}
                      onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Notes (optional — required before marking failed)…"
                      rows={2}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none mb-2"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResult(r.id, 'passed')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'passed'
                            ? 'bg-green-600 text-slate-900 dark:text-white'
                            : 'border border-green-800 text-green-300 hover:bg-green-900/20'
                        } disabled:opacity-50`}
                      >
                        ✓ Pass
                      </button>
                      <button
                        onClick={() => setResult(r.id, 'failed')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'failed'
                            ? 'bg-blue-600 text-white'
                            : 'border border-red-800 text-red-300 hover:bg-red-900/40'
                        } disabled:opacity-50`}
                      >
                        ✗ Fail
                      </button>
                      <button
                        onClick={() => setResult(r.id, 'skipped')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'skipped'
                            ? 'bg-yellow-500 text-slate-900 dark:text-white'
                            : 'border border-yellow-800 text-yellow-300 hover:bg-yellow-900/40'
                        } disabled:opacity-50`}
                      >
                        → Skip
                      </button>
                      {saving[r.id] && <span className="text-xs text-slate-500 dark:text-slate-400">Saving…</span>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
