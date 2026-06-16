#!/bin/bash
# Warns when wrong severity words appear as string values in JS/TS/JSX/TSX files.
# Valid severities per CLAUDE.md: Critical, Major, Minor, Trivial

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Only check JS/TS/JSX/TSX files
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx) ;;
  *) exit 0 ;;
esac

[[ -f "$FILE_PATH" ]] || exit 0

python3 - "$FILE_PATH" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path) as f:
    lines = f.readlines()

wrong = ['high', 'medium', 'low', 'blocker', 'cosmetic']
# Match these words only when they appear as quoted string values
value_pattern = re.compile(
    r'["\'](' + '|'.join(wrong) + r')["\']',
    re.IGNORECASE
)

violations = []
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    # Skip comment lines
    if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('#'):
        continue
    # Skip lines clearly about priority — those legitimately use high/medium/low
    if re.search(r'\bpriority\b', line, re.IGNORECASE):
        continue
    for m in value_pattern.finditer(line):
        violations.append((i, m.group(1), stripped[:80]))

if violations:
    print(f'\n⚠️  Severity enum check: {path}')
    for line_num, word, ctx in violations:
        print(f'   Line {line_num}: "{word}" is not a valid severity — {ctx}')
    print('   Valid severities per CLAUDE.md: Critical / Major / Minor / Trivial\n')
PYEOF
