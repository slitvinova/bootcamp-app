import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms === 0) return '< 1s';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatActivity(item) {
  const ref = `Bug #${item.bug_id}`;
  if (item.action === 'status_change') {
    return `${ref} marked ${item.new_value}`;
  }
  if (item.action === 'comment') {
    const snippet = item.message.length > 60 ? item.message.slice(0, 60) + '…' : item.message;
    return `${ref}: "${snippet}"`;
  }
  return `${ref} updated`;
}

const STATUS_BADGE = {
  pending:   'bg-gray-100 text-gray-500',
  running:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

function MetricCard({ label, value, sub, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonRow({ cols }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchMetrics = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/dashboard/metrics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to load metrics.');
      }
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);
    intervalRef.current = setInterval(() => fetchMetrics(false), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const { metrics, recent_runs: recentRuns, recent_activity: recentActivity } = data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400">Auto-refreshes every 30s</span>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
            {error}
            <button
              onClick={() => fetchMetrics(true)}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Test Cases"
            value={metrics?.total_test_cases ?? '—'}
            sub={metrics?.total_test_cases === 0 ? 'Add your first test case' : undefined}
            loading={loading}
          />
          <MetricCard
            label="Pass Rate"
            value={metrics?.pass_rate != null ? `${metrics.pass_rate}%` : '—'}
            sub={metrics?.pass_rate != null ? 'across all runs' : 'Start a run to see pass rate'}
            loading={loading}
          />
          <MetricCard
            label="Open Bugs"
            value={metrics?.open_bugs ?? '—'}
            sub={metrics?.open_bugs === 0 ? 'No open issues' : 'open · in-progress · reopened'}
            loading={loading}
          />
          <MetricCard
            label="Avg Run Duration"
            value={formatDuration(metrics?.avg_duration_ms)}
            sub={metrics?.avg_duration_ms == null ? 'Run tests to measure duration' : 'completed runs'}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent test runs */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Recent Test Runs</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Suite</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Results</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Started</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    : recentRuns?.length > 0
                      ? recentRuns.map(run => (
                          <tr key={run.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{run.suite_name}</p>
                              <p className="text-xs text-gray-400">#{run.id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[run.status] || 'bg-gray-100 text-gray-500'}`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 text-xs">
                                <span className="text-green-600 font-medium">{run.pass_count}P</span>
                                <span className="text-red-600 font-medium">{run.fail_count}F</span>
                                <span className="text-yellow-600 font-medium">{run.skip_count}S</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{formatDate(run.start_time)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => navigate(`/test-runs/${run.id}`)}
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      : (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center">
                              <p className="text-sm text-gray-400">No test runs yet.</p>
                              <p className="text-xs text-gray-300 mt-1">Open a test suite and click Run Tests to start one.</p>
                            </td>
                          </tr>
                        )
                  }
                </tbody>
              </table>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="px-4 py-3 animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </li>
                    ))
                  : recentActivity?.length > 0
                    ? recentActivity.map(item => (
                        <li key={item.id} className="px-4 py-3">
                          <p className="text-sm text-gray-800">{formatActivity(item)}</p>
                          {item.bug_title && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.bug_title}</p>
                          )}
                          <p className="text-xs text-gray-300 mt-0.5">{timeAgo(item.timestamp)}</p>
                        </li>
                      ))
                    : (
                        <li className="px-4 py-10 text-center">
                          <p className="text-sm text-gray-400">No activity yet.</p>
                          <p className="text-xs text-gray-300 mt-1">Activity appears when bugs are updated or commented on.</p>
                        </li>
                      )
                }
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}
