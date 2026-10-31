/* =====================================================================
   MOTOR DO CATÁLOGO — comum aos 6 modelos
   Lê a mesma planilha (Google Sheets publicado em CSV), o mesmo
   variacoes.json e o mesmo equipe.dat do site principal.
   Cada modelo só cuida da aparência: cabeçalho, vitrine e cards.
   ===================================================================== */
(function () {
  'use strict';

  // ================== CONFIGURAÇÕES (iguais às do site) ==================
  const CFG = {
    csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRzJ_n9tb1R1v1eBH3i8n_ogSORXAI7qzFeaeJVIUs0_ZQdhFnzyyLvQdaaCqBwia_6bGCXW-5s32aB/pub?output=csv",
    whatsapp: "5511959781849",
    root: "../",                 // pasta raiz do site (onde ficam imagens/, miniaturas/, variacoes.json)
    pageSize: 48,
    brandName: "Fabiana Representações",
    brandSub: "Iluminação Decorativa",
    cartKey: "lumifa_cart_v1",   // mesmo orçamento do site principal e do talão
    teamKey: "lumifa_equipe_v1",
  };

  // Produtos em destaque ("Mais procurado") — mesma lista do site
  const DESTAQUES = ["PROD-2306","PROD-2458","PROD-2308","PROD-3178","PROD-2500","PROD-3615","PROD-2274","PROD-2435","PROD-2311","PROD-2607","PROD-2294","PROD-3238","PROD-2506","PROD-2454","PROD-2309","PROD-3600","PROD-2278","PROD-3177","PROD-2065","PROD-3618","PROD-2450","PROD-2534","PROD-3216","PROD-3420","PROD-2604","PROD-3549"];
  const PRIORIDADE = [{ de: 2005, ate: 3716 }];   // Luminatti primeiro
  const NOVIDADES = { de: 3725, ate: 99999 };       // últimos cadastrados (Noiré)

  // Ícone de cada categoria (Font Awesome)
  const CAT_ICON = {
    'Pendentes': 'fa-solid fa-lightbulb', 'Arandelas': 'fa-regular fa-sun', 'Plafons': 'fa-regular fa-circle-dot',
    'Lâmpadas & Filamentos': 'fa-regular fa-lightbulb', 'Spots': 'fa-solid fa-bullseye', 'Painéis de LED': 'fa-solid fa-table-cells-large',
    'Iluminação Pública & Industrial': 'fa-solid fa-industry', 'Iluminação Externa & Jardim': 'fa-solid fa-seedling',
    'Lançamentos': 'fa-solid fa-star', 'Abajures & Mesa': 'fa-solid fa-book-open', 'Trilhos & Acessórios': 'fa-solid fa-grip-lines',
    'Fitas & Mangueiras': 'fa-solid fa-wave-square', 'Lustres': 'fa-solid fa-gem', 'Projetores & Refletores': 'fa-solid fa-tower-broadcast',
    'Perfis & Lineares': 'fa-solid fa-ruler-horizontal', 'Ventiladores': 'fa-solid fa-fan'
  };

  const SWATCH = { Preto: '#1F1F1F', Branco: '#FFFFFF', Dourado: '#C9A13A', Cromado: '#C7CCD1', Cobre: '#B87333', Champagne: '#E3D3A8',
    Bronze: '#8C6A3F', Grafite: '#4A4A4A', Cinza: '#9CA3AF', Prata: '#D5D9DE', 'Rose Gold': '#D9A08B', Nude: '#E3C4A8', Marrom: '#6B4226',
    Bege: '#E8DCC4', Fendi: '#A89F91', Verde: '#3F8F4F', Azul: '#2F6FB5', Vermelho: '#C0392B', Amarelo: '#F2C94C', Rosa: '#E58FB0',
    Laranja: '#E67E22', 'Fumê': '#6B6B6B', 'Âmbar': '#D98E04', Corten: '#8B4513', Inox: '#B8BEC4', 'Níquel': '#A8A9AD', 'Titânio': '#878681',
    Areia: '#D8C8A8', 'Off White': '#F4F1EA', Transparente: 'transparent' };
  // palavras das tags que viram filtro de cor para produtos avulsos
  const TAG_COLOR = { preto: 'Preto', branco: 'Branco', dourado: 'Dourado', cromado: 'Cromado', cobre: 'Cobre', bronze: 'Bronze', grafite: 'Grafite',
    rose: 'Rose Gold', marrom: 'Marrom', bege: 'Bege', 'âmbar': 'Âmbar', verde: 'Verde', azul: 'Azul', vermelho: 'Vermelho', cinza: 'Cinza', inox: 'Inox' };

  const PRICE_RANGES = [
    { id: 'p1', label: 'Até R$ 50', min: 0, max: 50 },
    { id: 'p2', label: 'R$ 50 a 200', min: 50, max: 200 },
    { id: 'p3', label: 'R$ 200 a 500', min: 200, max: 500 },
    { id: 'p4', label: 'R$ 500 a 1.000', min: 500, max: 1000 },
    { id: 'p5', label: 'Acima de R$ 1.000', min: 1000, max: Infinity },
  ];

  // ================== UTILITÁRIOS ==================
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const fmt = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = a => [...new Set(a)];
  const priceLabel = p => p > 0 ? fmt(p) : 'Sob consulta';
  const codeNumber = c => { const m = String(c || '').match(/(\d+)\s*$/); return m ? parseInt(m[1], 10) : NaN; };
  const store = {
    get(k, d, s) { try { const v = (s ? sessionStorage : localStorage).getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
    del(k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) {} }
  };

  function parsePrice(raw) {
    let s = String(raw || '').replace(/[^\d,.-]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return parseFloat(s) || 0;
  }
  const trimSep = s => String(s || '').replace(/^[\s/\-–—:|.]+/, '').replace(/[\s/\-–—:|]+$/, '');
  function cleanText(s, name) {
    s = String(s || '').replace(/^\s*especifica[çc][õo]es\s+t[ée]cnicas\s*:\s*/i, '').trim();
    if (name && s.toLowerCase().startsWith(name.toLowerCase())) s = s.slice(name.length);
    return trimSep(s);
  }
  function resolveImage(v) {
    v = (v || '').trim();
    if (!v) return FALLBACK;
    const gh = v.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i);
    if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}`;
    const local = v.match(/^https?:\/\/[^/]+\.github\.io\/(?:[^/]+\/)?(imagens\/.+)$/i);
    if (local) return CFG.root + local[1];
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
    if (v.startsWith('imagens/')) return CFG.root + v;
    if (v.includes('/')) return v;
    return CFG.root + 'imagens/' + encodeURI(v);
  }
  function thumbOf(src) {
    const base = CFG.root + 'imagens/';
    if (!src || !src.startsWith(base)) return src;
    return CFG.root + 'miniaturas/' + src.slice(base.length).replace(/\.(jpe?g|png|webp)$/i, '') + '.webp';
  }
  const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#F4F1EA"/><g fill="none" stroke="#B8962E" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M300 190a80 80 0 0 0-50 142c10 9 14 18 14 30v8h72v-8c0-12 4-21 14-30a80 80 0 0 0-50-142z"/><path d="M272 400h56M280 424h40"/></g></svg>');
  window.__imgFb = function (img, original) {
    if (img.dataset.fb) { img.onerror = null; img.src = FALLBACK; return; }
    img.dataset.fb = '1'; img.src = original;
  };

  // ================== ESTADO ==================
  const S = {
    products: [], items: [], groups: new Map(), byCode: new Map(),
    cat: 'Todos', q: '', sort: 'default', price: null, colors: new Set(), temps: new Set(),
    list: [], rendered: 0, cart: [], team: null, opts: {}, logo: 'duo'
  };

  // ================== MARCA (logo) ==================
  // 'fr'   = emblema FR + nome "Fabiana Representações"
  // 'frc'  = logo circular completa da FR
  // 'duo'  = LumiFa | FR (logo da LumiFa, divisor e logo FR)
  function brandHtml(mode, dark) {
    const r = CFG.root + 'modelos/img/';
    const em = dark ? 'fr-emblema-claro.png' : 'fr-emblema.png';
    const fr = `<span class="brand-fr"><img src="${r + em}" alt="" class="brand-emblem"><span class="brand-words"><b>${esc(CFG.brandName)}</b><small>${esc(CFG.brandSub)}</small></span></span>`;
    if (mode === 'lumifa') return `<img src="${r + (dark ? 'logo-escuro.png' : 'logo.png')}" alt="LumiFa Iluminação" class="brand-lumifa solo">`;
    if (mode === 'frc') return `<img src="${r + (dark ? 'fr-logo-claro.png' : 'fr-logo.png')}" alt="${esc(CFG.brandName)}" class="brand-circle">`;
    if (mode === 'duo') return `<img src="${r + (dark ? 'logo-escuro.png' : 'logo.png')}" alt="LumiFa Iluminação" class="brand-lumifa"><span class="brand-sep" aria-hidden="true"></span>${fr}`;
    return fr;
  }
  function renderBrand() {
    $$('[data-brand]').forEach(el => {
      const dark = el.hasAttribute('data-dark') || document.documentElement.classList.contains('dark');
      el.className = el.className.replace(/\bbrand-mode-\w+/g, '').trim() + ' brand brand-mode-' + S.logo;
      el.innerHTML = brandHtml(S.logo, dark);
    });
  }
  function setLogo(mode) { S.logo = mode; store.set('modelos_logo', mode, true); renderBrand(); syncDemoBar(); }

  // ================== TEMA ==================
  function setTheme(t, save) {
    document.documentElement.classList.toggle('dark', t === 'dark');
    if (save) store.set('modelos_tema_' + (S.opts.id || ''), t, true);
    renderBrand();
  }
  function toggleTheme() { setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark', true); }

  // ================== DADOS ==================
  function load() {
    const params = new URLSearchParams(location.search);
    const csvUrl = params.get('csv') || CFG.csv;     // ?csv= só para teste local
    const varP = fetch(CFG.root + 'variacoes.json?t=' + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null);
    Papa.parse(csvUrl + (csvUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), {
      download: true, header: true, skipEmptyLines: true,
      complete: res => {
        S.products = (res.data || []).map((row, idx) => {
          const it = {};
          for (const k in row) it[k.trim().toLowerCase()] = row[k] ? String(row[k]).trim() : '';
          const rawSpecs = it.especificacoes || it['especificações'] || '';
          const rawDesc = it.descricao || it['descrição'] || rawSpecs;
          const p = {
            code: it.codigo || it['código'] || `COD-${idx + 1}`,
            name: it.nome || it.codigo || 'Produto',
            category: it.categoria || 'Geral',
            price: parsePrice(it.preco || it['preço']),
            image: resolveImage(it.imagem)
          };
          p.specs = cleanText(rawSpecs, p.name);
          const tm = rawDesc.match(/\bTags:\s*(.+)$/i);
          p.tags = tm ? tm[1].split(/\s+-\s+|,/).map(t => t.trim()).filter(Boolean) : [];
          let desc = cleanText(rawDesc.replace(/\s*\bTags:.*$/i, ''), p.name);
          if (p.specs && desc.toLowerCase().startsWith(p.specs.toLowerCase())) desc = trimSep(desc.slice(p.specs.length));
          p.desc = desc;
          const catKey = norm(p.category);
          p.haystack = norm([p.code, p.name, rawSpecs, desc, p.tags.filter(t => norm(t) !== catKey).join(' ')].join(' '));
          p.order = idx;
          const d = DESTAQUES.indexOf(p.code.toUpperCase());
          const n = codeNumber(p.code);
          p.rank = d >= 0 ? d : (PRIORIDADE.some(r => n >= r.de && n <= r.ate) ? 10000 : 99999);
          p.featured = d >= 0;
          p.isNew = n >= NOVIDADES.de && n <= NOVIDADES.ate;
          // facetas para filtros
          p.fColors = uniq(p.tags.map(t => TAG_COLOR[norm(t)] || TAG_COLOR[t.toLowerCase()]).filter(Boolean));
          p.fTemps = uniq((rawSpecs.match(/\b(\d{4})\s?K\b/gi) || []).map(x => x.replace(/\s/g, '').toUpperCase()));
          S.byCode.set(p.code, p);
          return p;
        });
        if (!S.products.length) return fail('Catálogo vazio', 'Não encontramos produtos na planilha.');
        varP.then(v => { buildItems(v); loadCart(); ready(); });
      },
      error: () => fail('Não foi possível carregar o catálogo', 'Verifique sua conexão e tente novamente.')
    });
  }

  function buildItems(v) {
    S.groups = new Map();
    const byG = new Map();
    if (v && v.itens) S.products.forEach(p => {
      const info = v.itens[p.code]; if (!info) return;
      p.group = info[0]; p.color = info[1] || ''; p.temp = info[2] || '';
      if (!byG.has(p.group)) byG.set(p.group, []);
      byG.get(p.group).push(p);
    });
    byG.forEach((vs, gid) => {
      const combos = new Set(vs.map(x => x.color + '|' + x.temp));
      if (vs.length < 2 || new Set(vs.map(x => x.category)).size > 1 || combos.size !== vs.length) {
        vs.forEach(x => { x.group = null; x.color = ''; x.temp = ''; }); return;
      }
      vs.sort((a, b) => (a.rank - b.rank) || (a.order - b.order));
      const priced = vs.filter(x => x.price > 0).map(x => x.price);
      const rep = vs[0];
      S.groups.set(gid, {
        id: gid, isGroup: true, variants: vs, name: (v.grupos && v.grupos[gid]) || rep.name,
        code: rep.code, category: rep.category, image: rep.image, specs: rep.specs, tags: rep.tags,
        price: priced.length ? Math.min(...priced) : 0, priceMax: priced.length ? Math.max(...priced) : 0,
        colors: uniq(vs.map(x => x.color).filter(Boolean)), temps: uniq(vs.map(x => x.temp).filter(Boolean)).sort(),
        rank: Math.min(...vs.map(x => x.rank)), order: Math.min(...vs.map(x => x.order)),
        featured: vs.some(x => x.featured), isNew: vs.some(x => x.isNew),
        fColors: uniq([...vs.map(x => x.color).filter(Boolean).map(c => c.split(/[\/ ]/)[0]), ...vs.flatMap(x => x.fColors)]),
        fTemps: uniq([...vs.map(x => x.temp).filter(Boolean), ...vs.flatMap(x => x.fTemps)]),
        haystack: vs.map(x => x.haystack).join(' ')
      });
    });
    S.items = []; const seen = new Set();
    S.products.forEach(p => {
      if (!p.group) { S.items.push(p); return; }
      if (seen.has(p.group)) return;
      seen.add(p.group); S.items.push(S.groups.get(p.group));
    });
  }

  // ================== FILTRAR / ORDENAR ==================
  function matchItem(it, terms) {
    if (!terms.length) { it.hit = null; return true; }
    const m = p => terms.every(t => p.haystack.includes(t) || (p.teamHay && p.teamHay.includes(t)));
    if (!it.isGroup) return m(it);
    const h = it.variants.find(m); it.hit = h ? h.code : null; return !!h;
  }
  function filtered(opts) {
    opts = opts || {};
    const terms = norm(S.q).split(/\s+/).filter(Boolean);
    const pr = S.price ? PRICE_RANGES.find(r => r.id === S.price) : null;
    let l = S.items.filter(it => {
      if (!opts.ignoreCat && S.cat !== 'Todos' && it.category !== S.cat) return false;
      if (pr && !(it.price >= pr.min && it.price < pr.max && it.price > 0)) return false;
      if (S.colors.size && !it.fColors.some(c => S.colors.has(c))) return false;
      if (S.temps.size && !it.fTemps.some(t => S.temps.has(t))) return false;
      return matchItem(it, terms);
    });
    const s = S.sort;
    if (s === 'name') l.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    else if (s === 'priceAsc') l.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    else if (s === 'priceDesc') l.sort((a, b) => b.price - a.price);
    else if (s === 'new') l.sort((a, b) => codeNumber(b.code) - codeNumber(a.code));
    else l.sort((a, b) => (a.rank - b.rank) || (a.order - b.order));
    return l;
  }

  function categories() {
    const c = new Map();
    S.items.forEach(it => c.set(it.category, (c.get(it.category) || 0) + 1));
    return [['Todos', S.items.length], ...[...c.entries()]];
  }

  // ================== RENDER ==================
  function render() {
    S.list = filtered();
    S.rendered = 0;
    const grid = $(S.opts.grid || '[data-grid]');
    if (!grid) return;
    grid.innerHTML = '';
    $$('[data-count]').forEach(el => el.textContent = `${S.list.length.toLocaleString('pt-BR')} ${S.list.length === 1 ? 'produto' : 'produtos'}` + (S.cat !== 'Todos' ? ` em ${S.cat}` : ''));
    $$('[data-cat-title]').forEach(el => el.textContent = S.cat === 'Todos' ? (el.dataset.catTitle || 'Todos os produtos') : S.cat);
    const empty = $('[data-empty]');
    if (empty) empty.hidden = S.list.length > 0;
    renderCats(); renderFacets(); renderApplied();
    $$('[data-search]').forEach(i => { if (i !== document.activeElement) i.value = S.q; });
    $$('[data-sort]').forEach(sel => sel.value = S.sort);
    more();
    if (S.opts.onRender) S.opts.onRender(S.list);
  }
  function more() {
    const grid = $(S.opts.grid || '[data-grid]');
    const batch = S.list.slice(S.rendered, S.rendered + CFG.pageSize);
    S.rendered += batch.length;
    grid.insertAdjacentHTML('beforeend', batch.map(it => S.opts.card(view(it), H)).join(''));
    const sent = $('[data-more]');
    if (sent) sent.hidden = S.rendered >= S.list.length;
  }
  // "visão" do item: se a busca bateu numa opção do grupo, o card mostra/abre essa opção
  function view(it) {
    if (!it.isGroup || !it.hit) return it;
    const h = S.byCode.get(it.hit);
    return Object.assign(Object.create(it), { code: h.code, image: h.image });
  }

  function renderCats() {
    $$('[data-cats]').forEach(box => {
      const style = box.dataset.cats || 'pill';
      const tpl = (S.opts.catTemplates && S.opts.catTemplates[style]) || ((c, n, on) =>
        `<button type="button" class="cat ${on ? 'is-on' : ''}" data-cat="${esc(c)}">${esc(c)}<span class="cat-n">${n}</span></button>`);
      if (!box.dataset.built) {
        box.innerHTML = categories().map(([c, n]) => tpl(c, n, c === S.cat, CAT_ICON[c] || 'fa-solid fa-lightbulb')).join('');
        box.dataset.built = '1';
      }
      $$('[data-cat]', box).forEach(b => b.classList.toggle('is-on', b.dataset.cat === S.cat));
    });
  }

  function renderFacets() {
    const box = $('[data-facets]'); if (!box) return;
    const base = filtered({ ignoreCat: false });
    const count = (fn) => { const m = new Map(); base.forEach(it => fn(it).forEach(k => m.set(k, (m.get(k) || 0) + 1))); return m; };
    const colors = count(it => it.fColors), temps = count(it => it.fTemps);
    const chk = (group, val, label, n, on, extra) => `<label class="facet-opt"><input type="checkbox" data-facet="${group}" value="${esc(val)}" ${on ? 'checked' : ''}><span class="facet-box"></span>${extra || ''}<span class="facet-label">${esc(label)}</span><span class="facet-n">${n}</span></label>`;
    const colorList = [...new Set([...colors.keys(), ...S.colors])].sort((a, b) => (colors.get(b) || 0) - (colors.get(a) || 0));
    const tempList = [...new Set([...temps.keys(), ...S.temps])].sort();
    box.innerHTML = `
      <div class="facet"><h4>Faixa de preço</h4>${PRICE_RANGES.map(r => `<label class="facet-opt"><input type="radio" name="fprice" data-facet="price" value="${r.id}" ${S.price === r.id ? 'checked' : ''}><span class="facet-box round"></span><span class="facet-label">${r.label}</span></label>`).join('')}</div>
      ${colorList.length ? `<div class="facet"><h4>Cor / acabamento</h4>${colorList.slice(0, 12).map(c => chk('color', c, c, colors.get(c) || 0, S.colors.has(c), swatch(c, 14))).join('')}</div>` : ''}
      ${tempList.length ? `<div class="facet"><h4>Temperatura da luz</h4>${tempList.slice(0, 10).map(t => chk('temp', t, t + tempName(t), temps.get(t) || 0, S.temps.has(t))).join('')}</div>` : ''}`;
  }
  const tempName = t => { const k = parseInt(t, 10); return k <= 3200 ? ' · quente' : k <= 4500 ? ' · neutra' : ' · fria'; };

  function renderApplied() {
    const box = $('[data-applied]'); if (!box) return;
    const chips = [];
    if (S.q) chips.push(['q', '', `“${S.q}”`]);
    if (S.cat !== 'Todos') chips.push(['cat', '', S.cat]);
    if (S.price) chips.push(['price', '', PRICE_RANGES.find(r => r.id === S.price).label]);
    S.colors.forEach(c => chips.push(['color', c, c]));
    S.temps.forEach(t => chips.push(['temp', t, t]));
    box.hidden = !chips.length;
    box.innerHTML = chips.map(([k, v, l]) => `<button type="button" class="chip-applied" data-unset="${k}" data-val="${esc(v)}">${esc(l)} <i class="fa-solid fa-xmark"></i></button>`).join('') +
      (chips.length > 1 ? `<button type="button" class="chip-clear" data-reset>Limpar tudo</button>` : '');
  }

  // ================== HELPERS PARA OS CARDS ==================
  function swatch(c, size) {
    const parts = String(c).split('/').map(x => SWATCH[x.trim().split(' ')[0]] || SWATCH[x.trim()] || '#CBD5E1');
    const bg = parts.length > 1 ? `linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)` : parts[0];
    return `<span class="sw" style="width:${size}px;height:${size}px;background:${bg}" title="${esc(c)}"></span>`;
  }
  const H = {
    esc, fmt, priceLabel, swatch, thumbOf, icon: c => CAT_ICON[c] || 'fa-solid fa-lightbulb',
    img(it, cls) { const t = thumbOf(it.image); return `<img src="${esc(t)}" alt="${esc(it.name)}" loading="lazy" decoding="async" width="600" height="600" class="${cls || ''}" onerror="__imgFb(this,'${esc(it.image)}')">`; },
    priceHtml(it, cls) {
      const from = it.isGroup && it.priceMax > it.price;
      return `<span class="${cls || 'price'}">${from ? '<small>a partir de</small> ' : ''}${priceLabel(it.price)}</span>`;
    },
    from: it => it.isGroup && it.priceMax > it.price,
    swatches(it, size, max) {
      if (!it.isGroup || !it.colors.length) return '';
      max = max || 6;
      return `<span class="sws">${it.colors.slice(0, max).map(c => swatch(c, size || 12)).join('')}${it.colors.length > max ? `<em>+${it.colors.length - max}</em>` : ''}</span>`;
    },
    temps: it => it.isGroup && it.temps.length ? it.temps.join(' · ') : (it.fTemps || []).join(' · '),
    options: it => it.isGroup ? `${it.variants.length} opções` : '',
    shortSpecs(it, n) {
      const s = (it.specs || '').split('|').map(x => x.trim()).filter(x => x && !/^[A-Z0-9\s,.\-()*/+°ÅÂÉÍÓÚÃÕÇ]+$/.test(x));
      return s.slice(0, n || 3);
    },
    team(it) { const p = it.isGroup ? (S.byCode.get(it.code)) : it; return p && p.team ? `<span class="team-tag"><i class="fa-solid fa-lock"></i>${esc(p.team.partner)} · ${esc(p.team.orig || '—')}</span>` : ''; },
    qtyInCart(code) { const c = S.cart.find(i => i.code === code); return c ? c.qty : 0; }
  };

  // ================== MODAL DO PRODUTO ==================
  function openProduct(code) {
    const p = S.byCode.get(code); if (!p) return;
    const g = p.group ? S.groups.get(p.group) : null;
    const specs = (p.specs || '').split('|').map(x => x.trim()).filter(Boolean);
    const specRows = specs.filter(x => x.includes(':')).map(x => { const i = x.indexOf(':'); return `<tr><th>${esc(x.slice(0, i))}</th><td>${esc(x.slice(i + 1).trim())}</td></tr>`; }).join('');
    const q = s => esc(JSON.stringify(s));
    let picker = '';
    if (g) {
      if (g.colors.length) picker += `<div class="pick"><span class="pick-t">Cor: <b>${esc(p.color)}</b></span><div class="pick-o">${g.colors.map(c => `<button type="button" class="opt ${c === p.color ? 'is-on' : ''}" onclick="Motor.pick(${q(g.id)},${q(c)},${q(p.temp)},'color')">${swatch(c, 16)}${esc(c)}</button>`).join('')}</div></div>`;
      if (g.temps.length) picker += `<div class="pick"><span class="pick-t">Temperatura da luz: <b>${esc(p.temp)}</b></span><div class="pick-o">${g.temps.map(t => `<button type="button" class="opt ${t === p.temp ? 'is-on' : ''}" onclick="Motor.pick(${q(g.id)},${q(p.color)},${q(t)},'temp')"><i class="fa-regular fa-sun"></i>${esc(t)}</button>`).join('')}</div></div>`;
    }
    const team = p.team ? `<div class="m-team"><b><i class="fa-solid fa-lock"></i> Só para a equipe</b><span>Parceira: <b>${esc(p.team.partner)}</b></span><span>Código original: <b>${esc(p.team.orig || '—')}</b></span>${p.team.page ? `<span>Página do PDF: <b>${esc(p.team.page)}</b></span>` : ''}${p.team.table ? `<span>Preço de tabela: <b>${esc(p.team.table)}</b></span>` : ''}</div>` : '';
    $('#m-product .m-body').innerHTML = `
      <div class="m-grid">
        <div class="m-media"><img src="${esc(p.image)}" alt="${esc(p.name)}" onclick="Motor.zoom(this.src)" onerror="this.onerror=null;this.src='${FALLBACK}'"><button type="button" class="m-zoom" onclick="Motor.zoom('${esc(p.image)}')"><i class="fa-solid fa-expand"></i> Ampliar</button></div>
        <div class="m-info">
          <div class="m-meta"><span class="m-code">CÓD. ${esc(p.code)}</span><span class="m-cat">${esc(p.category)}</span></div>
          <h2 class="m-title">${esc(g ? g.name : p.name)}</h2>
          <div class="m-price"><small>${g ? 'Preço desta opção' : 'Preço'}</small><strong>${priceLabel(p.price)}</strong>${g && g.priceMax > g.price ? `<em>Opções a partir de ${fmt(g.price)}</em>` : ''}</div>
          ${picker}
          <div class="m-buy">
            <div class="stepper"><button type="button" onclick="Motor.step(-1)">−</button><input id="m-qty" type="number" min="1" value="1" inputmode="numeric"><button type="button" onclick="Motor.step(1)">+</button></div>
            <button type="button" class="btn-primary m-add" onclick="Motor.add('${esc(p.code)}', +document.getElementById('m-qty').value || 1); Motor.close()"><i class="fa-solid fa-plus"></i> Adicionar ao orçamento</button>
          </div>
          <a class="m-wa" target="_blank" rel="noopener" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no produto ${p.code} - ${fullName(p)}.`)}"><i class="fa-brands fa-whatsapp"></i> Tirar dúvida sobre este produto</a>
          ${team}
          ${specRows ? `<h4 class="m-h">Especificações técnicas</h4><table class="m-specs">${specRows}</table>` : (p.specs ? `<h4 class="m-h">Especificações técnicas</h4><p class="m-desc">${esc(p.specs)}</p>` : '')}
          ${p.desc ? `<h4 class="m-h">Descrição</h4><p class="m-desc">${esc(p.desc)}</p>` : ''}
        </div>
      </div>`;
    show('#m-product');
  }
  function pick(gid, color, temp, keep) {
    const g = S.groups.get(gid); if (!g) return;
    const v = g.variants.find(x => x.color === color && x.temp === temp) || (keep === 'color' ? g.variants.find(x => x.color === color) : g.variants.find(x => x.temp === temp));
    if (v) openProduct(v.code);
  }
  function step(d) { const i = $('#m-qty'); i.value = Math.max(1, (+i.value || 1) + d); }
  function zoom(src) { $('#m-zoom img').src = src; show('#m-zoom'); }
  function show(sel) { $(sel).classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; }
  function close(sel) {
    (sel ? [$(sel)] : $$('.m-layer.is-open')).forEach(m => m && m.classList.remove('is-open'));
    if (!$$('.m-layer.is-open').length) document.documentElement.style.overflow = '';
  }
  function closeTop() { const open = $$('.m-layer.is-open'); if (open.length) close('#' + open[open.length - 1].id); }

  // ================== ORÇAMENTO ==================
  function loadCart() {
    let raw = []; try { raw = JSON.parse(store.get(CFG.cartKey, '[]')); } catch (e) {}
    S.cart = (raw || []).filter(i => S.byCode.has(i.code)).map(i => ({ code: i.code, qty: Number(i.qty) || 1 }));
    updateCart();
  }
  function saveCart() { store.set(CFG.cartKey, JSON.stringify(S.cart)); }
  function fullName(p) {
    if (!p.group) return p.name;
    const falta = [p.color, p.temp].filter(x => x && !norm(p.name).includes(norm(x)));
    return falta.length ? `${p.name} (${falta.join(' · ')})` : p.name;
  }
  function add(code, qty) {
    const p = S.byCode.get(code); if (!p) return;
    const it = p.group ? S.groups.get(p.group) : null;
    if (it && !qty && code === it.code && it.variants.length > 1 && !S.opts.addGroupDirect) { openProduct(code); return; }
    qty = qty || 1;
    const c = S.cart.find(i => i.code === code);
    if (c) c.qty += qty; else S.cart.push({ code, qty });
    saveCart(); updateCart(true);
    toast(`${p.code} adicionado ao orçamento`);
  }
  function setQty(code, qty) {
    const i = S.cart.findIndex(x => x.code === code);
    if (qty <= 0) { if (i >= 0) S.cart.splice(i, 1); }
    else if (i >= 0) S.cart[i].qty = qty; else S.cart.push({ code, qty });
    saveCart(); updateCart();
  }
  function cartTotals() {
    let total = 0, units = 0, unpriced = false;
    S.cart.forEach(i => { const p = S.byCode.get(i.code); units += i.qty; if (p.price > 0) total += p.price * i.qty; else unpriced = true; });
    return { total, units, unpriced, lines: S.cart.length };
  }
  function updateCart(bump) {
    const t = cartTotals();
    $$('[data-cart-count]').forEach(el => { el.textContent = t.units; el.classList.toggle('is-zero', !t.units); if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } });
    $$('[data-cart-total]').forEach(el => el.textContent = t.total > 0 ? fmt(t.total) : 'R$ 0,00');
    $$('[data-cart-lines]').forEach(el => el.textContent = `${t.lines} ${t.lines === 1 ? 'item' : 'itens'}`);
    $$('[data-cart-bar]').forEach(el => el.classList.toggle('is-on', t.units > 0));
    renderCartList();
    if (S.opts.onCart) S.opts.onCart(t);
  }
  function renderCartList() {
    const box = $('#m-cart .c-list'); if (!box) return;
    if (!S.cart.length) {
      box.innerHTML = `<div class="c-empty"><i class="fa-regular fa-clipboard"></i><p>Seu orçamento está vazio.</p><small>Escolha os produtos e toque em “Orçar”.</small></div>`;
    } else box.innerHTML = S.cart.map(i => {
      const p = S.byCode.get(i.code);
      return `<div class="c-item"><img src="${esc(thumbOf(p.image))}" alt="" onerror="__imgFb(this,'${esc(p.image)}')">
        <div class="c-info"><small>${esc(p.code)}</small><b>${esc(fullName(p))}</b><span>${p.price > 0 ? `${fmt(p.price)} un. · <strong>${fmt(p.price * i.qty)}</strong>` : 'Sob consulta'}</span></div>
        <div class="stepper sm"><button type="button" onclick="Motor.setQty('${esc(p.code)}', ${i.qty - 1})">−</button><input type="number" min="0" value="${i.qty}" onchange="Motor.setQty('${esc(p.code)}', +this.value)"><button type="button" onclick="Motor.setQty('${esc(p.code)}', ${i.qty + 1})">+</button></div></div>`;
    }).join('');
    const t = cartTotals();
    $('#m-cart .c-total').textContent = t.total > 0 ? fmt(t.total) : (S.cart.length ? 'Sob consulta' : 'R$ 0,00');
    $('#m-cart .c-note').hidden = !(t.unpriced && t.total > 0);
    $('#m-cart .c-clear').hidden = !S.cart.length;
  }
  function clearCart() { if (S.cart.length && confirm('Remover todos os itens do orçamento?')) { S.cart = []; saveCart(); updateCart(); } }
  function sendWhatsApp() {
    if (!S.cart.length) { toast('Adicione produtos ao orçamento primeiro'); return; }
    const name = ($('#c-name') || {}).value || '', obs = ($('#c-obs') || {}).value || '';
    let msg = `*SOLICITAÇÃO DE ORÇAMENTO — ${CFG.brandName.toUpperCase()}*\nData: ${new Date().toLocaleDateString('pt-BR')}\n`;
    if (name.trim()) msg += `*Cliente:* ${name.trim()}\n`;
    msg += `------------------------------------\n\n`;
    let total = 0, unp = false;
    S.cart.forEach((i, n) => {
      const p = S.byCode.get(i.code);
      msg += `${n + 1}. *[${p.code}]* ${fullName(p)}\n`;
      if (p.price > 0) { const sub = p.price * i.qty; total += sub; msg += `   Qtd: ${i.qty}x | Unit.: ${fmt(p.price)} | Subtotal: ${fmt(sub)}\n\n`; }
      else { unp = true; msg += `   Qtd: ${i.qty}x | Valor: sob consulta\n\n`; }
    });
    msg += `------------------------------------\n` + (total > 0 ? `*TOTAL ESTIMADO:* ${fmt(total)}${unp ? ' (+ itens sob consulta)' : ''}\n` : `*TOTAL:* sob consulta\n`);
    if (obs.trim()) msg += `\n*Obs:* ${obs.trim()}\n`;
    msg += `\nAguardo confirmação de disponibilidade.`;
    window.open(`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // ================== MODO EQUIPE (mesma senha / equipe.dat do site) ==================
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function teamLogin(pass, silent) {
    try {
      const pkg = await (await fetch(CFG.root + 'equipe.dat?t=' + Date.now())).json();
      const enc = new TextEncoder();
      const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(pkg.salt), iterations: pkg.it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const map = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(pkg.iv) }, key, b64(pkg.data))));
      S.team = map; store.set(CFG.teamKey, pass);
      S.products.forEach(p => { const t = map[p.code]; p.team = t ? { partner: t[0], orig: t[1], page: t[2], table: t[3] } : null; p.teamHay = p.team ? norm(p.team.orig + ' ' + p.team.partner) : ''; });
      S.groups.forEach(g => g.teamHay = g.variants.map(v => v.teamHay).join(' '));
      document.body.classList.add('is-team');
      if (!silent) toast('Modo equipe ativado');
      render();
    } catch (e) { store.del(CFG.teamKey); if (!silent) toast('Senha incorreta'); }
  }
  function initTeam() {
    const saved = store.get(CFG.teamKey, null);
    if (saved) teamLogin(saved, true);
    const ask = () => {
      if (!/^#equipe$/i.test(location.hash)) return;
      history.replaceState(null, '', location.pathname + location.search);
      if (S.team) return toast('Modo equipe já está ativo');
      const p = prompt('Senha da equipe:'); if (p) teamLogin(p.trim());
    };
    ask(); window.addEventListener('hashchange', ask);
  }
  function teamLogout() { S.team = null; store.del(CFG.teamKey); S.products.forEach(p => { p.team = null; p.teamHay = ''; }); document.body.classList.remove('is-team'); render(); toast('Modo equipe desativado'); }

  // ================== AVISOS ==================
  function toast(t) {
    let el = $('#m-toast');
    el.querySelector('span').textContent = t;
    el.classList.add('is-on'); clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 1900);
  }
  function fail(t, s) {
    const g = $(S.opts.grid || '[data-grid]');
    if (g) g.innerHTML = `<div class="m-fail"><i class="fa-solid fa-triangle-exclamation"></i><b>${esc(t)}</b><span>${esc(s)}</span><button class="btn-primary" onclick="location.reload()">Tentar novamente</button></div>`;
    $$('[data-skeleton]').forEach(e => e.remove());
  }

  // ================== ESTRUTURA COMUM (modal, orçamento, zoom, aviso) ==================
  function injectShell() {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="m-layer m-product-layer" id="m-product" onclick="if(event.target===this)Motor.close('#m-product')"><div class="m-panel"><button class="m-x" onclick="Motor.close('#m-product')" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button><div class="m-body"></div></div></div>
      <div class="m-layer m-zoom-layer" id="m-zoom" onclick="Motor.close('#m-zoom')"><img alt="Imagem ampliada"><button class="m-x" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="m-layer m-cart-layer" id="m-cart" onclick="if(event.target===this)Motor.close('#m-cart')"><aside class="c-panel">
        <header class="c-head"><div><h3>Meu orçamento</h3><small data-cart-lines>0 itens</small></div><div><button class="c-clear" onclick="Motor.clearCart()">Esvaziar</button><button class="m-x static" onclick="Motor.close('#m-cart')" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></div></header>
        <div class="c-list"></div>
        <footer class="c-foot">
          <div class="c-sum"><span>Total estimado</span><strong class="c-total">R$ 0,00</strong></div>
          <small class="c-note" hidden>Itens “sob consulta” não entram no total.</small>
          <input id="c-name" placeholder="Seu nome ou empresa (opcional)">
          <textarea id="c-obs" rows="2" placeholder="Observações: voltagem, temperatura, acabamento..."></textarea>
          <button class="btn-wa" onclick="Motor.sendWhatsApp()"><i class="fa-brands fa-whatsapp"></i> Enviar orçamento no WhatsApp</button>
          <small class="c-legal">Valores sujeitos a confirmação de estoque e condições comerciais.</small>
        </footer></aside></div>
      <button id="m-top" data-scroll-top aria-label="Voltar ao topo" title="Voltar ao topo"><i class="fa-solid fa-arrow-up"></i></button>
      <div id="m-toast"><i class="fa-solid fa-circle-check"></i><span></span></div>
      <div class="team-pill"><i class="fa-solid fa-user-lock"></i> Modo equipe <a href="${CFG.root}talao.html">Talão</a><button onclick="Motor.teamLogout()">Sair</button></div>`);
  }

  // Barra de apresentação: trocar de modelo e de logo (só nesta prévia)
  const MODELS = [['1-galeria', 'Galeria'], ['2-showroom', 'Showroom'], ['3-lojista', 'Portal do Lojista'], ['4-vitrine', 'Vitrine'], ['5-pedido-rapido', 'Pedido Rápido'], ['6-app', 'App'], ['7-hibrido', 'Híbrido']];
  function demoBar() {
    if (new URLSearchParams(location.search).has('limpo')) return;
    const i = MODELS.findIndex(m => m[0] === S.opts.id);
    const prev = MODELS[(i + MODELS.length - 1) % MODELS.length], next = MODELS[(i + 1) % MODELS.length];
    const keep = location.search.replace(/^\?/, '');
    const link = m => `${m[0]}.html${keep ? '?' + keep : ''}`;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="demo-bar" role="region" aria-label="Apresentação dos modelos">
        <a href="${link(prev)}" title="Modelo anterior"><i class="fa-solid fa-chevron-left"></i></a>
        <a href="index.html" class="demo-name" title="Ver todos os modelos"><b>${i + 1}/${MODELS.length}</b> ${MODELS[i][1]}</a>
        <a href="${link(next)}" title="Próximo modelo"><i class="fa-solid fa-chevron-right"></i></a>
        <span class="demo-sep"></span>
        ${S.opts.demoExtra || `<span class="demo-l">Logo</span>
        <button data-logo-opt="fr">FR</button><button data-logo-opt="frc">FR círculo</button><button data-logo-opt="duo">LumiFa | FR</button>`}
        <button class="demo-hide" title="Esconder" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>`);
    $$('[data-logo-opt]').forEach(b => b.onclick = () => setLogo(b.dataset.logoOpt));
    syncDemoBar();
  }
  function syncDemoBar() { $$('[data-logo-opt]').forEach(b => b.classList.toggle('is-on', b.dataset.logoOpt === S.logo)); }

  // ================== EVENTOS ==================
  function bind() {
    let t;
    document.addEventListener('input', e => {
      if (e.target.matches('[data-search]')) { S.q = e.target.value.trim(); $$('[data-search]').forEach(i => { if (i !== e.target) i.value = e.target.value; }); clearTimeout(t); t = setTimeout(render, 140); }
    });
    document.addEventListener('change', e => {
      const el = e.target;
      if (el.matches('[data-sort]')) { S.sort = el.value; render(); }
      if (el.matches('[data-facet]')) {
        const f = el.dataset.facet;
        if (f === 'price') S.price = el.value;
        if (f === 'color') el.checked ? S.colors.add(el.value) : S.colors.delete(el.value);
        if (f === 'temp') el.checked ? S.temps.add(el.value) : S.temps.delete(el.value);
        render();
      }
    });
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-cat],[data-open],[data-add],[data-open-cart],[data-theme-toggle],[data-unset],[data-reset],[data-more-btn],[data-set-cat],[data-qty-add],[data-scroll-top],[data-sort-btn]');
      if (!el) return;
      if (el.hasAttribute('data-cat')) { if (el.closest('[data-cats]') && el.closest('[data-cats]').dragged) return; setCat(el.dataset.cat); }
      else if (el.hasAttribute('data-set-cat')) setCat(el.dataset.setCat);
      else if (el.hasAttribute('data-open')) openProduct(el.dataset.open);
      else if (el.hasAttribute('data-add')) add(el.dataset.add);
      else if (el.hasAttribute('data-qty-add')) { const inp = el.parentElement.querySelector('input'); const q = Math.max(1, +inp.value || 1); add(el.dataset.qtyAdd, q); }
      else if (el.hasAttribute('data-open-cart')) { renderCartList(); show('#m-cart'); }
      else if (el.hasAttribute('data-theme-toggle')) toggleTheme();
      else if (el.hasAttribute('data-unset')) {
        const k = el.dataset.unset, v = el.dataset.val;
        if (k === 'q') S.q = ''; if (k === 'cat') S.cat = 'Todos'; if (k === 'price') S.price = null;
        if (k === 'color') S.colors.delete(v); if (k === 'temp') S.temps.delete(v);
        render();
      }
      else if (el.hasAttribute('data-reset')) reset();
      else if (el.hasAttribute('data-more-btn')) more();
      else if (el.hasAttribute('data-sort-btn')) { S.sort = el.dataset.sortBtn; render(); }
      else if (el.hasAttribute('data-scroll-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTop(); });
    window.addEventListener('scroll', () => { const b = $('#m-top'); if (b) b.classList.toggle('is-on', window.scrollY > 700); }, { passive: true });
    if ('IntersectionObserver' in window) {
      const sent = $('[data-more]');
      if (sent) new IntersectionObserver(en => { if (en.some(x => x.isIntersecting) && S.rendered < S.list.length) more(); }, { rootMargin: '1200px 0px' }).observe(sent);
    }
    // arrastar carrosséis de categoria com o mouse
    $$('[data-cats][data-drag]').forEach(box => {
      let down = false, sx = 0, sl = 0;
      box.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; box.dragged = false; sx = e.clientX; sl = box.scrollLeft; });
      window.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) box.dragged = true; if (box.dragged) box.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', () => { down = false; setTimeout(() => box.dragged = false, 0); });
      box.addEventListener('wheel', e => { if (box.scrollWidth <= box.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); box.scrollLeft += e.deltaY; }, { passive: false });
    });
  }
  function setCat(c) {
    S.cat = c; render();
    const anchor = $(S.opts.scrollAnchor || '[data-results]');
    if (anchor && S.opts.scrollOnCat !== false) {
      const y = anchor.getBoundingClientRect().top + window.scrollY - (S.opts.headerOffset ? S.opts.headerOffset() : 90);
      if (window.scrollY > y || S.opts.scrollOnCat === 'always') window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  function reset() { S.q = ''; S.price = null; S.colors.clear(); S.temps.clear(); S.sort = 'default'; setCat('Todos'); }

  function ready() {
    $$('[data-skeleton]').forEach(e => e.remove());
    render();
    initTeam();
    if (S.opts.onReady) S.opts.onReady(API);
  }

  // ================== API ==================
  const API = {
    init(opts) {
      S.opts = opts || {};
      if (opts.root) CFG.root = opts.root;
      if (opts.pageSize) CFG.pageSize = opts.pageSize;
      const qp = new URLSearchParams(location.search);
      S.logo = qp.get('logo') || store.get('modelos_logo', null, true) || opts.logo || 'duo';
      const savedTheme = store.get('modelos_tema_' + (opts.id || ''), null, true);
      let th = opts.theme || 'light';
      if (th === 'auto') { const ua = navigator.userAgent || ''; const phone = /Android|iPhone|iPad|iPod|Mobile/i.test(ua); th = phone && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
      setTheme(savedTheme || th, false);
      if (opts.brandName) CFG.brandName = opts.brandName;
      const go = () => { injectShell(); demoBar(); renderBrand(); bind(); load(); };
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
    },
    open: openProduct, pick, step, zoom, close, add, setQty, clearCart, sendWhatsApp, teamLogout, setCat, reset, render,
    get state() { return S; }, H, CFG, filtered, categories,
    // listas prontas para vitrines/carrosséis
    featured(n) { return S.items.filter(i => i.featured).sort((a, b) => a.rank - b.rank).slice(0, n || 12).map(view); },
    newest(n) { return S.items.filter(i => i.isNew).sort((a, b) => codeNumber(b.code) - codeNumber(a.code)).slice(0, n || 12); },
    byCat(c, n) { return S.items.filter(i => i.category === c).sort((a, b) => (a.rank - b.rank) || (a.order - b.order)).slice(0, n || 12); },
    catImage(c) { const it = S.items.filter(i => i.category === c).sort((a, b) => (a.rank - b.rank) || (a.order - b.order))[0]; return it ? thumbOf(it.image) : FALLBACK; }
  };
  window.Motor = API;
})();
