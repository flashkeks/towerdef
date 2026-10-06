#!/bin/sh
# Runde 4 / P1: Parametersweep nur 1P (Rohdaten je Stufe parallel). Aufruf: P1_PATCH=... sh scripts/sanity/p1-sweep.sh n tag [bots]
N=${1:-30}; TAG=${2:-sw}; BOTS=${3:-greedy,wide,aoe,upgrade,farm}; D=${TMPDIR:-/tmp}/p1-$TAG; mkdir -p "$D"
for d in normal hard nightmare; do npx tsx scripts/sanity/q7-p1.ts --part raw --n "$N" --difficulty $d --players 1 --bots $BOTS --out "$D/$d.json" & done
wait
npx tsx scripts/sanity/q7-p1.ts --part sum --files "$D/normal.json,$D/hard.json,$D/nightmare.json" | grep -v "^| farm\|4P\|^| banner"
