"""Erzeugt docs/anime-adventures/units-index.md und die Datenblatt-Abschnitte für units.md aus data/units.json.
Aufruf: python3 gen_units_md.py <units.json> <ausgabeordner>
"""
import json, sys, os, statistics as st
from collections import Counter

ORDER = ["Rare", "Epic", "Legendary", "Mythic", "Secret", "Exclusive"]


def f(x, nd=2):
    if x is None:
        return "–"
    if isinstance(x, float):
        s = f"{x:,.{nd}f}".rstrip("0").rstrip(".")
    else:
        s = f"{x:,}"
    return s.replace(",", " ")


def aoe_str(a):
    if not a:
        return "?"
    s = a.get("aoe") or "?"
    if a.get("radius") is not None:
        s += f" r={f(a['radius'])}"
    if a.get("angle") is not None:
        s += f" {f(a['angle'])}°"
    if a.get("width") is not None:
        s += f" b={f(a['width'])}"
    if a.get("hits"):
        s += f", {a['hits']} Hits"
    if a.get("dot"):
        d = a["dot"]
        s += f", {d['type']} {f(d['multiplierPerTick']*100,3)} %×{d['ticks']}"
    if a.get("special"):
        sp = a["special"]
        s += ", " + sp.get("name", "?")
        if sp.get("influence") is not None:
            s += f" {f(sp['influence']*100)} %"
        if sp.get("duration") is not None:
            s += f" {f(sp['duration'])} s"
    return s


def sheet(u, attacks):
    title = f"### {u['nameRR']}"
    if u["nameLegacy"] and u["nameLegacy"] != u["nameRR"]:
        title += f" (Legacy: {u['nameLegacy']})"
    lines = [title, "",
             f"`{u['id']}` · {u['rarity']} · {u['placement']} · Damage-Typ {u['damageType']}"
             + (f" + {', '.join(u['secondaryDamageTypes'])}" if u['secondaryDamageTypes'] else "")
             + f" · Spawn Cap {u['spawnCap']}{' (global)' if u['spawnCapGlobal'] else ''}"
             + (f" · Crit {f(u['critChance']*100)} %" if u.get('critChance') else "")
             + f" · OBSERVED · HIGH · [{u['meta']['source']}]", "",
             "| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |",
             "|---:|---:|---:|---:|---:|---:|---:|---|---|"]
    for lv in u["levels"]:
        a = attacks.get(lv.get("attack"))
        extra = lv.get("note", "") or ""
        if lv.get("farm") is not None:
            extra = (extra + " " if extra else "") + f"Farm {f(lv['farm'])} ¥/Wave"
        lines.append(f"| {lv['level']} | {f(lv['cost'])} | {f(lv['cumulativeCost'])} | {f(lv['damage'])} | {f(lv['spa'])} | {f(lv['range'])} | {f(lv.get('dps'))} | {aoe_str(a)} | {extra} |")
    ev = u.get("evolution")
    if ev and ev.get("to"):
        items = ", ".join(f"{i} ×{n}" for i, n in ev["items"])
        lines += ["", f"Evolution → `{ev['to']}`: {ev.get('text') or '–'}. Material: {items or '–'}; Takedowns {f(ev.get('takedowns'))}."]
    return "\n".join(lines)


def main(src, outdir):
    d = json.load(open(src))
    A = d["attacks"]
    U = d["units"]
    # Index
    rows = ["# Unit-Index (vollständig)", "",
            "Automatisch erzeugt aus [data/units.json](data/units.json) (S65 RR-Stand 2026-03-18, S66 LEGACY-Endstand 2023-12-14).",
            "Alle Werte OBSERVED · HIGH (Datamine-Format, siehe [sources.md](sources.md)); DPS und Kosten sind DERIVED.",
            "",
            "Legende: **Pl.** = Platzierung (ground/hill/hybrid); **Cap** = Spawn Cap (g = global); **Lv** = Anzahl Upgrades; **Σ¥** = Gesamtkosten bis Max; **DPS** = Damage/SPA auf Max-Stufe (ohne Hits-, DoT- oder AoE-Multiplikator); **AoE (max)** = Angriff der Max-Stufe; **Evo** = Ziel der Evolution.",
            "Namen sind fremde IP und dienen nur der Zuordnung; im eigenen Spiel werden eigene Namen verwendet.", ""]
    for r in ORDER + [None]:
        G = [u for u in U if u["rarity"] == r]
        if not G:
            continue
        rows += [f"## {r or 'Beschwörungen (ohne Rarität)'} ({len(G)})", "",
                 "| ID | Name (RR) | Name (Legacy) | Pl. | Typ | Cap | ¥ (Platz.) | Lv | Σ¥ | DPS (max) | AoE (max) | Evo |",
                 "|---|---|---|---|---|---:|---:|---:|---:|---:|---|---|"]
        for u in sorted(G, key=lambda x: x["nameRR"] or ""):
            last = u["levels"][-1]
            leg = u["nameLegacy"] if u["nameLegacy"] and u["nameLegacy"] != u["nameRR"] else ("=" if u["inLegacy"] else "– (nur RR)")
            cap = f"{u['spawnCap']}{'g' if u['spawnCapGlobal'] else ''}" if u["spawnCap"] is not None else "–"
            typ = (u["damageType"] or "–") + ("+" + "/".join(u["secondaryDamageTypes"]) if u["secondaryDamageTypes"] else "")
            evo = (u.get("evolution") or {}).get("to") or ""
            rows.append(f"| `{u['id']}` | {u['nameRR']} | {leg} | {u['placement']} | {typ} | {cap} | {f(u['levels'][0]['cost'])} | {u['maxLevel']} | {f(u['totalCost'])} | {f(u.get('maxDps'))} | {aoe_str(A.get(last.get('attack')))} | {evo} |")
        rows.append("")
    open(os.path.join(outdir, "units-index.md"), "w").write("\n".join(rows))

    # Statistik
    stat = ["| Rarität | Anzahl (davon Evo-Formen) | Platzierung ¥ min / Median / max | Σ¥ bis Max (Median) | Upgrades (häufigste) | Spawn Cap (häufigste) | DPS max (Median) | ground / hill / hybrid |",
            "|---|---|---|---:|---|---|---:|---|"]
    for r in ORDER:
        G = [u for u in U if u["rarity"] == r]
        c = [u["levels"][0]["cost"] for u in G if isinstance(u["levels"][0]["cost"], (int, float))]
        tc = [u["totalCost"] for u in G if isinstance(u["totalCost"], (int, float))]
        dps = [u["maxDps"] for u in G if u.get("maxDps")]
        mx = Counter(u["maxLevel"] for u in G).most_common(3)
        cap = Counter(u["spawnCap"] for u in G if u["spawnCap"] is not None).most_common(3)
        pl = Counter(u["placement"] for u in G)
        stat.append(f"| {r} | {len(G)} ({sum(1 for u in G if u['evolvedFrom'])}) | {f(min(c))} / {f(st.median(c))} / {f(max(c))} | {f(st.median(tc))} | {', '.join(f'{k}×{n}' for k, n in mx)} | {', '.join(f'{k}×{n}' for k, n in cap)} | {f(st.median(dps))} | {pl['ground']} / {pl['hill']} / {pl['hybrid']} |")
    open(os.path.join(outdir, "_units_stat.md"), "w").write("\n".join(stat))

    byid = {u["id"]: u for u in U}
    picks = ["usopp", "speedwagon", "bulma", "erwin", "wendy", "honey", "honey_evo", "sakamoto", "yamamoto", "hange_evolved", "kasuga", "kasuga_evo", "rokuhira"]
    open(os.path.join(outdir, "_units_sheets.md"), "w").write("\n\n".join(sheet(byid[p], A) for p in picks if p in byid))

    leg = ["| ID | Name (RR) | Stufe | LEGACY (Kosten / Damage / SPA / Range) | RR |", "|---|---|---:|---|---|"]
    for u in U:
        if "legacyLevels" not in u:
            continue
        L = u["legacyLevels"]; R = u["levels"]
        for i in range(max(len(L), len(R))):
            l = L[i] if i < len(L) else None; r_ = R[i] if i < len(R) else None
            k = lambda x: None if x is None else (x.get("cost"), x.get("damage"), x.get("spa"), x.get("range"))
            if k(l) != k(r_):
                fmt = lambda x: "–" if x is None else f"{f(x.get('cost'))} / {f(x.get('damage'))} / {f(x.get('spa'))} / {f(x.get('range'))}"
                leg.append(f"| `{u['id']}` | {u['nameRR']} | {i} | {fmt(l)} | {fmt(r_)} |")
    open(os.path.join(outdir, "_units_legacydiff.md"), "w").write("\n".join(leg))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
