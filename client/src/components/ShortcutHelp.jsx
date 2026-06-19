import { useEffect } from 'react';
import { SHORTCUTS } from '../shortcuts';

export default function ShortcutHelp({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div key={item.display} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.description}</span>
                    <kbd className="text-xs font-mono bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
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
