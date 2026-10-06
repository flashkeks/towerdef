"""Übernimmt Agenten-Nebenausgaben (corrections/unknowns/sources_<PKG>.md) in unknowns.md/sources.md.
Aufruf: python3 integrate_pkg.py <out-ordner> <PKG> [<Quellen-ID-Start>]"""
import sys, re, os
D = "/home/user/towerdef/docs/anime-adventures/"
out, pkg = sys.argv[1], sys.argv[2]
def rows(path):
    if not os.path.exists(path): return []
    return [l for l in open(path).read().splitlines() if l.startswith("|") and not re.match(r"^\|\s*-", l) and "alte Aussage" not in l and "| URL |" not in l]
u = open(D + "unknowns.md").read()
corr = rows(f"{out}/corrections_{pkg}.md")
if "## H. Paketbefunde" in u:
    a, b = u.split("## H. Paketbefunde", 1); b = "## H. Paketbefunde" + b
else:
    a, b = u.rstrip("\n") + "\n", "\n## H. Paketbefunde (Sitzung 2)\n\nKonflikte, Lücken und erledigte Einträge aus den Paketen der Sitzung 2. Die älteren Abschnitte A–F werden in P12 konsolidiert.\n"
a = a.rstrip("\n") + "\n" + "\n".join(corr) + "\n\n"
un = f"{out}/unknowns_{pkg}.md"
if os.path.exists(un):
    txt = open(un).read().strip()
    txt = re.sub(r"^## ", "#### ", txt, flags=re.M)
    b = b.rstrip("\n") + f"\n\n### {pkg}\n\n" + txt + "\n"
open(D + "unknowns.md", "w").write(a + b)
src = rows(f"{out}/sources_{pkg}.md")
if src and len(sys.argv) > 3:
    s = open(D + "sources.md").read()
    n = int(sys.argv[3]); new = []
    for r in src:
        cells = [c.strip() for c in r.strip("|").split("|")]
        new.append(f"| S{n} | {cells[0]} ({cells[1]}) | Abruf 2026-10-06 | {cells[2]} | {cells[3]} | {cells[4]} |"); n += 1
    s = s.replace("\n\n## Explizit verworfene Daten", "\n" + "\n".join(new) + "\n\n## Explizit verworfene Daten", 1)
    open(D + "sources.md", "w").write(s)
print(pkg, len(corr), "Korrekturen,", len(src), "Quellen")
