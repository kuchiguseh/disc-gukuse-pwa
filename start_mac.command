#!/bin/bash
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
  python -m http.server 8080
else
  echo "Python が見つかりません。 Homebrew 等で python3 をインストールしてください。"
  exit 1
fi
