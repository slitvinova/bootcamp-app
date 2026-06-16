import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BugModal from '../components/BugModal';

const VALID_TRANSITIONS = {
  'open':        ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  'resolved':    ['closed', 'reopened'],
  'closed':      ['reopened'],
  'reopened':    ['in-progress', 'closed'],
};

const STATUS_LABEL = {
  'open': 'Open', 'in-progress': 'In Progress', 'resolved': 'Resolved',
  'closed': 'Closed', 'reopened': 'Reopened',
};

const STATUS_BADGE = {
  'open':        'bg-red-100 text-red-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'resolved':    'bg-green-100 text-green-700',
  'closed':      'bg-gray-100 text-gray-500',
  'reopened':    'bg-purple-100 text-purple-700',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 border border-red-300',
  Major:    'bg-orange-100 text-orange-700 border border-orange-300',
  Minor:    'bg-yellow-100 text-yellow-700 border border-yellow-300',
  Trivial:  'bg-gray-100 text-gray-500 border border-gray-300',
};

const PRIORITY_BADGE = {
  high:   'bg-red-50 text-red-600 border border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  low:    'bg-gray-50 text-gray-500 border border-gray-200',
};

export default function BugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [nextStatus, setNextStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    const fetchBug = async () => {
      try {
        const res = await fetch(`/api/bugs/${id}`);
        const json = await res.json();
        if (json.success) {
          setBug(json.data);
        } else if (res.status !== 404) {
          setLoadError('Something went wrong loading this bug. Try refreshing the page.');
        }
        // 404 → bug stays null → "Bug not found." is accurate
      } catch {
        setLoadError('Failed to load bug. Check your connection and try again.');
      }
      setLoading(false);
    };
    fetchBug();
  }, [id]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!nextStatus) { setStatusError('Select a status to transition to.'); return; }
    setStatusError('');
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/bugs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, message: statusMessage }),
      });
      const json = await res.json();
      if (json.success) {
        setBug(json.data);
        setNextStatus('');
        setStatusMessage('');
      } else {
        setStatusError(json.error || 'Failed to update status.');
      }
    } catch {
      setStatusError('Failed to update status. Check your connection.');
    }
    setStatusSaving(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { setCommentError('Comment cannot be empty.'); return; }
    setCommentError('');
    setCommentSaving(true);
    try {
      const res = await fetch(`/api/bugs/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: comment }),
      });
      const json = await res.json();
      if (json.success) { setBug(json.data); setComment(''); }
      else setCommentError(json.error || 'Failed to add comment.');
    } catch {
      setCommentError('Failed to add comment. Check your connection.');
    }
    setCommentSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this bug?')) return;
    setDeleteError('');
    try {
      const res = await fetch(`/api/bugs/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) navigate('/bugs');
      else setDeleteError(json.error || 'Failed to delete bug.');
    } catch {
      setDeleteError('Failed to delete bug. Check your connection.');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading)   return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>;
  if (loadError) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-sm">{loadError}</div>;
  if (!bug)      return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
      <p className="text-gray-400">Bug not found.</p>
      <button onClick={() => navigate('/bugs')} className="text-sm text-indigo-600 hover:text-indigo-800">← Back to bug list</button>
    </div>
  );

  const allowed = VALID_TRANSITIONS[bug.status] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/bugs')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          ← All Bugs
        </button>

        {/* Header card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">#{bug.id}</p>
              <h1 className="text-xl font-semibold text-gray-900 mb-3">{bug.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[bug.status]}`}>
                  {STATUS_LABEL[bug.status]}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[bug.severity]}`}>
                  {bug.severity}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${PRIORITY_BADGE[bug.priority]}`}>
                  {bug.priority} priority
                </span>
                {bug.environment && <span className="text-xs text-gray-400">{bug.environment}</span>}
              </div>
              {bug.github_issue_url && (
                <a href={bug.github_issue_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  GitHub Issue
                </a>
              )}
              <p className="text-xs text-gray-400 mt-2">Reported {formatDate(bug.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setEditModalOpen(true)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={handleDelete}
                  className="px-3 py-1.5 border border-red-200 rounded-md text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 space-y-5">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{bug.description}</p>
          </div>

          {bug.steps_to_reproduce && bug.steps_to_reproduce.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Steps to Reproduce</h2>
              <ol className="list-decimal list-inside space-y-1">
                {bug.steps_to_reproduce.map((step, i) => (
                  <li key={i} className="text-sm text-gray-800">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {(bug.expected || bug.actual) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bug.expected && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Expected</h2>
                  <p className="text-sm text-gray-800">{bug.expected}</p>
                </div>
              )}
              {bug.actual && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actual</h2>
                  <p className="text-sm text-gray-800">{bug.actual}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status change */}
        {allowed.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h2>
            <form onSubmit={handleStatusChange} className="space-y-3">
              {statusError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{statusError}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <select value={nextStatus} onChange={e => setNextStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select new status…</option>
                  {allowed.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button type="submit" disabled={!nextStatus || statusSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {statusSaving ? 'Saving…' : 'Update Status'}
                </button>
              </div>
              <input type="text" value={statusMessage} onChange={e => setStatusMessage(e.target.value)}
                placeholder="Optional note (reason for change)…"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </form>
          </div>
        )}

        {/* Add comment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Comment</h2>
          <form onSubmit={handleAddComment} className="space-y-2">
            {commentError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{commentError}</p>
            )}
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Add a note or comment…" rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            <button type="submit" disabled={commentSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {commentSaving ? 'Saving…' : 'Add Comment'}
            </button>
          </form>
        </div>

        {/* Activity timeline */}
        {bug.activity && bug.activity.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity</h2>
            <ul className="space-y-4">
              {bug.activity.map(a => (
                <li key={a.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.action === 'status_change' ? 'bg-indigo-400' : 'bg-gray-300'}`} />
                  <div className="flex-1">
                    {a.action === 'status_change' ? (
                      <p className="text-sm text-gray-700">
                        Status changed from{' '}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[a.old_value]}`}>{STATUS_LABEL[a.old_value]}</span>
                        {' '}to{' '}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[a.new_value]}`}>{STATUS_LABEL[a.new_value]}</span>
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-gray-700">Comment</p>
                    )}
                    {a.message && <p className="text-sm text-gray-500 mt-0.5">{a.message}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {editModalOpen && (
        <BugModal bug={bug} onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => { setEditModalOpen(false); setBug(prev => ({ ...prev, ...updated })); }} />
      )}
    </div>
  );
}
