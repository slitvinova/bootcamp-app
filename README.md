# RunLog

A test case management and bug tracking app for QA engineers — and a Claude Code plugin that brings QA automation straight into your AI-assisted workflow.

**Stack:** Express (Node.js) API + React + Vite, run concurrently in dev. Data stored in a flat JSON file that auto-seeds on first run.

---

## What this plugin does

Gives Claude Code a full QA toolkit built for the RunLog app:

- **Slash commands** — `/bug-report` walks you through a structured bug report and saves it to `tests/bugs/`. `/new-test` creates a Gherkin test case in `tests/manual/`. `/retro` logs and lists retrospective records.
- **Skills** — `qa-review` inspects code across five lenses (validation, error handling, user messages, destructive actions, accessibility) and returns severity-grouped findings. `test-generator` produces a complete ISTQB test suite from a feature description. `commit-message-writer` drafts a Conventional Commits message from the current diff.
- **Subagents** — `flake-analyzer` generates a one-sentence root-cause hypothesis for an intermittently failing test. `qa-reviewer` runs the full QA review skill in an isolated agent. `test-writer` generates test case suites. `release-notes-writer` turns commit history into a human-readable changelog.
- **Hooks** — `check-response-shape` warns if a `res.json()` call in `server/routes/` is missing the `{success, data, error}` envelope. `check-severity-enum` catches invalid severity strings (`high`, `medium`, `low`) in JS files. `flake-detector` fires after test-run result writes, generates AI hypotheses for new flaky tests, and posts a Discord alert. `print-todays-summary` prints a git summary at the end of every Claude session.

## Install

1. **Clone the repo**
   ```bash
   git clone https://github.com/slitvinova/bootcamp-app.git
   cd bootcamp-app
   ```

2. **Install app dependencies**
   ```bash
   npm run install:all
   ```

3. **Install the plugin into Claude Code**
   ```bash
   claude plugin install .
   ```
   Claude Code reads `.claude-plugin/plugin.json` and registers all commands, skills, agents, and hooks automatically.

4. **Set environment variables** (required for Discord alerts)
   ```bash
   cp .env.example .env
   # Edit .env and add:
   # DISCORD_SERVER_ID=your_server_id
   # DISCORD_CHANNEL_ID=your_channel_id
   ```
   The app runs without Discord configured — alerts are silently skipped if these variables are absent.

5. **Start the dev server**
   ```bash
   npm run dev
   ```
   API on `:3001`, React on `:5173`.

## Examples

See the [`examples/`](examples/) folder for full worked walkthroughs:

- [`examples/flaky-test-leaderboard.md`](examples/flaky-test-leaderboard.md) — how the flaky test leaderboard, AI hypotheses, and Discord hook were built in a single session using plan mode, a subagent, and a PostToolUse hook.
- [`examples/qa-review-workflow.md`](examples/qa-review-workflow.md) — how `/qa-review` reviews a feature across five lenses and returns severity-grouped findings.

## What's inside

```
.claude-plugin/
└── plugin.json              # manifest — references every file below

.claude/
├── commands/
│   ├── bug-report.md        # /bug-report  — guided bug report → tests/bugs/
│   ├── new-test.md          # /new-test    — guided test case  → tests/manual/
│   └── retro.md             # /retro       — retrospective log → retro/records/
├── skills/
│   ├── qa-review/           # five-lens QA review with severity grouping
│   ├── test-generator/      # ISTQB test suite from a feature description
│   └── commit-message-writer/ # Conventional Commits message from git diff
├── agents/
│   ├── flake-analyzer.md    # one-sentence flaky-test hypothesis
│   ├── qa-reviewer.md       # full QA review as an isolated subagent
│   ├── release-notes-writer.md # changelog from commit history
│   └── test-writer.md       # test case suite generation
└── hooks/
    ├── check-response-shape.sh  # PostToolUse: enforce {success,data,error} envelope
    ├── check-severity-enum.sh   # PostToolUse: block invalid severity strings
    ├── flake-detector.sh        # PostToolUse: detect flakes, post Discord alert
    ├── print-todays-summary.sh  # Stop: print git summary at session end
    └── settings.json            # hook wiring (PostToolUse + Stop)

examples/
├── flaky-test-leaderboard.md
└── qa-review-workflow.md

LICENSE                          # MIT
```

---

## Local development

```bash
npm run install:all   # install all dependencies (root, server, client)
npm run dev           # starts API on :3001 and React on :5173
```

Copy `.env.example` to `.env` before running if you need to override `PORT`.

## DEPLOY

Hosted on [Vercel](https://vercel.com) (Hobby/free tier — no credit card required).

### How it works in production

- React build (`client/dist/`) is served as static files from Vercel's CDN.
- All `/api/*` requests route to a single Express serverless function (`api/index.js`).
- Data is stored in `/tmp/data.json` per warm instance and auto-seeded from built-in seed constants on cold start. State persists for the lifetime of a warm function instance (typically minutes to hours of activity).

### First deploy

Push your branch to GitHub, then run in your terminal:

```bash
npx vercel
```

The CLI will open a browser tab for authentication. After login, answer the prompts:

| Prompt | Answer |
|---|---|
| Set up and deploy? | `Y` |
| Which scope? | your personal account |
| Link to existing project? | `N` |
| Project name? | `runlog` (or press Enter) |
| In which directory is your code located? | `./` (press Enter) |

Vercel detects the `vercel.json` config automatically — no framework preset needed. The build takes ~60 seconds. You'll receive a `.vercel.app` URL when done.

### Subsequent deploys

```bash
git push origin main
```

Vercel auto-deploys on every push to `main` once the project is linked.

### Environment variables

No secrets are required for the app to run. If you add any in the future, set them via the Vercel dashboard under **Project → Settings → Environment Variables**. Never commit `.env`.
