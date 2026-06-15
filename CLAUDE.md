# CLAUDE.md

## Stack
Express (Node.js) API + React + Vite frontend, run concurrently via `npm run dev`. Server on port 3001, client on port 5173.

## Severity Levels
- **Critical** — blocks core functionality; the app cannot be used.
- **Major** — significant feature is broken or missing; workaround is difficult or absent.
- **Minor** — feature works but behaves incorrectly in edge cases; workaround exists.
- **Trivial** — cosmetic or negligible issue with no functional impact.

## Test Case Fields
| Field | Notes |
|---|---|
| Title | Short, imperative description of what is being tested |
| Scenario | Full Gherkin scenario — Given / When / Then / And |
| Severity | Critical / Major / Minor / Trivial |
| Status | `draft` / `ready` / `passed` / `failed` / `skipped` |

## Bug Report Fields
| Field | Notes |
|---|---|
| Title | Short description of what is broken |
| Steps to Reproduce | Numbered, minimal steps to trigger the bug |
| Expected | What should happen |
| Actual | What actually happens |
| Severity | Critical / Major / Minor / Trivial |
| Status | `open` / `in-progress` / `resolved` / `closed` / `reopened` |

## API Response Shape
Every endpoint returns the same envelope:
```json
{ "success": true, "data": <any>, "error": null }
{ "success": false, "data": null, "error": "<message>" }
```

## File Naming
- **Files & directories** — `kebab-case` (e.g. `user-profile.js`, `partner-linking.md`)
- **React components** — `PascalCase` (e.g. `UserProfile.jsx`)
- **API handlers** — `handleVerbNoun` (e.g. `handleGetUser`, `handleCreateOrder`)

## Test Case Format
Write all test cases as a single Gherkin scenario. There is no separate "Expected Result" field — the Then line is the expected outcome.

```
Given <precondition>
When <action>
Then <expected outcome>
And <additional outcome> (if needed)
```

Use one scenario per test case. Keep each line to a single action or assertion. Every test case must have at least one Then line.

## Voice
Write test cases and bug reports in clear, direct English. One idea per sentence. No buzzwords, no filler, no passive voice where active works. If a step can be cut, cut it.
