You are helping the user create a manual test case. Ask the following questions one at a time and wait for the user's answer before moving on:

1. **What feature does this test cover?** (This will become the test title.)
2. **Write the Gherkin scenario.** It must include Given, When, and Then. Add And lines if needed. The Then line is the expected outcome — there is no separate Expected Result field.
3. **What is the severity?** Choose one of: `Critical` / `Major` / `Minor` / `Trivial`.

Once you have all three answers, create a file under `tests/manual/` in the project. Derive a kebab-case filename from the feature name (e.g., "User Login" → `tests/manual/user-login.md`).

Write the file in this exact format:

```
# <Title>

## Scenario
Given <precondition>
When <action>
Then <expected outcome>
And <additional outcome> (if needed)

## Severity
<severity>

## Status
draft
```

After creating the file, tell the user the file path where the test case was saved.
