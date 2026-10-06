"""Baut docs/anime-adventures/data/units.json aus den geparsten Wiki-Datenmodulen.

Eingaben (per lua2json.py erzeugt):
  UnitData_Data.json          S65  Module:UnitData/Data, Rev. 47322 (RR, 2026-03-18)
  UnitData_Data_legacy.json   S66  dieselbe Datei, Rev. 33214 (LEGACY-Endstand, 2023-12-14)
  AoE_Type.json               S67  Module:UnitData/Data/AoE Type
  Names.json                  S71  Module:UnitData/Data/Names (Anzeigename -> ID)
Aufruf: python3 build_units.py <eingabeordner> <ausgabe.json>
"""
import json, sys, os

SKIP = {"ASSETS", "animation_set", "shared_setup_script", "pet_animation_set", "shiny_animation_sets",
        "passive_accessory_anim", "shiny_passive_accessory_anim", "character_model", "spawn_anim",
        "death_anim", "death_fx", "override_death_fx", "override_hit_animations", "gone_parts",
        "shiny_gone_parts", "mapped_skins", "spawn_effects", "_black_in_gui", "not_humanoid_rig",
        "_auto_bounding_box", "walk_run_mode"}
CORE = {"id", "name", "rarity", "limited", "shiny", "evolved", "evolve", "_base_damage_type",
        "_secondary_damage_types", "cost", "damage", "attack_cooldown", "range", "spawn_cap",
        "primary_attack_no_upgrades", "upgrade", "hill_unit", "hybrid_placement", "crit_chance",
        "crit_damage", "hide_from_banner", "_rateup_banner_only", "farm_amount", "cooldown",
        "knockback_points", "health", "speed", "unsellable"}
AOE = {"AoE (Circle)": "circle", "Aoe (Circle)": "circle", "AoE (Cone)": "cone", "AoE (Line)": "line",
       "AoE (Full)": "full", "Single": "single"}


def num(x):
    if isinstance(x, float):
        r = round(x, 6)
        return int(r) if r == int(r) else r
    return x


def raw(v):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= 400 else s[:397] + "..."


def attack_def(a):
    if not a:
        return None
    d = {"aoe": AOE.get(a.get("AOE_TYPE"), a.get("AOE_TYPE"))}
    for k_src, k in (("radius", "radius"), ("angle", "angle"), ("width", "width"), ("Hits", "hits")):
        if a.get(k_src) is not None:
            d[k] = num(a[k_src])
    if a.get("Effect"):
        e = a["Effect"]
        d["dot"] = {"type": e.get("Name"), "multiplierPerTick": num(float(e.get("Multiplier"))),
                    "ticks": int(e.get("Ticks"))}
        d["dot"]["totalMultiplier"] = num(d["dot"]["multiplierPerTick"] * d["dot"]["ticks"])
    if a.get("Special_Effect"):
        d["special"] = {k[0].lower() + k[1:]: num(v) for k, v in a["Special_Effect"].items()}
    return d


def levels(u, attacks):
    out = []
    cur_attack = u.get("primary_attack_no_upgrades")
    base = {"level": 0, "cost": num(u.get("cost")), "damage": num(u.get("damage")),
            "spa": num(u.get("attack_cooldown")), "range": num(u.get("range"))}
    if u.get("farm_amount") is not None:
        base["farm"] = num(u["farm_amount"])
    base["attack"] = cur_attack
    out.append(base)
    for i, up in enumerate(u.get("upgrade") or [], 1):
        if not isinstance(up, dict):
            continue
        prev = out[-1]
        lv = {"level": i, "cost": num(up.get("cost"))}
        for src, k in (("damage", "damage"), ("attack_cooldown", "spa"), ("range", "range")):
            # fehlende Felder erben den Vorwert (so stellt das Wiki-Modul die Tabelle dar)
            lv[k] = num(up[src]) if up.get(src) is not None else prev.get(k)
        if up.get("farm_amount") is not None:
            lv["farm"] = num(up["farm_amount"])
        elif "farm" in prev:
            lv["farm"] = prev["farm"]
        if up.get("primary_attack"):
            cur_attack = up["primary_attack"]
        lv["attack"] = cur_attack
        if up.get("note"):
            lv["note"] = up["note"]
        extra = {k: raw(v) for k, v in up.items()
                 if k not in ("cost", "damage", "attack_cooldown", "range", "farm_amount", "primary_attack", "note")}
        if extra:
            lv["extra"] = extra
        out.append(lv)
    for lv in out:
        a = attacks.get(lv.get("attack"))
        hits = (a or {}).get("hits", 1)
        if isinstance(lv.get("damage"), (int, float)) and isinstance(lv.get("spa"), (int, float)) and lv["spa"] > 0:
            lv["dps"] = num(lv["damage"] / lv["spa"])
        if a and a.get("dot") and "dps" in lv:
            lv["dpsWithDot"] = num(lv["dps"] * (1 + a["dot"]["totalMultiplier"]))
    tot = 0
    for lv in out:
        if isinstance(lv.get("cost"), (int, float)):
            tot += lv["cost"]
        lv["cumulativeCost"] = num(tot)
    return out


def evolution(u):
    e = u.get("evolve")
    if not isinstance(e, dict):
        return None
    n = e.get("normal") or {}
    s = e.get("shiny") or {}
    def items(r):
        return [[x.get("item_id"), x.get("amount")] for x in (r.get("item_requirement") or []) if isinstance(x, dict)]
    def units(r):
        return [[x.get("unit_id"), x.get("amount"), bool(x.get("shiny"))] for x in (r.get("unit_requirement") or []) if isinstance(x, dict)]
    ev = {"to": e.get("evolve_unit"), "text": e.get("evolve_text"), "items": items(n), "units": units(n),
          "takedowns": n.get("_takedown_requirement")}
    if s and items(s) != items(n):
        ev["shinyItems"] = items(s)
    other = {k: raw(v) for k, v in e.items() if k not in ("normal", "shiny", "evolve_unit", "evolve_text")}
    if other:
        ev["extra"] = other
    return ev


def main(src, dst):
    C = json.load(open(os.path.join(src, "UnitData_Data.json")))
    L = json.load(open(os.path.join(src, "UnitData_Data_legacy.json")))
    A = json.load(open(os.path.join(src, "AoE_Type.json")))
    N = json.load(open(os.path.join(src, "Names.json")))
    effects = A.pop("Special_Effect_List", {})
    attacks = {k: attack_def(v) for k, v in A.items() if isinstance(v, dict)}
    display = {}
    for disp, v in N.items():
        if isinstance(v, dict) and v.get("name"):
            display.setdefault(v["name"], disp)
    units = []
    for key, u in C.items():
        if not isinstance(u, dict):
            continue
        placement = "hybrid" if u.get("hybrid_placement") else ("hill" if u.get("hill_unit") else "ground")
        cap = u.get("spawn_cap")
        rec = {
            "id": key,
            "nameRR": display.get(key, u.get("name")),
            "nameModule": u.get("name"),
            "nameLegacy": (L.get(key) or {}).get("name"),
            "inLegacy": key in L,
            "rarity": u.get("rarity"),
            "kind": "unit" if u.get("rarity") else "summon",
            "limited": u.get("limited") is not None,
            "hideFromBanner": bool(u.get("hide_from_banner")),
            "rateupBannerOnly": bool(u.get("_rateup_banner_only")),
            "shinyVariant": bool(u.get("shiny")),
            "evolvedFrom": (u.get("evolved") or {}).get("from") if isinstance(u.get("evolved"), dict) else None,
            "damageType": u.get("_base_damage_type"),
            "secondaryDamageTypes": sorted(k.replace("_damage", "") for k, v in (u.get("_secondary_damage_types") or {}).items() if v),
            "placement": placement,
            "spawnCap": int(str(cap).split()[0]) if cap is not None and str(cap).split()[0].isdigit() else cap,
            "spawnCapGlobal": isinstance(cap, str) and "Global" in cap,
            "critChance": num(u.get("crit_chance")),
            "critDamage": num(u.get("crit_damage")),
            "unsellable": bool(u.get("unsellable")),
            "cooldownField": num(u.get("cooldown")),
            "knockbackPoints": u.get("knockback_points"),
            "health": num(u.get("health")),
            "speed": num(u.get("speed")),
            "levels": levels(u, attacks),
            "evolution": evolution(u),
        }
        lv = rec["levels"]
        rec["maxLevel"] = lv[-1]["level"]
        rec["totalCost"] = lv[-1]["cumulativeCost"]
        if "dps" in lv[-1] and rec["totalCost"]:
            rec["maxDps"] = lv[-1]["dps"]
            rec["dpsPerYenAtMax"] = num(lv[-1]["dps"] / rec["totalCost"])
        extra = {k: raw(v) for k, v in u.items() if k not in CORE and k not in SKIP}
        if extra:
            rec["extra"] = extra
        if key in L:
            ll = levels(L[key], attacks)
            strip = lambda xs: [{k: x.get(k) for k in ("cost", "damage", "spa", "range", "farm")} for x in xs]
            if strip(ll) != strip(lv):
                rec["legacyLevels"] = ll
        rec["meta"] = {"origin": "OBSERVED", "confidence": "HIGH",
                       "source": "S65" + (", S66" if key in L else ""),
                       "note": "Datamine-Format (Wiki-Modul). DPS/Kosten-Felder sind DERIVED."}
        units.append(rec)
    out = {
        "_meta": {
            "description": "Unit-Datenbank Anime Adventures, vollständig aus Wiki-Datenmodulen (S65 RR-Stand 2026-03-18, S66 LEGACY-Endstand 2023-12-14, S67 Angriffe/Effekte, S71 Anzeigenamen).",
            "conventions": {
                "level": "0 = Platzierung, 1..n = Upgrades. 'cost' = Kosten dieser Stufe; 'cumulativeCost' = Summe bis hier.",
                "spa": "Sekunden pro Angriff (Quelle: attack_cooldown).",
                "dps": "DERIVED = damage / spa. Treffer ('hits') teilen den Damage auf und erhöhen ihn nicht (S76).",
                "dpsWithDot": "DERIVED = dps × (1 + DoT-Gesamtmultiplikator) für Angriffe mit Burn/Bleed/Poison/Wither.",
                "inheritance": "Fehlt in einer Upgrade-Stufe damage/spa/range, gilt der Vorwert.",
                "farm": "Yen-Einkommen pro Wave (Farm-Units).",
                "cooldownField": "Rohfeld 'cooldown' (bei ~70 % der Units = 10). Bedeutung UNKNOWN.",
                "knockbackPoints": "Rohfeld 'knockback_points', meist [0.5]. Bedeutung UNKNOWN (vermutlich Zeitpunkt im Animationsablauf).",
                "health/speed": "nur bei Beschwörungen/Units mit eigenem Körper; Bedeutung je Unit siehe units.md.",
                "legacyLevels": "nur gesetzt, wenn sich Legacy- und RR-Werte unterscheiden.",
                "extra": "weitere Rohfelder als JSON-Text; Asset-Felder (Modelle, Animationen, Sounds) wurden bewusst entfernt.",
                "null": "UNKNOWN bzw. im Modul nicht gesetzt.",
            },
            "counts": {},
            "retrieved": "2026-10-05",
        },
        "effects": {k: {"note": v.get("note"), "wikiLink": v.get("link")} for k, v in effects.items()},
        "attacks": attacks,
        "units": units,
    }
    from collections import Counter
    out["_meta"]["counts"] = {"units": len(units), "byRarity": dict(Counter(u["rarity"] or "summon" for u in units)),
                              "inLegacy": sum(u["inLegacy"] for u in units),
                              "legacyStatsDiffer": sum("legacyLevels" in u for u in units),
                              "attacks": len(attacks), "effects": len(effects)}
    json.dump(out, open(dst, "w"), ensure_ascii=False, indent=1)
    print(json.dumps(out["_meta"]["counts"]))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
