#!/bin/bash
# ════════════════════════════════════════════════════════
#  Fitness Tracker v4 — Local Server Launcher (WSL/Linux)
#  الاستخدام: bash D:/fitness/افتح_الصفحة.sh
#  ثم افتح: http://localhost:8766/
# ════════════════════════════════════════════════════════

cd /mnt/d/fitness

# Try ports 8766, 8767, 8768, 8769, 8770
PORT=8766
while [ $PORT -le 8770 ]; do
  if ! ss -tln 2>/dev/null | grep -q ":$PORT "; then
    break
  fi
  echo "Port $PORT is busy, trying next..."
  PORT=$((PORT+1))
done

if [ $PORT -gt 8770 ]; then
  echo "ERROR: No free port in 8766-8770"
  exit 1
fi

echo "════════════════════════════════════════════"
echo "  Fitness Tracker v4 — Server starting"
echo "════════════════════════════════════════════"
echo ""
echo "  >>> Open: http://localhost:$PORT/"
echo "  >>> To stop: Ctrl+C"
echo ""

# Try to open in default browser
if command -v wslview &> /dev/null; then
  wslview "http://localhost:$PORT/" &
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:$PORT/" &
fi

python3 -m http.server $PORT
