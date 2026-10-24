#!/bin/sh
# Run headless logic tests with JavaScriptCore. Content packs are not stored in the repo;
# point PACK_DIR at the folder holding them (default: ./chem2, which is untracked).
set -u
JSC="${JSC:-/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACK_DIR="${PACK_DIR:-$ROOT/chem2}"
CONF="$PACK_DIR/04_CHEM233_CONFIRMED_CONTENT_PACK.json"
PREV="$PACK_DIR/05_CHEM233_AHEAD_OF_CLASS_PREVIEW_PACK.json"
status=0
"$JSC" "$ROOT/tests/logic.test.js" -- "$ROOT" "$CONF" "$PREV" main || status=1
"$JSC" "$ROOT/tests/logic.test.js" -- "$ROOT" "$CONF" "$PREV" nostorage || status=1
exit $status
