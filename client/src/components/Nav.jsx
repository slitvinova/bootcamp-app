import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/test-cases',  label: 'Test Cases' },
  { to: '/test-suites', label: 'Test Suites' },
  { to: '/test-runs',    label: 'Test Runs' },
  { to: '/flaky-tests', label: 'Flaky Tests' },
  { to: '/bugs',         label: 'Bugs' },
  { to: '/reports',     label: 'Reports' },
  { to: '/settings',    label: 'Settings' },
];

function desktopClass({ isActive }) {
  return (
    'text-sm font-medium whitespace-nowrap pb-[3px] border-b-2 transition-colors ' +
    (isActive
      ? 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400'
      : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white')
  );
}

function mobileClass({ isActive }) {
  return (
    'block py-2.5 pl-3 text-sm font-medium border-l-2 transition-colors ' +
    (isActive
      ? 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400'
      : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white')
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-stone-900 border-b-2 border-stone-900 dark:border-stone-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="flex items-end h-14">

          {/* Brand */}
          <div className="flex items-center gap-2.5 pb-[3px] mr-8 shrink-0 select-none">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="flex-shrink-0">
              <rect width="22" height="22" rx="2" className="fill-stone-900 dark:fill-white"/>
              <path d="M7 7L17 11L7 15Z" className="fill-white dark:fill-stone-900"/>
            </svg>
            <span className="text-sm tracking-tight text-stone-900 dark:text-white">
              <span className="font-semibold">Run</span><span className="font-light">Log</span>
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-end gap-6 h-full">
            {LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={desktopClass} end={to === '/dashboard'}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="ml-auto mb-2 md:hidden p-2 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-stone-800 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────── */}
      {open && (
        <div className="md:hidden border-t border-stone-100 dark:border-stone-800 px-4 py-2">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={mobileClass}
              onClick={() => setOpen(false)}
              end={to === '/dashboard'}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
