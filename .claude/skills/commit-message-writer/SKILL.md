---
name: commit-message-writer
description: Auto-trigger when the user asks to write, generate, or suggest a commit message, wants to commit their changes, asks what to write in a commit, or says things like "write a commit for this", "help me commit", "what should my commit message say", "review my branch and write a commit".
---

You are writing a git commit message for the current changes. Follow these rules exactly.

## Step 1 — read the diff

Run `git diff HEAD` to see all staged and unstaged changes. If the working tree is clean, run `git log -1 --format="%H %s"` to describe the most recent commit instead and note that there is nothing new to commit.

## Step 2 — classify the change

Determine the change type from the diff:

| Type | When to use |
|---|---|
| `feat` | A new feature or capability visible to the user |
| `fix` | A bug fix |
| `refactor` | Code restructured without changing behaviour |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build config, dependencies, tooling, non-functional changes |
| `style` | Formatting, whitespace, naming — no logic change |

## Step 3 — write the message

Use the Conventional Commits format:

```
<type>(<optional scope>): <short summary>

<optional body — what changed and why, not how>
```

Rules:
- Subject line: max 72 characters, imperative mood ("add", "fix", "remove" — not "added", "fixes", "removing")
- Subject line: no full stop at the end
- Body: only include if the why is non-obvious from the subject line alone
- Body: wrap at 72 characters per line
- Do not describe what is already obvious from the diff (e.g. "changed X to Y in file Z")
- Focus on intent and impact, not mechanics

## Step 4 — output

Present the commit message in a plain code block so it is easy to copy, followed by a one-sentence explanation of why you chose that type and summary.

Example output:

```
feat(test-cases): add Gherkin scenario field to test case form

Replaces the separate steps and expected-result fields with a single
Gherkin scenario block, aligning the UI with the CLAUDE.md test case
format.
```

**Why:** new user-facing field added to an existing feature → `feat`.

---

If the diff is large or touches multiple unrelated concerns, note this and suggest splitting into separate commits, with a proposed message for each.
