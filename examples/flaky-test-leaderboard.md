# Building a Flaky Test Leaderboard with Discord Alerts

## Prompt I typed

> create a new feature, which does two things, on one new page in the app: Tracks pass/fail history for every test case across every run, so you can see which tests are unreliable over time. Surfaces the top-10 flakiest tests in a leaderboard, each row with an AI-written root-cause hypothesis. When a new flake appears (a test that was passing recently flips to intermittent), the feature also posts an alert to a Discord channel so QA's notified the moment something starts going wrong.

## What Claude did

1. Entered plan mode and drafted the full architecture before writing any code: new `GET /api/flaky-tests` route computing pass/fail ratios across all run results, a `flakeCache` store for hypotheses and notification state, a React leaderboard page with severity badges and pattern dots, the `flake-analyzer` subagent definition, and a `PostToolUse` hook wired to `Bash` tool calls.
2. Created `server/routes/flaky-tests.js` with four endpoints: `GET /` (leaderboard), `GET /pending` (unnotified flakes), `PUT /:id/hypothesis` (store AI hypothesis), `POST /:id/mark-notified`.
3. Added `flakeCache` to `server/db.js` alongside the existing test-run and settings stores.
4. Wrote `client/src/pages/FlakyTests.jsx` — a table showing rank, test name, severity badge, flake rate with a progress bar, last-10-runs dot pattern, and hypothesis column.
5. Created `.claude/agents/flake-analyzer.md` — a focused subagent that returns a single hypothesis sentence given a test name and recent pattern.
6. Wrote `.claude/hooks/flake-detector.sh` — a PostToolUse hook that fires after any `Bash` call touching test-run results, polls `/api/flaky-tests/pending`, calls `claude --print` with the flake-analyzer prompt to generate hypotheses, stores them via the API, and posts a Discord alert via the Discord MCP.
7. Wired the hook into `.claude/settings.json` under `PostToolUse → Bash`.
8. Registered the new route in `server/index.js` and added the `/flaky-tests` nav link.

## Result

- **New page:** `client/src/pages/FlakyTests.jsx`
- **New API:** `server/routes/flaky-tests.js` (4 endpoints)
- **New agent:** `.claude/agents/flake-analyzer.md`
- **New hook:** `.claude/hooks/flake-detector.sh`
- **Updated:** `server/db.js`, `server/index.js`, `.claude/settings.json`, `client/src/App.jsx`, `client/src/components/Nav.jsx`
- Commit: `feat(flaky-tests): add flaky test leaderboard, analyzer agent, and Discord hook`
