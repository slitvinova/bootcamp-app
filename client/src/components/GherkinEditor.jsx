import { useRef } from 'react';

const KEYWORD_COLORS = {
  given: '#a78bfa',
  when: '#60a5fa',
  then: '#4ade80',
  and: '#22d3ee',
  but: '#f87171',
};

function highlight(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /^(given|when|then|and|but)(?=\s|$)/gim,
      (kw) => `<span style="color:${KEYWORD_COLORS[kw.toLowerCase()]};font-weight:700">${kw}</span>`
    );
}

// Applied to both backdrop and textarea to keep them pixel-perfect in sync.
const SHARED_STYLE = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.875rem',
  lineHeight: '1.5rem',
  padding: '0.5rem 0.75rem',
  margin: 0,
  border: 0,
  width: '100%',
  boxSizing: 'border-box',
};

export default function GherkinEditor({ value, onChange, rows = 6, placeholder }) {
  const backdropRef = useRef(null);

  const syncScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="relative border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-blue-500 bg-slate-800 overflow-hidden">
      {/* Backdrop renders highlighted text behind the transparent textarea */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        style={{
          ...SHARED_STYLE,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          color: '#f1f5f9',
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: highlight(value) + '​' }}
      />
      {/* Textarea is transparent so the backdrop shows through */}
      <textarea
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        rows={rows}
        placeholder={placeholder}
        className="placeholder-slate-400 relative block w-full resize-none outline-none"
        style={{
          ...SHARED_STYLE,
          background: 'transparent',
          color: 'transparent',
          caretColor: '#f1f5f9',
          zIndex: 1,
        }}
      />
    </div>
  );
}
