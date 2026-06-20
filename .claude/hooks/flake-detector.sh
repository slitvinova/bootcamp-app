#!/bin/bash
# PostToolUse hook: fires after Bash tool use.
# Detects newly-flaky tests and posts a Discord alert via Claude + MCP.

INPUT=$(cat)

# Only act on Bash tool calls
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null)
[[ "$TOOL" == "Bash" ]] || exit 0

# Only act if the command touched test-run results
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)
echo "$CMD" | grep -qE 'test-runs.*results|results.*test-runs' || exit 0

# Check for pending (unnotified) flakes
PENDING=$(curl -s http://localhost:3001/api/flaky-tests/pending 2>/dev/null)
COUNT=$(echo "$PENDING" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])) if d.get('success') else 0)" 2>/dev/null)
[[ "$COUNT" -gt 0 ]] || exit 0

echo "⚡ Flake detector: $COUNT new flaky test(s) detected — generating hypotheses and posting Discord alert…"

# For each pending flake: generate hypothesis, post Discord alert, mark notified
echo "$PENDING" | python3 - <<'PYEOF'
import sys, json, subprocess, os, urllib.request, urllib.error

data = json.load(sys.stdin).get('data', [])
server  = os.environ.get('DISCORD_SERVER_ID', '')
channel = os.environ.get('DISCORD_CHANNEL_ID', '')

for entry in data:
    tc_id = entry.get('test_case_id')
    title = entry.get('test_case_title', f'Test #{tc_id}')
    rate  = entry.get('flake_rate', 0)
    pct   = f"{round(rate * 100)}%"

    # 1. Generate hypothesis via Claude with flake-analyzer instructions
    prompt = (
        f"You are a senior QA engineer specialising in test reliability. "
        f"Test case '{title}' is intermittently failing (flake rate {pct}). "
        f"Generate one concise sentence hypothesising the most likely root cause. "
        f"Focus on realistic causes: race conditions, shared state, external timeouts, "
        f"test ordering, environment drift, or non-deterministic data. "
        f"Return only the hypothesis sentence."
    )
    result = subprocess.run(
        ['claude', '--print', prompt],
        capture_output=True, text=True, timeout=60
    )
    hypothesis = result.stdout.strip() if result.returncode == 0 else 'Root cause unknown — further investigation needed.'

    # 2. Store hypothesis
    try:
        payload = json.dumps({'hypothesis': hypothesis}).encode()
        req = urllib.request.Request(
            f'http://localhost:3001/api/flaky-tests/{tc_id}/hypothesis',
            data=payload, method='PUT',
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f'  Warning: could not store hypothesis: {e}')

    # 3. Post Discord alert via Claude + Discord MCP
    if server and channel:
        alert_prompt = (
            f"Use the Discord MCP send_message tool to post this message to "
            f"server_id={server}, channel_id={channel}:\n\n"
            f"🔴 **New flaky test detected in RunLog**\n"
            f"**Test:** {title}\n"
            f"**Flake rate:** {pct}\n"
            f"**Hypothesis:** {hypothesis}"
        )
        subprocess.run(
            ['claude', '--print', alert_prompt],
            capture_output=True, text=True, timeout=60
        )
    else:
        print(f'  ℹ️  Discord not configured (DISCORD_SERVER_ID/DISCORD_CHANNEL_ID unset). Skipping alert for: {title}')

    # 4. Mark notified
    try:
        req2 = urllib.request.Request(
            f'http://localhost:3001/api/flaky-tests/{tc_id}/mark-notified',
            data=b'{}', method='POST',
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req2, timeout=5)
        print(f'  ✓ Processed: {title} ({pct} flake rate)')
    except Exception as e:
        print(f'  Warning: could not mark as notified: {e}')

PYEOF
