import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPE_LABEL = {
  test_case: 'Test Case',
  bug: 'Bug',
  suite: 'Suite',
};

const TYPE_COLOR = {
  test_case: 'text-orange-600 bg-orange-50',
  bug: 'text-red-600 bg-red-50',
  suite: 'text-green-600 bg-green-50',
};

function itemHref(type, id) {
  if (type === 'bug') return `/bugs/${id}`;
  if (type === 'suite') return `/test-suites/${id}`;
  return '/test-cases';
}

export default function QuickSearch({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) { setResults(json.data); setFocusedIdx(0); }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 200);
  };

  // Flat list for keyboard nav
  const flatItems = results
    ? [
        ...results.test_cases.map(r => ({ type: 'test_case', ...r })),
        ...results.bugs.map(r => ({ type: 'bug', ...r })),
        ...results.suites.map(r => ({ type: 'suite', ...r })),
      ]
    : [];

  const go = (item) => {
    navigate(itemHref(item.type, item.id));
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatItems[focusedIdx]) {
      go(flatItems[focusedIdx]);
    }
  };

  const totalCount = flatItems.length;
  const hasResults = results && totalCount > 0;
  const noResults = results && totalCount === 0;
  let flatIdx = 0;

  const renderGroup = (items, type) => {
    if (!items || items.length === 0) return null;
    return (
      <div key={type}>
        <p className="px-4 pt-3 pb-1 text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {TYPE_LABEL[type]}s
        </p>
        {items.map(item => {
          const idx = flatIdx++;
          const isFocused = focusedIdx === idx;
          return (
            <button
              key={item.id}
              onMouseEnter={() => setFocusedIdx(idx)}
              onClick={() => go({ type, ...item })}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isFocused ? 'bg-orange-50' : 'hover:bg-stone-50'
              }`}
            >
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_COLOR[type]}`}>
                {TYPE_LABEL[type][0]}
              </span>
              <span className="text-sm text-stone-800 truncate flex-1">{item.title || item.name}</span>
              {item.severity && (
                <span className="text-xs text-stone-400 flex-shrink-0">{item.severity}</span>
              )}
              {item.status && !item.severity && (
                <span className="text-xs text-stone-400 flex-shrink-0 capitalize">{item.status}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search test cases, bugs, suites…"
            aria-label="Search"
            className="flex-1 text-sm text-stone-900 placeholder-stone-400 outline-none bg-transparent"
          />
          {loading && <span className="text-xs text-stone-400">Searching…</span>}
          {!loading && <kbd className="text-xs text-stone-400 border border-stone-200 rounded px-1.5 py-0.5">Esc</kbd>}
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-96 overflow-y-auto py-1">
            {renderGroup(results.test_cases, 'test_case')}
            {renderGroup(results.bugs, 'bug')}
            {renderGroup(results.suites, 'suite')}
          </div>
        )}

        {noResults && (
          <div className="px-4 py-8 text-center text-sm text-stone-400">
            No results for <span className="font-medium text-stone-600">"{query}"</span>
          </div>
        )}

        {!results && !loading && (
          <div className="px-4 py-5 text-center text-xs text-stone-400">
            Type at least 2 characters to search
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-100 px-4 py-2 flex gap-4 text-xs text-stone-400">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
