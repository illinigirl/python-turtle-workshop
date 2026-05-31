#!/usr/bin/env bash
# Serve the workshop locally. Open the printed URL in a browser.
cd "$(dirname "$0")"
PORT="${1:-8095}"
echo "🐢 Python Workshop running at:"
echo "   http://localhost:$PORT"
echo "   (Ctrl+C to stop)"
python3 -m http.server "$PORT"
