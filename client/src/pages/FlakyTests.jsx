import { useState, useEffect } from 'react';

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800',
  Major:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
  Minor:    'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
  Trivial:  'bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-300 dark:border-slate-600',
};

function PatternDots({ pattern }) {
  const COLOR = {
    passed:  'bg-green-500',
    failed:  'bg-red-500',
    skipped: 'bg-slate-300',
  };
  return (
    <div className="flex items-center gap-1">
      {pattern.map((r, i) => (
        <span
          key={i}
          title={r}
          className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLOR[r] || 'bg-slate-300'}`}
        />
      ))}
    </div>
  );
}

export default function FlakyTests() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/flaky-tests')
      .then(r => r.json())
      .then(j => {
        if (j.success) setData(j.data);
        else setError('Failed to load flaky test data.');
      })
      .catch(() => setError('Failed to load. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  const { leaderboard, total_flaky, total_runs } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Flaky Tests</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tests that pass in some runs and fail in others</p>
          </div>
          {total_runs > 0 && (
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900 dark:text-white">{total_flaky}</span> test{total_flaky !== 1 ? 's' : ''} flagged across{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{total_runs}</span> run{total_runs !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Empty state */}
        {leaderboard.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-16 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No flaky tests detected yet.</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Run test cases across multiple runs to see reliability trends here.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Test Case</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-24">Severity</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Flake Rate</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-40">Last 10 Runs</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hypothesis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {leaderboard.map((test, idx) => (
                  <tr key={test.test_case_id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">{test.test_case_title}</span>
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                        {test.pass_count}P&nbsp;{test.fail_count}F
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[test.test_case_severity]}`}>
                        {test.test_case_severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.round(test.flake_rate * 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">
                          {Math.round(test.flake_rate * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PatternDots pattern={test.recent_pattern} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {test.hypothesis ? (
                        <span className="italic text-slate-500 text-xs leading-relaxed">{test.hypothesis}</span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300 text-xs italic">Generating…</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">Dot key:</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> passed
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> failed
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" /> skipped
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
