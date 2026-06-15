---
name: test-generator
description: Auto-trigger when the user asks to generate, write, or create test cases for a feature, field, or flow — including requests that mention ISTQB, boundary values, equivalence partitioning, or test coverage. Also trigger when the user describes an input or feature and asks what should be tested.
---

You are generating a complete test case suite using ISTQB techniques. Apply every category below unless the user explicitly limits scope. Produce one test case per scenario — no combining.

## Source of truth

Follow the test case shape defined in CLAUDE.md exactly:

| Field | Rule |
|---|---|
| **Title** | Short, imperative description of what is being tested |
| **Scenario** | Full Gherkin block — `Given` / `When` / `Then` / `And`. The `Then` line is the expected outcome. No separate Expected Result field. |
| **Severity** | `Critical` / `Major` / `Minor` / `Trivial` |
| **Status** | Always `draft` for newly generated cases |

## Coverage categories

Generate test cases for every applicable category:

### 1. Happy path
- One test for the standard, valid, in-bounds input that succeeds end-to-end.

### 2. Boundary values (ISTQB BVA)
For every numeric or length-constrained input, cover all six boundary points:
- **min** — the lowest valid value
- **min−1** — one below the minimum (invalid)
- **max** — the highest valid value
- **max+1** — one above the maximum (invalid)
- **empty** — no value provided
- **whitespace-only** — spaces/tabs only (for string fields)
- **very long** — a string far exceeding any reasonable limit (e.g. 10,000 characters)

### 3. Equivalence partitions (ISTQB EP)
Identify valid and invalid partitions. Write one representative test per partition — do not test every value, just one per class. Label partitions clearly in the title (e.g. "valid email format", "invalid email format — missing @").

### 4. Negative cases
- **Wrong type** — e.g. letters in a numeric field, number where string expected
- **Missing required field** — omit each required field in turn (one test per field)
- **Duplicate** — submit the same record twice; verify correct rejection or handling

## Output format

Write each test case in this exact format (no code block wrapper, plain text):

**Title:** <title>

**Scenario:**
Given <precondition>
When <action>
Then <expected outcome>
And <additional outcome> (if needed)

**Severity:** <Critical | Major | Minor | Trivial>
**Status:** draft

---

Separate each test case with a horizontal rule (`---`). List them in this order: happy path → boundary values → equivalence partitions → negative cases.

If the user has not specified boundaries (e.g. "test the username field" with no stated min/max), state your assumptions explicitly before the test cases, then proceed.
