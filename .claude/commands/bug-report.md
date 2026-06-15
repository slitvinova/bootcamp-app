You are helping the user file a bug report. Ask the following questions one at a time and wait for the user's answer before moving on:

1. **Where did this happen?** (Which page or screen?)
2. **What did you do?** (The steps you took — list them if there are multiple.)
3. **What did you expect to happen?**
4. **What actually happened?**
5. **What is the severity?** Choose one of: `Critical` / `Major` / `Minor` / `Trivial`.

Once you have all five answers, do the following:

- Derive a short kebab-case slug from the location and the unexpected behaviour (e.g., "rewards page — link button missing" → `rewards-link-button-missing`).
- Get today's date in YYYY-MM-DD format using the `date` shell command via Bash.
- Name the file `tests/bugs/YYYY-MM-DD-<slug>.md`.
- Use that same date and the current time (HH:MM) as the timestamp in the file.

Write the file in this exact format:

```
# Bug: <short title describing what is broken>

## Repro Steps
1. Go to <location>
2. <step 2>
3. <step 3>
...

## Expected
<what the user expected to happen>

## Actual
<what actually happened>

## Severity
<severity>

## Reported
<YYYY-MM-DD HH:MM>
```

After creating the file, tell the user the file path where the bug report was saved.
