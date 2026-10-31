exec(open('group.py').read())  # rodar depois de group.py
import json
old=json.load(open('variacoes.json'))
same = {k:v['grupo'] for k,v in result.items()} == {k:v[0] for k,v in old['itens'].items()}
print('mesmos grupos que o publicado:', same)
def strip_temp(s):
    s=re.sub(r'(?i)\b(\d{4})\s?k\b|(?<![0-9A-Za-z])[2-6]\s?k\b|\bRGBW?\b','',s)
    s=re.sub(r'\s+,',',',s); s=re.sub(r',\s*,',',',s); s=re.sub(r'\(\s*\)','',s)
    return re.sub(r'\s{2,}',' ',s).strip(' ,-+/')
def strip_cor(s):
    def rm(m):
        w=m.group(0); return '' if na(w) in COR or na(w) in ACAB else w
    s=re.sub(r'(?i)\b(Off) (White)\b','',s)
    s=re.sub(r'[A-Za-zÀ-ú]+',rm,s)
    s=re.sub(r'\s*/\s*(?=[,\)]|$)','',s); s=re.sub(r'(?<=[\s,(])/\s*','',s)
    s=re.sub(r'\s+,',',',s); s=re.sub(r',\s*,',',',s); s=re.sub(r'\(\s*\)','',s)
    s=re.sub(r'\b(com|e|\+)\s*(?=,|$|\))','',s)
    return re.sub(r'\s{2,}',' ',s).strip(' ,-+/')
novo={}; mud=0
for gid,ks in by.items():
    vc=len({result[k]['cor'] for k in ks})>1; vt=len({result[k]['temperatura'] for k in ks})>1
    n=R[ks[0]]['nome']
    if vt: n=strip_temp(n)
    if vc: n=strip_cor(n)
    novo[gid]=n
    if n!=old['grupos'][gid]: mud+=1
print('nomes alterados',mud)
import random; random.seed(2)
for gid in random.sample([g for g in novo if novo[g]!=old['grupos'][g]],8): print(old['grupos'][gid],' -> ',novo[gid])
old['grupos']=novo
json.dump(old,open('variacoes.json','w'),ensure_ascii=False,separators=(',',':'))
