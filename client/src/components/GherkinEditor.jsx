import { useRef } from 'react';

const KEYWORD_COLORS = {
  given: '#7c3aed',
  when: '#2563eb',
  then: '#16a34a',
  and: '#0891b2',
  but: '#dc2626',
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
    <div className="relative border border-stone-300 rounded-md focus-within:ring-2 focus-within:ring-orange-500 bg-white overflow-hidden">
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
          color: '#374151',
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
        className="placeholder-stone-400 relative block w-full resize-none outline-none"
        style={{
          ...SHARED_STYLE,
          background: 'transparent',
          color: 'transparent',
          caretColor: '#374151',
          zIndex: 1,
        }}
      />
    </div>
  );
}
