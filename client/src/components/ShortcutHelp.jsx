import { useEffect, useRef } from 'react';
import { SHORTCUTS } from '../shortcuts';
import useFocusTrap from '../hooks/useFocusTrap';

export default function ShortcutHelp({ onClose }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="shortcut-modal-title" className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 id="shortcut-modal-title" className="text-sm font-semibold text-stone-900">Keyboard Shortcuts</h2>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div key={item.display} className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">{item.description}</span>
                    <kbd className="text-xs font-mono bg-stone-100 border border-stone-200 rounded px-2 py-0.5 text-stone-700">
                      {item.display}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
