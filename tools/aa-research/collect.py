import json,re,glob,os,collections
import os
TR=os.environ.get("AA_TOOL_RESULTS", os.path.expanduser("~/.claude/projects/-home-user-towerdef/tool-results/"))
groups=collections.defaultdict(list)
for f in glob.glob(TR+"mcp-Multitool-fetch-*.txt"):
    try: r=json.load(open(f))["result"]
    except Exception: continue
    u=re.match(r"URL: (.*)\n",r)
    m=re.search(r"Zeichen (\d+)-(\d+) von (\d+)\n\n",r)
    if not (u and m): continue
    a,b,n=map(int,m.groups()); body=r[m.end():]
    body=re.sub(r"\n\n\[\.\.\. gekuerzt, weiter mit start=\d+\]$","",body)
    groups[u.group(1)].append((a,b,n,body,f))
docs={};incomplete=[]
for url,parts in groups.items():
    parts.sort(key=lambda p:p[0]); pos=0; out=[]
    for a,b,n,body,f in parts:
        if a>pos: break
        if b>pos: out.append(body[pos-a:]); pos=b
    if pos!=parts[0][2]: incomplete.append((url,pos,parts[0][2])); continue
    docs[url]="".join(out)
json.dump(docs,open(os.environ.get('AA_OUT','fetched_docs.json'),'w'))
print(len(docs),'complete;',len(incomplete),'incomplete')
for i in incomplete: print('INCOMPLETE',i)
