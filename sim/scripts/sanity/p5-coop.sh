#!/bin/sh
# Runde 4 / P5: Koop-Matrix, je Stufe ein Prozess (parallel). Aufruf: sh scripts/sanity/p5-coop.sh [n] [tag]
# Ausgabe in $TMPDIR/p5-TAG/*.txt und zusammengefasst auf stdout. Experimente: P5_COOP, P1_COOPH, P2_BOSSHP (siehe p5-coop.ts).
N=${1:-30}; TAG=${2:-check}; D=${TMPDIR:-/tmp}/p5-$TAG; mkdir -p "$D"
for d in normal hard nightmare; do
  npx tsx scripts/sanity/p5-coop.ts --difficulty $d --n "$N" ${P5_ARGS} > "$D/$d.txt" &
done
wait
cat "$D"/normal.txt "$D"/hard.txt "$D"/nightmare.txt
