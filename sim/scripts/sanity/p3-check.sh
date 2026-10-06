#!/bin/sh
# Runde 4 / P3: alle Abnahmezahlen für die Stufen, je Stufe ein Prozess (parallel). Aufruf: sh scripts/sanity/p3-check.sh [n] [tag]
# Ausgabe in $TMPDIR/p3-TAG/*.txt und zusammengefasst auf stdout. Kennlinie mit dem jeweils besten Bot (Standard: normal aoe, hard/nightmare wide).
N=${1:-40}; TAG=${2:-check}; D=${TMPDIR:-/tmp}/p3-$TAG; mkdir -p "$D"
for d in normal hard nightmare; do
  case $d in normal) B=aoe;; *) B=wide;; esac
  ( npx tsx scripts/sanity/p3-check.ts --part rates --difficulty $d --n "$N" > "$D/$d-rates.txt"
    npx tsx scripts/sanity/p3-check.ts --part curve --difficulty $d --bot ${P3_BOT:-$B} --n "$N" > "$D/$d-curve.txt" ) &
done
wait
cat "$D"/*.txt
