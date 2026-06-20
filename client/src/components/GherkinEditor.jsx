import { useRef, useState, useEffect } from 'react';

function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const KEYWORD_COLORS_DARK = {
  given: '#a78bfa',
  when:  '#60a5fa',
  then:  '#4ade80',
  and:   '#22d3ee',
  but:   '#f87171',
};

const KEYWORD_COLORS_LIGHT = {
  given: '#7c3aed',
  when:  '#2563eb',
  then:  '#16a34a',
  and:   '#0891b2',
  but:   '#dc2626',
};

function highlight(text, colors) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /^(given|when|then|and|but)(?=\s|$)/gim,
      (kw) => `<span style="color:${colors[kw.toLowerCase()]};font-weight:700">${kw}</span>`
    );
}

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
  const isDark = useIsDark();

  const colors = isDark ? KEYWORD_COLORS_DARK : KEYWORD_COLORS_LIGHT;
  const textColor = isDark ? '#f1f5f9' : '#0f172a';

  const syncScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="relative border border-slate-300 dark:border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-slate-800 overflow-hidden">
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
          color: textColor,
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: highlight(value, colors) + '​' }}
      />
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
          caretColor: textColor,
          zIndex: 1,
        }}
      />
    </div>
  );
}
