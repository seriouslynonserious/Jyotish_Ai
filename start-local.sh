#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
ollama_bin="${OLLAMA_BIN:-../work/ollama/ollama}"
# Run this option in your own Terminal after changing backend code.
if [ "${1:-}" = "--restart" ]; then
  for port in 8081 4204; do
    for pid in $(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true); do
      process_dir=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
      if [ "$process_dir" = "$PWD" ] || [ "$process_dir" = "$PWD/frontend" ]; then
        kill "$pid"
      else
        echo "Port $port belongs to another workspace; leaving it alone."; exit 1
      fi
    done
  done
  sleep 2
fi
children=()
cleanup() { for pid in "${children[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

if ! curl -fsS http://127.0.0.1:11435/api/version >/dev/null; then
  if [ ! -x "$ollama_bin" ]; then
    echo 'Set OLLAMA_BIN to your Ollama executable.'; exit 1
  fi
  OLLAMA_HOST=127.0.0.1:11435 OLLAMA_NO_CLOUD=1 LLAMA_ARG_DEVICE=none "$ollama_bin" serve &
  children+=("$!")
fi
if ! curl -fsS http://127.0.0.1:8081/api/health >/dev/null; then
  if [ ! -f backend/target/jyotish-backend-0.1.0.jar ]; then
    echo 'Build the backend first: cd backend && mvn package'; exit 1
  fi
  SERVER_ADDRESS=127.0.0.1 PORT=8081 OLLAMA_URL=http://127.0.0.1:11435 java -jar backend/target/jyotish-backend-0.1.0.jar &
  children+=("$!")
fi
if ! curl -fsS http://127.0.0.1:4204/api/health >/dev/null; then
  (cd frontend && exec npm start -- --host 127.0.0.1 --port 4204 --proxy-config proxy.local.conf.json) &
  children+=("$!")
fi
echo 'Open http://127.0.0.1:4204 — keep this terminal open. Ctrl+C stops services started here.'
wait
