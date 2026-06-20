# Running a QA Review on a New Feature

## Prompt I typed

> /qa-review the new test run executor

## What Claude did

1. Invoked the `qa-review` skill, which loaded `.claude/skills/qa-review/SKILL.md` and `CLAUDE.md` to establish severity definitions and output format.
2. Located the relevant files: `client/src/pages/TestRunExecutor.jsx`, `server/routes/test-runs.js`, and the shared `TestCaseStatusBadge` component.
3. Reviewed the feature across all five lenses defined in the skill: missing validation, missing error handling, unclear user messages, missing confirmation dialogs, and accessibility.
4. Identified a Major issue (no confirmation before abandoning an in-progress run), two Minor issues (generic network error message with no retry, status badge color as the only differentiator with no aria-label), and one Trivial issue (loading spinner has no visible text for screen readers).
5. Returned findings grouped by severity in the exact format from the skill, ending with a summary line.

## Result

```
## Major
1. **Abandon run** — Navigating away from an in-progress run discards all unsaved
   result markings with no confirmation prompt. There is no way to recover.

## Minor
1. **Network error** — If the PATCH /api/test-runs/:id/results call fails, the UI
   shows "Something went wrong" with no indication of which result failed or
   whether it can be retried.
2. **Status badges** — Pass/fail/skip status is conveyed only by color (green/red/
   grey). Users relying on a screen reader or with color blindness cannot distinguish
   statuses without a text or aria label.

## Trivial
1. **Loading spinner** — The spinner shown while results load has no visible text and
   no aria-label, so screen readers announce nothing during the wait.

---
**Summary:** 4 issue(s) found — 0 critical, 1 major, 2 minor, 1 trivial.
```

The findings were used to prioritize the next sprint: the abandon-run confirmation was added in the same session; the accessibility issues were logged as backlog items.
