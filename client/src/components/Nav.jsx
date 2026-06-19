import { NavLink } from 'react-router-dom';

export default function Nav() {
  const link = ({ isActive }) =>
    `text-sm font-medium px-1 pb-1 border-b-2 transition-colors ${
      isActive
        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
        : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6">
      <div className="max-w-7xl mx-auto flex gap-6 h-12 items-end pb-0">
        <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
        <NavLink to="/test-cases" className={link}>Test Cases</NavLink>
        <NavLink to="/test-suites" className={link}>Test Suites</NavLink>
        <NavLink to="/test-runs" className={link}>Test Runs</NavLink>
        <NavLink to="/bugs" className={link}>Bugs</NavLink>
        <NavLink to="/reports" className={link}>Reports</NavLink>
        <NavLink to="/settings" className={link}>Settings</NavLink>
      </div>
    </nav>
  );
}
