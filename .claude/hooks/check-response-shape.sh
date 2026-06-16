#!/bin/bash
# Warns when a res.json() call in server/routes/ is missing the {success, data, error} envelope.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Only act on files inside server/routes/
case "$FILE_PATH" in
  */server/routes/*.js) ;;
  *) exit 0 ;;
esac

[[ -f "$FILE_PATH" ]] || exit 0

python3 - "$FILE_PATH" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Match every res[.status(...)].json( ... ) block up to the closing );
pattern = re.compile(
    r'res(?:\.status\s*\([^)]*\))?\s*\.json\s*\((.+?)\)\s*;',
    re.DOTALL
)

violations = []
for m in pattern.finditer(content):
    block = m.group(0)
    line  = content[:m.start()].count('\n') + 1
    missing = [k for k in ('success', 'data', 'error') if k not in block]
    if missing:
        violations.append((line, missing))

if violations:
    print(f'\n⚠️  Response envelope check: {path}')
    for line, missing in violations:
        print(f'   Line {line}: res.json() missing field(s): {", ".join(missing)}')
    print('   Every endpoint must return { success, data, error } — see CLAUDE.md.\n')
PYEOF
