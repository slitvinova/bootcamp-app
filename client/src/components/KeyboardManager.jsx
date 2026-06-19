import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickSearch from './QuickSearch';
import ShortcutHelp from './ShortcutHelp';

function isEditable(el) {
  if (!el) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
}

export default function KeyboardManager() {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const showSearchRef = useRef(false);
  const showHelpRef = useRef(false);
  const pendingG = useRef(false);
  const gTimer = useRef(null);

  // Keep refs in sync so the stable handler closure can read current values
  showSearchRef.current = showSearch;
  showHelpRef.current = showHelp;

  useEffect(() => {
    const handler = (e) => {
      // Let open modals handle their own keys
      if (showSearchRef.current || showHelpRef.current) return;

      // Never fire in text inputs
      if (isEditable(document.activeElement)) return;

      // ⌘K / Ctrl+K — quick search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      // Ignore other modifier-key combos
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // ? — help
      if (e.key === '?') {
        setShowHelp(true);
        return;
      }

      // G chord: G then D/T/B/R
      if (e.key === 'g' || e.key === 'G') {
        pendingG.current = true;
        clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => { pendingG.current = false; }, 1500);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(gTimer.current);
        const k = e.key.toLowerCase();
        if (k === 'd') navigate('/dashboard');
        else if (k === 't') navigate('/test-cases');
        else if (k === 'b') navigate('/bugs');
        else if (k === 'r') navigate('/test-runs');
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(gTimer.current);
    };
  }, [navigate]); // navigate is stable; refs handle modal state without re-registering

  return (
    <>
      {showSearch && <QuickSearch onClose={() => setShowSearch(false)} />}
      {showHelp && <ShortcutHelp onClose={() => setShowHelp(false)} />}
    </>
  );
}
