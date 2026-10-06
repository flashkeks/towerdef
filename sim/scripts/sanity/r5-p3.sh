#!/bin/sh
# Runde 5 / P3: Leave-one-out (alle 8 Units) und Siegquoten, je Stufe ein Prozess. Aufruf: sh scripts/sanity/r5-p3.sh [loo|rates] [n] [tag] [bot]
# Ausgabe in $TMPDIR/r5p3-TAG/*.txt und zusammengefasst auf stdout. Standard: Profil normal, bester Bot wide.
PART=${1:-loo}; N=${2:-100}; TAG=${3:-check}; BOT=${4:-wide}; D=${TMPDIR:-/tmp}/r5p3-$TAG; mkdir -p "$D"
for d in normal hard nightmare; do
  npx tsx scripts/sanity/r5-p3.ts --part "$PART" --difficulty $d --bot $BOT --bots ${BOTS:-greedy,farm,aoe,upgrade,wide,coop} --n "$N" --units striker,gunner,blaster,banner,lancer,frost,titan,farm > "$D/$d-$PART.txt" &
done
wait
cat "$D"/*-$PART.txt
