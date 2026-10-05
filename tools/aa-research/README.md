# Recherche-Werkzeuge (Anime Adventures)

Hilfsskripte, mit denen die Rohdaten für `docs/anime-adventures/` gewonnen wurden. Sie enthalten **keine** Spieldaten. Die Daten werden bei Bedarf neu abgerufen.

## Abrufweg

In der Cloud-Sitzung blockiert die Netzwerkrichtlinie direkte Abrufe (curl, WebFetch). Erreichbar ist nur der MCP-Connector `fetch`.

1. Abruf über `fetch` mit `raw=true` und `max_chars=100000`. Antworten mit mehr als etwa 50.000 Zeichen legt der Client automatisch als Datei unter `~/.claude/projects/<projekt>/tool-results/mcp-Multitool-fetch-*.txt` ab. So landen sie nicht im Kontext.
2. Längere Antworten in Stücken holen (`start` = 0, 100000, …). Für das letzte Stück `start = Gesamtlänge − 100000` wählen: Die Überlappung ist erlaubt und erzwingt die Dateiablage.
3. `collect.py` setzt alle abgelegten Stücke pro URL wieder zusammen (`AA_TOOL_RESULTS`, `AA_OUT`).
4. `lua2json.py <in.lua> <out.json>` wandelt Scribunto-Datenmodule in JSON um (benötigt `pip install lupa`).

## Ergiebige Endpunkte

| Zweck | URL |
|---|---|
| Modulquelltext (Unit-DB) | `https://animeadventures.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Module:UnitData/Data&format=json&formatversion=2` |
| Alte Fassung | `…&revids=<REVID>…` (Legacy-Endstand: `33214`, 2023-12-14) |
| Alle Artikel mit Wikitext | `…action=query&generator=allpages&gapnamespace=0&gaplimit=50&gapfilterredir=nonredirects&prop=revisions&rvprop=content\|timestamp&rvslots=main&format=json&formatversion=2&gapcontinue=<…>` (bei `rvcontinue` mit gleichem `gapcontinue` nachladen) |
| Trello-Karten | `https://api.trello.com/1/boards/3TFL3xY9/cards?fields=name,desc,idList,dateLastActivity&attachments=false` |
| Roblox-Spiel | `https://games.roblox.com/v1/games?universeIds=3183403065` |
| Gamepässe | `https://apis.roblox.com/game-passes/v1/universes/3183403065/game-passes?passView=Full&pageSize=100` |

`index.php?action=raw` ist hinter einer Cloudflare-Abfrage gesperrt (403). `api.php` funktioniert.
