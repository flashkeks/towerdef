#!/bin/sh
# Runde 4 / P5: Raster der Koop-HP-Tabelle. Aufruf: sh scripts/sanity/p5-scan.sh STUFE N "H2:H4 H2:H4 ..." [Bots]
# H2/H4 = HP-Faktor in Basispunkten für 2 bzw. 4 Spieler, 3P wird linear dazwischen gelegt. Ausgabe /tmp/p5s-STUFE-H2-H4.txt
D=$1; N=$2; BOTS=${4:-aoe,upgrade,farm,wide}
for c in $3; do
  h2=${c%%:*}; h4=${c##*:}; h3=$(( (h2 + h4) / 2 ))
  P5_COOP="{\"hpTableBp\":[10000,$h2,$h3,$h4]}" npx tsx scripts/sanity/p5-coop.ts --difficulty $D --n $N --players 2,4 --bots $BOTS > /tmp/p5s-$D-$h2-$h4.txt &
done
wait
for c in $3; do h2=${c%%:*}; h4=${c##*:}; echo "== $D h2=$h2 h4=$h4"; tail -n +5 /tmp/p5s-$D-$h2-$h4.txt; done
