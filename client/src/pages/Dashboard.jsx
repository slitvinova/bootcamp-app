import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Formatters ────────────────────────────────────────────────────────────────

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
  if (item.action === 'status_change') return `${ref} marked ${item.new_value}`;
  if (item.action === 'comment') {
    const snippet = item.message.length > 60 ? item.message.slice(0, 60) + '…' : item.message;
    return `${ref}: "${snippet}"`;
  }
  return `${ref} updated`;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  pending:   'bg-slate-700 text-slate-500',
  running:   'bg-amber-900/40 text-amber-300',
  completed: 'bg-green-900/40 text-green-300',
};

const COVERAGE_COLORS = {
  draft:   '#d1d5db',
  ready:   '#3b82f6',
  passed:  '#4ade80',
  failed:  '#f87171',
  skipped: '#fbbf24',
};

// ── SVG math ──────────────────────────────────────────────────────────────────

function polarXY(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function donutArcPath(cx, cy, ro, ri, a0, a1) {
  const f = n => n.toFixed(2);
  const [x1, y1] = polarXY(cx, cy, ro, a0);
  const [x2, y2] = polarXY(cx, cy, ro, a1);
  const [x3, y3] = polarXY(cx, cy, ri, a1);
  const [x4, y4] = polarXY(cx, cy, ri, a0);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M${f(x1)} ${f(y1)} A${ro} ${ro} 0 ${lg} 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${ri} ${ri} 0 ${lg} 0 ${f(x4)} ${f(y4)}Z`;
}

// ── Shared small components ───────────────────────────────────────────────────

function MetricCard({ label, value, sub, loading }) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded border border-slate-700 p-5 animate-pulse">
        <div className="h-3 bg-slate-700 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-16" />
      </div>
    );
  }
  return (
    <div className="bg-slate-800 rounded border border-slate-700 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonRow({ cols }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-700 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="h-32 flex items-center justify-center text-sm text-slate-400">{message}</div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-32 flex items-end gap-1.5 px-2 pb-1 animate-pulse">
      {[40, 65, 50, 80, 55, 45, 72, 48].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-700 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// ── SVG chart components ──────────────────────────────────────────────────────

function PassRateSVG({ runs }) {
  if (runs.length < 2) {
    return <ChartEmpty message="Need at least 2 test runs to show the trend." />;
  }

  const W = 480, H = 110;
  const PL = 32, PR = 8, PT = 8, PB = 22;
  const pW = W - PL - PR;
  const pH = H - PT - PB;

  const x = i => PL + (i / (runs.length - 1)) * pW;
  const y = v => PT + pH * (1 - v / 100);
  const points = runs.map((r, i) => `${x(i).toFixed(1)},${y(r.pass_rate).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="#334155" strokeWidth="1" />
          <text x={PL - 4} y={y(v) + 4} textAnchor="end" fontSize="9" fill="#64748b">{v}%</text>
        </g>
      ))}
      {runs.map((r, i) => (
        <text key={i} x={x(i)} y={H - 5} textAnchor="middle" fontSize="9" fill="#64748b">
          {r.date}
        </text>
      ))}
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {runs.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r.pass_rate)} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function BugsSVG({ weeks }) {
  if (!weeks.some(w => w.opened > 0 || w.closed > 0)) {
    return <ChartEmpty message="No bug activity in the last 8 weeks." />;
  }

  const W = 560, H = 110;
  const PL = 28, PR = 8, PT = 8, PB = 22;
  const pW = W - PL - PR;
  const pH = H - PT - PB;

  const maxVal = Math.max(1, ...weeks.map(w => Math.max(w.opened, w.closed)));
  const y0 = PT + pH;
  const y = v => PT + pH * (1 - v / maxVal);
  const groupW = pW / weeks.length;
  const barW = Math.floor(groupW * 0.28);
  const ox = i => PL + i * groupW + (groupW - 2 * barW - 3) / 2;
  const cx = i => ox(i) + barW + 3;

  const ticks = maxVal <= 4
    ? Array.from({ length: maxVal + 1 }, (_, i) => i)
    : [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="#334155" strokeWidth="1" />
          <text x={PL - 4} y={y(v) + 4} textAnchor="end" fontSize="9" fill="#64748b">{v}</text>
        </g>
      ))}
      {weeks.map((w, i) => (
        <g key={i}>
          {w.opened > 0 && (
            <rect x={ox(i)} y={y(w.opened)} width={barW} height={y0 - y(w.opened)} fill="#f87171" rx="1" />
          )}
          {w.closed > 0 && (
            <rect x={cx(i)} y={y(w.closed)} width={barW} height={y0 - y(w.closed)} fill="#34d399" rx="1" />
          )}
          <text x={PL + i * groupW + groupW / 2} y={H - 5} textAnchor="middle" fontSize="9" fill="#64748b">
            {w.week}
          </text>
        </g>
      ))}
      <rect x={W - PR - 112} y={PT + 1} width="8" height="8" fill="#f87171" rx="1" />
      <text x={W - PR - 101} y={PT + 8} fontSize="9" fill="#94a3b8">Opened</text>
      <rect x={W - PR - 57} y={PT + 1} width="8" height="8" fill="#34d399" rx="1" />
      <text x={W - PR - 46} y={PT + 8} fontSize="9" fill="#94a3b8">Closed</text>
    </svg>
  );
}

function CoverageSVG({ segments }) {
  if (!segments.length) return <ChartEmpty message="No test cases yet." />;

  const total = segments.reduce((s, d) => s + d.count, 0);
  const W = 280, H = 140;
  const CX = 68, CY = 70, RO = 54, RI = 30;

  let angle = 0;
  const arcs = segments.map(seg => {
    const start = angle;
    angle += (seg.count / total) * 360;
    return { ...seg, start, end: angle };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {arcs.length === 1 ? (
        <>
          <circle cx={CX} cy={CY} r={RO} fill={COVERAGE_COLORS[arcs[0].status] || '#334155'} />
          <circle cx={CX} cy={CY} r={RI} fill="#1e293b" />
        </>
      ) : (
        arcs.map(seg => (
          <path
            key={seg.status}
            d={donutArcPath(CX, CY, RO, RI, seg.start, seg.end)}
            fill={COVERAGE_COLORS[seg.status] || '#334155'}
          />
        ))
      )}
      <text x={CX} y={CY + 7} textAnchor="middle" fontSize="17" fontWeight="600" fill="#f1f5f9">
        {total}
      </text>
      {arcs.map((seg, i) => (
        <g key={seg.status} transform={`translate(140, ${i * 22 + 18})`}>
          <rect width="9" height="9" rx="2" fill={COVERAGE_COLORS[seg.status] || '#334155'} />
          <text x="13" y="8.5" fontSize="10" fill="#cbd5e1">
            {seg.status.charAt(0).toUpperCase() + seg.status.slice(1)}
          </text>
          <text x="127" y="8.5" textAnchor="end" fontSize="10" fill="#94a3b8">{seg.count}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
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

  const fetchTrends = async (isInitial = false) => {
    if (isInitial) setTrendsLoading(true);
    try {
      const res = await fetch('/api/dashboard/trends');
      const json = await res.json();
      if (json.success) setTrends(json.data);
    } catch {
      // charts degrade silently
    } finally {
      if (isInitial) setTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);
    fetchTrends(true);
    intervalRef.current = setInterval(() => {
      fetchMetrics(false);
      fetchTrends(false);
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const { metrics, recent_runs: recentRuns, recent_activity: recentActivity } = data || {};
  const trendRuns = (trends?.pass_rate_trend || []).filter(r => r.pass_rate !== null);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <span className="text-xs text-slate-400">Auto-refreshes every 30s</span>
        </div>

        {error && !loading && (
          <div className="bg-red-900/40 border border-red-800 rounded px-4 py-3 text-sm text-red-300 mb-6">
            {error}
            <button onClick={() => fetchMetrics(true)} className="ml-3 underline hover:no-underline">
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

        {/* Recent runs + activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-slate-200">Recent Test Runs</h2>
            </div>
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Suite</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Results</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Started</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  : recentRuns?.length > 0
                    ? recentRuns.map(run => (
                        <tr key={run.id} className="hover:bg-slate-900">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{run.suite_name}</p>
                            <p className="text-xs text-slate-400">#{run.id}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[run.status] || 'bg-slate-700 text-slate-500'}`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 text-xs">
                              <span className="text-green-400 font-medium">{run.pass_count}P</span>
                              <span className="text-red-400 font-medium">{run.fail_count}F</span>
                              <span className="text-yellow-400 font-medium">{run.skip_count}S</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDate(run.start_time)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => navigate(`/test-runs/${run.id}`)}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    : (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center">
                            <p className="text-sm text-slate-400">No test runs yet.</p>
                            <p className="text-xs text-slate-300 mt-1">Open a test suite and click Run Tests to start one.</p>
                          </td>
                        </tr>
                      )
                }
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
            </div>
            <ul className="divide-y divide-slate-700">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="px-4 py-3 animate-pulse">
                      <div className="h-3 bg-slate-700 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-slate-700 rounded w-1/3" />
                    </li>
                  ))
                : recentActivity?.length > 0
                  ? recentActivity.map(item => (
                      <li key={item.id} className="px-4 py-3">
                        <p className="text-sm text-slate-200">{formatActivity(item)}</p>
                        {item.bug_title && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.bug_title}</p>
                        )}
                        <p className="text-xs text-slate-300 mt-0.5">{timeAgo(item.timestamp)}</p>
                      </li>
                    ))
                  : (
                      <li className="px-4 py-10 text-center">
                        <p className="text-sm text-slate-400">No activity yet.</p>
                        <p className="text-xs text-slate-300 mt-1">Activity appears when bugs are updated or commented on.</p>
                      </li>
                    )
              }
            </ul>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-slate-800 rounded border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Pass Rate Trend</h2>
            {trendsLoading ? <ChartSkeleton /> : <PassRateSVG runs={trendRuns} />}
          </div>

          <div className="bg-slate-800 rounded border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Test Coverage by Status</h2>
            {trendsLoading ? (
              <div className="animate-pulse h-32 flex items-center justify-center">
                <div className="h-24 w-24 bg-slate-700 rounded-full" />
              </div>
            ) : (
              <CoverageSVG segments={trends?.coverage || []} />
            )}
          </div>

          <div className="lg:col-span-3 bg-slate-800 rounded border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Bugs Opened vs Closed — Last 8 Weeks</h2>
            {trendsLoading ? <ChartSkeleton /> : <BugsSVG weeks={trends?.bugs_by_week || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}
