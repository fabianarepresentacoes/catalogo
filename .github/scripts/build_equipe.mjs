// Uso: node build_equipe.mjs <get_values.json> <senha> <saida>
import fs from 'fs';
import { webcrypto as crypto } from 'crypto';
const [src, senha, out] = process.argv.slice(2);
const v = JSON.parse(fs.readFileSync(src, 'utf8')).values;
const h = v[0].map(s => s.trim().toLowerCase());
const ix = n => h.indexOf(n);
const map = {};
for (const r of v.slice(1)) {
  const code = (r[ix('codigo')] || '').trim();
  if (!code) continue;
  map[code] = [r[ix('parceira')] || '', r[ix('codigo_original')] || '', r[ix('pagina_pdf')] || '', r[ix('preco_tabela')] || ''].map(s => String(s).trim());
}
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(map)));
const b64 = u => Buffer.from(u).toString('base64');
fs.writeFileSync(out, JSON.stringify({ v: 1, it: 250000, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) }));
console.log('produtos:', Object.keys(map).length, 'exemplo:', Object.entries(map)[2004]);
