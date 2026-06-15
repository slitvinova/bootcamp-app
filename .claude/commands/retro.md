You are helping the user manage retrospective records.

**First, ask:**
> Would you like to (1) enter a new retro record, or (2) list records from the last 31 days?

---

### If the user chooses to enter a new record:

Ask the following questions one at a time:

1. **What type of retro item is this?** Choose one of:
   - `Improve` — something that needs improvement
   - `Stop Doing` — something that should stop
   - `Keep Doing` — something that is working well
   - `Kudos` — appreciation or recognition

2. **Description** — What would you like to note?

3. **Suggestions** — Any suggestions on how to proceed? (Press Enter to skip.)

Once you have the answers:

- Get today's date and time using the `date` shell command.
- Derive a short kebab-case slug from the description (max 5 words).
- Name the file `retro/records/YYYY-MM-DD-<slug>.md`.

Write the file in this exact format:

```
# <Type>: <short title from description>

## Description
<description>

## Suggestions
<suggestions, or "None" if skipped>

## Category
<type>

## Date
<YYYY-MM-DD HH:MM>
```

After saving, tell the user the file path.

---

### If the user chooses to list previous records:

- Use the `date` shell command to get today's date and the date 31 days ago (on macOS: `date -v-31d "+%Y-%m-%d"`).
- List all files in `retro/records/` and filter to those whose filename (YYYY-MM-DD prefix) falls between the cutoff date and today, inclusive.
- For each matching file found, read it and print a summary in this format:

```
📅 YYYY-MM-DD — [Category] Title
   Description: ...
   Suggestions: ...
```

If no records are found in the last 31 days, say so clearly.
