#!/bin/sh
# Runde 4 / P1: Schnellmessung (Rohdaten je Stufe parallel, dann Auswertung). Aufruf: sh scripts/sanity/p1-quick.sh [n] [tag]
N=${1:-30}; TAG=${2:-quick}; D=${TMPDIR:-/tmp}/p1-$TAG; mkdir -p "$D"
for d in normal hard nightmare; do npx tsx scripts/sanity/q7-p1.ts --part raw --n "$N" --difficulty $d --out "$D/$d.json" & done
wait
npx tsx scripts/sanity/q7-p1.ts --part sum --files "$D/normal.json,$D/hard.json,$D/nightmare.json"
