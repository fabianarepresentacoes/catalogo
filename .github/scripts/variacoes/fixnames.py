import json,re,collections
v=json.load(open('/home/claude/p1.json'))['values']; H=v[0]; rows=[dict(zip(H,r+['']*(len(H)-len(r)))) for r in v[1:]]
words=collections.Counter()
for r in rows:
    for w in re.findall(r"[A-Za-zÀ-ú]+",r['nome']): words[w.lower()]+=1
def fix_text(s, log=None, code=None):
    toks=re.split(r"( )",s)  # keep spaces
    parts=s.split(' '); out=[]; i=0
    while i<len(parts):
        a=parts[i]
        if i+1<len(parts):
            b=parts[i+1]
            if re.fullmatch(r"[A-Za-zÀ-ú]{1,4}",a) and re.fullmatch(r"[A-Za-zÀ-ú]{2,}",b):
                j=(a+b).lower()
                if j not in ('mm','cm') and words[j]>=2 and words[b.lower()]<=3 and a.lower() not in ('com','para','sem','led'):
                    w=j.upper() if s.isupper() else (j if (a[0].islower() and b[0].islower()) else j[0].upper()+j[1:])
                    if log is not None: log.append((code,a+' '+b,w))
                    out.append(w); i+=2; continue
        out.append(a); i+=1
    return ' '.join(out)
MANUAL={'Acr Ílico':'Acrílico','Me Tal':'Metal','LED p Reto':'LED Preto'}
_fix=fix_text
def fix_all(s, log=None, code=None):
    for a,b in MANUAL.items():
        for A,B in ((a,b),(a.upper(),b.upper())):
            if A in s:
                s=s.replace(A,B)
                if log is not None: log.append((code,A,B))
    return _fix(s,log,code)
