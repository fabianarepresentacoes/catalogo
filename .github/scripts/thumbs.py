# Gera miniaturas .webp (600px) das fotos em "imagens/" que ainda não têm miniatura.
# Uma foto com problema é apenas avisada e pulada: não derruba o processo inteiro.
import os, sys, traceback
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageOps

SRC, DST, SIZE = sys.argv[1], sys.argv[2], 600
os.makedirs(DST, exist_ok=True)

def one(f):
    out = os.path.join(DST, os.path.splitext(f)[0] + '.webp')
    if os.path.exists(out): return 0
    try:
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f)))
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        im.save(out, 'WEBP', quality=78, method=4)
        print('ok', f)
        return 1
    except Exception as e:
        print('ERRO', f, e)
        return 0

files = [f for f in os.listdir(SRC) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
todo = [f for f in files if not os.path.exists(os.path.join(DST, os.path.splitext(f)[0] + '.webp'))]
print(f'{len(files)} fotos, {len(todo)} sem miniatura')

total = 0
if todo:
    try:
        # Várias de uma vez quando há muitas fotos novas
        with ProcessPoolExecutor() as ex:
            total = sum(ex.map(one, todo, chunksize=16))
    except Exception:
        # Se o processamento paralelo falhar no servidor, faz uma por uma
        traceback.print_exc()
        print('Paralelo falhou; gerando uma por uma...')
        total = sum(one(f) for f in todo)
print('geradas', total)
