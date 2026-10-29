#!/bin/zsh
# Gépszintű zár a nehéz folyamatokhoz (8 GB RAM, CLAUDE.md 9. szabály):
# egyszerre legfeljebb SLOTS nehéz parancs fut (alap: 3), akárhány munkamenet dolgozik párhuzamosan.
# Használat:  tools/egyszerre.sh <parancs> [argumentumok…]
#   pl.  tools/egyszerre.sh npx hyperframes@0.8.149 check content/<id>/composition
#        tools/egyszerre.sh python3 tools/whisper/transcribe.py hang.wav ki.json --lang hu
# A parancs automatikusan háttér-prioritáson fut (taskpolicy -b), a többi vár a sorára.
SLOTS="${SLOTS:-3}"
BASE="${TMPDIR:-/tmp}/video-vagas-nehez.lock"
LOCK=""
while [[ -z "$LOCK" ]]; do
  for i in $(seq 1 "$SLOTS"); do
    d="$BASE"; [[ $i -gt 1 ]] && d="$BASE.$i"
    if mkdir "$d" 2>/dev/null; then LOCK="$d"; break; fi
    # elárvult zár (a gazda folyamat már nem él) → felszabadítjuk
    if [[ -f "$d/pid" ]] && ! kill -0 "$(cat "$d/pid" 2>/dev/null)" 2>/dev/null; then
      rm -rf "${d:?}"
    fi
  done
  [[ -z "$LOCK" ]] && sleep 3
done
echo $$ > "$LOCK/pid"
trap 'rm -rf "${LOCK:?}"' EXIT INT TERM
taskpolicy -b "$@"
