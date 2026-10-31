import json,re,collections,unicodedata
exec(open('/home/claude/fixnames.py').read())
bd={r['codigo']:r for r in json.load(open('/home/claude/bd.json'))}
for r in rows:
    for f in ('nome','especificacoes','descricao'): r[f]=fix_all(r[f])
    r['parceira']=bd.get(r['codigo'],{}).get('parceira','')
def na(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
COR={'preto':'Preto','preta':'Preto','branca':'Branco','dourada':'Dourado','cromada':'Cromado','prateada':'Prata','black':'Preto','branco':'Branco','white':'Branco','dourado':'Dourado','ouro':'Dourado','gold':'Dourado',
 'cobre':'Cobre','cromado':'Cromado','champagne':'Champagne','champanhe':'Champagne','bronze':'Bronze','grafite':'Grafite',
 'cinza':'Cinza','prata':'Prata','prateado':'Prata','rose gold':'Rose Gold','rosegold':'Rose Gold','nude':'Nude','marrom':'Marrom','bege':'Bege',
 'fendi':'Fendi','verde':'Verde','azul':'Azul','vermelho':'Vermelho','amarelo':'Amarelo','rosa':'Rosa','laranja':'Laranja',
 'transparente':'Transparente','fume':'Fumê','ambar':'Âmbar','corten':'Corten','inox':'Inox','niquel':'Níquel','titanio':'Titânio','areia':'Areia','off white':'Off White','offwhite':'Off White'}
ACAB={'fosco':'Fosco','escovado':'Escovado','acetinado':'Acetinado','brilhante':'Brilhante','texturizado':'Texturizado','envelhecido':'Envelhecido'}
# "branco quente/frio/neutro" = luz, nao cor
LUZ=r'branco (quente|frio|neutro)|luz (quente|fria|neutra|amarela|branca|natural|dia)'
TEMPRE=r'(?<![0-9])(\d{4})\s?k\b|(?<![0-9a-z])([2-6])\s?k\b|\brgbw?\b'
def temps(t):
    out=[]
    for m in re.finditer(TEMPRE,t):
        if m.group(1): out.append(m.group(1)+'K')
        elif m.group(2): out.append(m.group(2)+'000K')
        else: out.append(m.group(0).upper())
    return out
def cores(t):
    t=re.sub(LUZ,' ',t)
    keys=sorted(list(COR)+list(ACAB),key=len,reverse=True)
    found=[]
    for k in keys:
        for m in re.finditer(r'(?<![a-z])'+re.escape(k)+r'(?![a-z])',t):
            if not any(m.start()<e and s<m.end() for s,e,_ in found): found.append((m.start(),m.end(),k))
    found.sort()
    lab=[]
    for s,e,k in found:
        if k in ACAB:
            if lab: lab[-1]+=' '+ACAB[k]
            else: lab.append(ACAB[k])
        else: lab.append(COR[k])
    t2=t
    for s,e,k in sorted(found,reverse=True): t2=t2[:s]+' '+t2[e:]
    # "preto+br" (Embuled)
    ded=[]
    for x in lab:
        if not ded or ded[-1]!=x: ded.append(x)
    return '/'.join(ded), t2
def norm(t):
    t=re.sub(LUZ,' ',t); t=re.sub(TEMPRE,' ',t)
    t=re.sub(r'temperatura de cor:?','',t); t=re.sub(r'\bcor:?','',t)
    t=re.sub(r'[^a-z0-9,\.x]+',' ',t); t=re.sub(r'\s+',' ',t).strip(' ,.')
    return t
info={}
for r in rows:
    n=na(r['nome']); sp=na(r['especificacoes'])
    c,nr=cores(n)
    tn=temps(n)
    tlab=tn[0] if len(tn)==1 else ('' if not tn else 'MULTI')
    if not tn:
        m=re.search(r'temperatura de cor:\s*([^|]+)',sp)
        ts=temps(m.group(1)) if m else []
        tlab=ts[0] if len(ts)==1 else ('' if not ts else 'MULTI')
    csp,spr=cores(sp)
    key=(r['parceira'],r['categoria'],norm(nr),norm(spr))
    info[r['codigo']]=dict(cor=c,temp=tlab,key=key)
groups=collections.defaultdict(list)
for r in rows: groups[info[r['codigo']]['key']].append(r)
result={}; motivos=collections.Counter()
for key,g in groups.items():
    if len(g)<2: continue
    g=[r for r in g if info[r['codigo']]['temp']!='MULTI']
    cs={info[r['codigo']]['cor'] for r in g}; ts={info[r['codigo']]['temp'] for r in g}
    # quem nao tem rotulo na dimensao que varia fica de fora
    if len(cs)>1 and '' in cs: g=[r for r in g if info[r['codigo']]['cor']]; motivos['sem cor']+=1
    if len(ts)>1 and '' in ts: g=[r for r in g if info[r['codigo']]['temp']]; motivos['sem temp']+=1
    if len(g)<2: continue
    combos=collections.Counter((info[r['codigo']]['cor'],info[r['codigo']]['temp']) for r in g)
    if any(c>1 for c in combos.values()): motivos['combinação repetida']+=1; continue
    cs={info[r['codigo']]['cor'] for r in g}; ts={info[r['codigo']]['temp'] for r in g}
    if len(cs)<2 and len(ts)<2: continue
    gid='V'+g[0]['codigo'][5:]
    for r in g: result[r['codigo']]=dict(grupo=gid,cor=info[r['codigo']]['cor'] if len(cs)>1 else '',temperatura=info[r['codigo']]['temp'] if len(ts)>1 else '')
R={r['codigo']:r for r in rows}
by=collections.defaultdict(list)
for k,v in result.items(): by[v['grupo']].append(k)
def strip_name(name):
    s=name
    s=re.sub(r'(?i)\b(\d{4})\s?k\b|(?<![0-9a-z])[2-6]\s?k\b|\bRGBW?\b','',s)
    s=re.sub(r'(?i)\b('+LUZ+r')\b','',s)
    keys=sorted(list(COR)+list(ACAB),key=len,reverse=True)
    for k in keys:
        s=re.sub(r'(?i)(?<![A-Za-zÀ-ú])'+re.escape(k).replace('e','[eéê]').replace('a','[aáâ]')+r'(?![A-Za-zÀ-ú])','',s) if False else s
    # remove cor words respeitando acentos
    def rm(m):
        w=m.group(0); return '' if na(w) in COR or na(w) in ACAB else w
    s=re.sub(r'[A-Za-zÀ-ú]+',rm,s)
    s=re.sub(r'\b(Off) (White)\b','',s)
    s=re.sub(r'\s*/\s*(?=[,\)]|$)','',s); s=re.sub(r'(?<=[\s,(])/\s*','',s)
    s=re.sub(r'\s+,',',',s); s=re.sub(r',\s*,',',',s); s=re.sub(r'\(\s*\)','',s)
    s=re.sub(r'\b(com|e|\+)\s*(?=,|$|\))','',s)
    s=re.sub(r'\s{2,}',' ',s).strip(' ,-+/')
    return s
nome_grupo={}
for gid,ks in by.items():
    ks.sort(key=lambda k: float(R[k]['preco'].replace('.','').replace(',','.') or 0))
    nome_grupo[gid]=strip_name(R[ks[0]]['nome'])
