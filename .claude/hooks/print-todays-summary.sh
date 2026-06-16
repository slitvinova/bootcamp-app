#!/bin/bash
# Prints a summary of today's work when Claude finishes a turn.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR" || exit 0

DATE=$(date '+%A, %-d %B %Y')
SINCE="midnight"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 Today's Summary — $DATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Commits made today ────────────────────────────────
COMMITS=$(git log --since="$SINCE" --oneline --no-walk=unsorted 2>/dev/null)
COMMIT_COUNT=$(git log --since="$SINCE" --oneline 2>/dev/null | wc -l | tr -d ' ')

if [[ "$COMMIT_COUNT" -gt 0 ]]; then
  echo ""
  echo "  ✅ Commits today ($COMMIT_COUNT)"
  git log --since="$SINCE" --pretty=format:"     %h  %s" 2>/dev/null
  echo ""
else
  echo ""
  echo "  ○  No commits yet today"
fi

# ── Uncommitted changes ───────────────────────────────
MODIFIED=$(git diff --name-only 2>/dev/null)
STAGED=$(git diff --cached --name-only 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null)

PENDING=""
[[ -n "$STAGED" ]]    && PENDING="${PENDING}$(echo "$STAGED"    | sed 's/^/     [staged]   /')\n"
[[ -n "$MODIFIED" ]]  && PENDING="${PENDING}$(echo "$MODIFIED"  | sed 's/^/     [modified] /')\n"
[[ -n "$UNTRACKED" ]] && PENDING="${PENDING}$(echo "$UNTRACKED" | sed 's/^/     [new]      /')\n"

if [[ -n "$PENDING" ]]; then
  echo "  📝 Uncommitted changes"
  echo -e "$PENDING"
else
  echo "  ✓  Working tree clean"
  echo ""
fi

# ── Files touched in today's commits ─────────────────
FILES_TODAY=$(git diff --name-only "$(git log --since="$SINCE" --format="%H" | tail -1)^" HEAD 2>/dev/null | sort -u)
if [[ -n "$FILES_TODAY" ]]; then
  FILE_COUNT=$(echo "$FILES_TODAY" | wc -l | tr -d ' ')
  echo "  🗂  Files changed in today's commits ($FILE_COUNT)"
  echo "$FILES_TODAY" | sed 's/^/     /'
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
