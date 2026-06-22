#!/usr/bin/env bash
# API のスモークテスト。docker compose up + db:migrate 済みで、api を起動した状態で実行する。
#   pnpm --filter api dev &  （別ターミナル）
#   bash apps/api/scripts/smoke-test.sh
set -euo pipefail

BASE="${VITE_API_BASE_URL:-http://localhost:3000}"
JAR="$(mktemp)"
EMAIL="smoke-$(date +%s)@example.com"

echo "1) health"
curl -fsS "$BASE/health" | grep -q '"status":"ok"'

echo "2) register"
curl -fsS -c "$JAR" -X POST "$BASE/api/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"password123\",\"name\":\"Smoke\"}" >/dev/null

echo "3) me"
curl -fsS -b "$JAR" "$BASE/api/auth/me" | grep -q "$EMAIL"

echo "4) create task"
curl -fsS -b "$JAR" -X POST "$BASE/api/tasks" \
  -H 'content-type: application/json' \
  -d '{"title":"smoke task","priority":"high"}' >/dev/null

echo "5) list tasks"
curl -fsS -b "$JAR" "$BASE/api/tasks?limit=5" | grep -q '"items"'

rm -f "$JAR"
echo "OK: smoke test passed"
