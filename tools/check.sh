#!/bin/sh
# Syntax gate: parse every JavaScript file (and the inline scripts in index.html)
# with JavaScriptCore, the engine Safari uses. Exits non-zero on any failure.
# Usage: sh tools/check.sh   (from the repo root)
set -u
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fail=0; count=0

check() {
  count=$((count + 1))
  printf 'checkSyntax(%s);\n' "\"$1\"" > "$TMP/run.js"
  if "$JSC" "$TMP/run.js" > "$TMP/out.txt" 2>&1; then
    echo "PASS parse  $2"
  else
    echo "FAIL parse  $2"; sed -n '1,3p' "$TMP/out.txt"; fail=1
  fi
}

for f in "$ROOT"/js/*.js "$ROOT"/sw.js "$ROOT"/tests/*.js; do
  [ -f "$f" ] && check "$f" "${f#$ROOT/}"
done

# Inline <script> blocks in index.html
python3 - "$ROOT/index.html" "$TMP" <<'PY'
import re, sys, pathlib
html = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
blocks = re.findall(r"<script>(.*?)</script>", html, re.S)
for i, b in enumerate(blocks):
    pathlib.Path(sys.argv[2], "inline%d.js" % i).write_text(b, encoding="utf-8")
print(len(blocks))
PY
for f in "$TMP"/inline*.js; do check "$f" "index.html $(basename "$f")"; done

# JSON files
for f in "$ROOT"/manifest.webmanifest; do
  count=$((count + 1))
  if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f"; then echo "PASS json   ${f#$ROOT/}"; else echo "FAIL json   ${f#$ROOT/}"; fail=1; fi
done

# Smart quotes outside string literals would already fail parsing; also flag template literals,
# which this codebase avoids on purpose.
if grep -n '`' "$ROOT"/js/*.js "$ROOT"/sw.js > "$TMP/tpl.txt"; then
  echo "FAIL style  template literals found:"; cat "$TMP/tpl.txt"; fail=1
else
  echo "PASS style  no template literals"
fi

echo "----"
if [ "$fail" -eq 0 ]; then echo "ALL CHECKS PASSED ($count files)"; else echo "CHECKS FAILED"; fi
exit "$fail"
