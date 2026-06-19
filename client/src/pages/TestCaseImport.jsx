import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700',
  Major:    'bg-orange-100 text-orange-700',
  Minor:    'bg-yellow-100 text-yellow-700',
  Trivial:  'bg-gray-100 text-gray-500',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="text-green-500 text-4xl mb-3">✓</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Import complete</h2>
          <p className="text-sm text-gray-500 mb-6">
            {importedCount} test case{importedCount !== 1 ? 's' : ''} added.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/test-cases')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              View Test Cases
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              Import another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Import Test Cases</h1>
            <p className="text-sm text-gray-500 mt-0.5">Bulk-import test cases from a CSV file.</p>
          </div>
          <button onClick={() => navigate('/test-cases')} className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to Test Cases
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* ── Step 1: Upload ──────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-14 text-center cursor-pointer transition-colors ${
                dragging
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
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
                  <p className="text-indigo-600 font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-sm">
                    Drop a <strong>.csv</strong> file here, or{' '}
                    <span className="text-indigo-600 underline">click to browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 5 MB</p>
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Required columns:{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">title</code>{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">severity</code>{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">scenario</code>{' '}
              (or <code className="bg-gray-100 px-1 py-0.5 rounded">steps</code>)
              {' '}— optional:{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">status</code>
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">{preview.total} row{preview.total !== 1 ? 's' : ''}</span>
                <span className="text-green-600 font-medium">{preview.valid_count} valid</span>
                {preview.invalid_count > 0 && (
                  <span className="text-red-600 font-medium">{preview.invalid_count} invalid — will be skipped</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                >
                  Start over
                </button>
                <button
                  onClick={handleCommit}
                  disabled={preview.valid_count === 0 || loading}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Importing…'
                    : `Import ${preview.valid_count} row${preview.valid_count !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Preview table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full text-sm divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.rows.map(row => (
                    <tr key={row.row_num} className={row.valid ? 'hover:bg-gray-50' : 'bg-red-50'}>
                      <td className="px-4 py-3 text-xs text-gray-400">{row.row_num}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                        {row.data.title
                          ? <span className="truncate block max-w-xs">{row.data.title}</span>
                          : <span className="text-gray-400 italic">empty</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.data.severity
                          ? <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[row.data.severity] || 'bg-gray-100 text-gray-500'}`}>{row.data.severity}</span>
                          : <span className="text-gray-400 italic text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{row.data.status}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                        {row.data.scenario
                          ? <span className="truncate block max-w-xs">{row.data.scenario}</span>
                          : <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {row.errors.length > 0 ? (
                          <ul className="text-xs text-red-600 space-y-0.5">
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
