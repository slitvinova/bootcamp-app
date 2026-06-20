# RunLog

A test case management and bug tracking app for QA engineers.

**Stack:** Express (Node.js) API + React + Vite, run concurrently in dev. Data stored in a flat JSON file that auto-seeds on first run.

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
