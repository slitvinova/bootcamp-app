// Single source of truth for all keyboard shortcuts.
// KeyboardManager, ShortcutHelp, and the Settings page all read from here.
export const SHORTCUTS = [
  {
    group: 'Navigation',
    items: [
      { display: 'G D', description: 'Go to Dashboard' },
      { display: 'G T', description: 'Go to Test Cases' },
      { display: 'G B', description: 'Go to Bugs' },
      { display: 'G R', description: 'Go to Test Runs' },
    ],
  },
  {
    group: 'Search',
    items: [
      { display: '⌘K / Ctrl+K', description: 'Open quick search' },
    ],
  },
  {
    group: 'Help',
    items: [
      { display: '?', description: 'Show keyboard shortcuts' },
    ],
  },
];
