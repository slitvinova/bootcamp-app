import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RUN_STATUS_BADGE = {
  pending:   'bg-gray-100 text-gray-500',
  running:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

const RESULT_BADGE = {
  passed:  'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  skipped: 'bg-yellow-100 text-yellow-700',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 border border-red-300',
  Major:    'bg-orange-100 text-orange-700 border border-orange-300',
  Minor:    'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Trivial:  'bg-gray-100 text-gray-500 border border-gray-300',
};

export default function TestRunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>;
  if (loadError) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  if (!run) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/test-runs')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          ← All Runs
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Run #{run.id}</p>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">{run.suite_name}</h1>
              <div className="flex items-center gap-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${RUN_STATUS_BADGE[run.status]}`}>
                  {run.status}
                </span>
                <span className="text-xs text-green-600 font-medium">{run.pass_count} passed</span>
                <span className="text-xs text-red-600 font-medium">{run.fail_count} failed</span>
                <span className="text-xs text-yellow-600 font-medium">{run.skip_count} skipped</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {generatingReport ? 'Generating…' : 'Generate Report'}
              </button>
              <div className="text-right text-xs text-gray-400">
                <p>Started {formatDate(run.start_time)}</p>
                {run.end_time && <p>Ended {formatDate(run.end_time)}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-700">Test Cases</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {run.results.map((r, i) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{r.test_case_title}</span>
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
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
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
                      className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-2"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResult(r.id, 'passed')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'passed'
                            ? 'bg-green-600 text-white'
                            : 'border border-green-300 text-green-700 hover:bg-green-50'
                        } disabled:opacity-50`}
                      >
                        ✓ Pass
                      </button>
                      <button
                        onClick={() => setResult(r.id, 'failed')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'failed'
                            ? 'bg-red-600 text-white'
                            : 'border border-red-300 text-red-700 hover:bg-red-50'
                        } disabled:opacity-50`}
                      >
                        ✗ Fail
                      </button>
                      <button
                        onClick={() => setResult(r.id, 'skipped')}
                        disabled={saving[r.id]}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          r.result === 'skipped'
                            ? 'bg-yellow-500 text-white'
                            : 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                        } disabled:opacity-50`}
                      >
                        → Skip
                      </button>
                      {saving[r.id] && <span className="text-xs text-gray-400">Saving…</span>}
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
