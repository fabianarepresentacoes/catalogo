import os, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageOps
SRC, DST, SIZE = sys.argv[1], sys.argv[2], 600
os.makedirs(DST, exist_ok=True)
def one(f):
    out = os.path.join(DST, os.path.splitext(f)[0] + '.webp')
    if os.path.exists(out): return 0
    try:
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f)))
        im = im.convert('RGBA' if im.mode in ('RGBA','LA','P') else 'RGB')
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        im.save(out, 'WEBP', quality=78, method=4)
        return 1
    except Exception as e:
        print('ERRO', f, e); return 0
files = [f for f in os.listdir(SRC) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))]
with ProcessPoolExecutor() as ex: print('geradas', sum(ex.map(one, files, chunksize=16)))
