import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  Major:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  Minor:    'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  Trivial:  'bg-slate-100 dark:bg-slate-700 text-slate-500',
};

export default function TestCaseImport() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'done'
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [importedCount, setImportedCount] = useState(0);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.csv$/i)) { setError('Please select a .csv file.'); return; }
    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/test-cases/import/preview', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to parse file.');
      } else {
        setPreview(json.data);
        setStep('preview');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    const validRows = preview.rows.filter(r => r.valid).map(r => r.data);
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/test-cases/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Import failed.');
      } else {
        setImportedCount(json.data.imported);
        setStep('done');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep('upload'); setFile(null); setPreview(null); setError(''); };

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-10 text-center max-w-sm w-full">
          <div className="text-green-500 text-4xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Import complete</h2>
          <p className="text-sm text-slate-500 mb-6">
            {importedCount} test case{importedCount !== 1 ? 's' : ''} added.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/test-cases')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              View Test Cases
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Import another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Import Test Cases</h1>
            <p className="text-sm text-slate-500 mt-0.5">Bulk-import test cases from a CSV file.</p>
          </div>
          <button onClick={() => navigate('/test-cases')} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300">
            ← Back to Test Cases
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-800 rounded px-4 py-3 text-sm text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* ── Step 1: Upload ──────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded p-14 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-blue-500 bg-blue-900/40'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => pickFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <p className="text-blue-400 font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </>
              ) : (
                <>
                  <p className="text-slate-500 text-sm">
                    Drop a <strong>.csv</strong> file here, or{' '}
                    <span className="text-blue-400 underline">click to browse</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max 5 MB</p>
                </>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              Required columns:{' '}
              <code className="bg-slate-700 px-1 py-0.5 rounded">title</code>{' '}
              <code className="bg-slate-700 px-1 py-0.5 rounded">severity</code>{' '}
              <code className="bg-slate-700 px-1 py-0.5 rounded">scenario</code>{' '}
              (or <code className="bg-slate-700 px-1 py-0.5 rounded">steps</code>)
              {' '}— optional:{' '}
              <code className="bg-slate-700 px-1 py-0.5 rounded">status</code>
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Parsing…' : 'Preview →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ─────────────────────────────────────────────── */}
        {step === 'preview' && preview && (
          <>
            {/* Summary + actions */}
            <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 px-4 py-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">{preview.total} row{preview.total !== 1 ? 's' : ''}</span>
                <span className="text-green-400 font-medium">{preview.valid_count} valid</span>
                {preview.invalid_count > 0 && (
                  <span className="text-red-400 font-medium">{preview.invalid_count} invalid — will be skipped</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Start over
                </button>
                <button
                  onClick={handleCommit}
                  disabled={preview.valid_count === 0 || loading}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Importing…'
                    : `Import ${preview.valid_count} row${preview.valid_count !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Preview table */}
            <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="min-w-full text-sm divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-white dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {preview.rows.map(row => (
                    <tr key={row.row_num} className={row.valid ? 'hover:bg-slate-50 dark:hover:bg-slate-900' : 'bg-red-900/40'}>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.row_num}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-xs">
                        {row.data.title
                          ? <span className="truncate block max-w-xs">{row.data.title}</span>
                          : <span className="text-slate-500 dark:text-slate-400 italic">empty</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.data.severity
                          ? <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[row.data.severity] || 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{row.data.severity}</span>
                          : <span className="text-slate-500 dark:text-slate-400 italic text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{row.data.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                        {row.data.scenario
                          ? <span className="truncate block max-w-xs">{row.data.scenario}</span>
                          : <span className="text-slate-500 dark:text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.errors.length > 0 ? (
                          <ul className="text-xs text-red-400 space-y-0.5">
                            {row.errors.map((e, i) => <li key={i}>· {e}</li>)}
                          </ul>
                        ) : (
                          <span className="text-green-500 text-xs font-medium">✓ valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
