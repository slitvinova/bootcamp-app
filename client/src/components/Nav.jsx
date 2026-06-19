import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/test-cases',  label: 'Test Cases' },
  { to: '/test-suites', label: 'Test Suites' },
  { to: '/test-runs',   label: 'Test Runs' },
  { to: '/bugs',        label: 'Bugs' },
  { to: '/reports',     label: 'Reports' },
  { to: '/settings',    label: 'Settings' },
];

function desktopClass({ isActive }) {
  return (
    'text-sm font-medium whitespace-nowrap pb-[3px] border-b-2 transition-colors ' +
    (isActive
      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
      : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white')
  );
}

function mobileClass({ isActive }) {
  return (
    'block py-2.5 pl-3 text-sm font-medium border-l-2 transition-colors ' +
    (isActive
      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white')
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="flex items-end h-14">

          {/* Brand */}
          <span className="text-base font-semibold tracking-tight pb-[3px] mr-8 shrink-0 text-gray-900 dark:text-white select-none">
            <span className="text-indigo-600 dark:text-indigo-400">QA</span>Hub
          </span>

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
            className="ml-auto mb-2 md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
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
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 px-4 py-2">
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
