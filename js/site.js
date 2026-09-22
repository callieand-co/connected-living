/* =========================================================
   OFFLINE INDEX — site renderer
   Four screens on the approved design system:
   home (index.html) · the index (directory.html) · product (object.html) · setup (setup.html)
   ========================================================= */

const COLL = {
  phones:   { name: 'Phones',   c: '#DCFC73', v: '' },
  objects:  { name: 'Objects',  c: '#F06038', v: '' },
  tools:    { name: 'Tools',    c: '#8C9EFF', v: '' },
  workshop: { name: 'Workshop', c: '#000000', v: 'ink' },
  studios:  { name: 'Studios',  c: '#E1D2F3', v: '' },
  voices:   { name: 'Voices',   c: '#F9F8F3', v: 'paper' }
};
const ORDER = ['phones', 'objects', 'tools', 'workshop', 'studios', 'voices'];
const REP = { phones: 'light-phone-iii', objects: 'loop-earplugs', tools: 'are-na', workshop: 'uconsole', studios: 'kanso', voices: 'quiet-media' };
const NEON = ['#DCFC73', '#F06038', '#8C9EFF', '#E1D2F3'];
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(3, '0');
const params = () => new URLSearchParams(location.hash.replace(/^#/, ''));
const money = n => '$' + (n % 1 ? n.toFixed(2) : n.toLocaleString('en-US'));
const priceShort = p => p.price > 0 ? money(p.price) : (p.priceLabel || 'See maker').split(',')[0].trim();

let DB;
async function load() {
  const get = u => fetch(u).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const [p, m, md, s] = await Promise.all([get('data/products.json'), get('data/makers.json'), get('data/media.json'), get('data/setups.json')]);
  DB = { products: p.products || [], cats: p.categories || [], intents: p.intents || [], makers: m.makers || [], media: md.media || [], setups: s.setups || [] };
  DB.p = slug => DB.products.find(x => x.slug === slug);
  DB.intent = id => (DB.intents.find(i => i.id === id) || { label: id }).label;
  DB.blurb = id => (DB.cats.find(c => c.id === id) || {}).blurb || '';
}

/* ---------- saved (per-viewer convenience) ---------- */
const SAVED = (() => { try { return new Set(JSON.parse(localStorage.getItem('oi-saved') || '[]')); } catch (e) { return new Set(); } })();
function persistSaved() { try { localStorage.setItem('oi-saved', JSON.stringify([...SAVED])); } catch (e) {} paintSaved(); }
function paintSaved() { const el = document.getElementById('savedCount'); if (el) el.textContent = `Saved (${SAVED.size})`; }
function wireSaves(root) {
  (root || document).querySelectorAll('.save[data-slug]').forEach(b => {
    b.setAttribute('aria-pressed', SAVED.has(b.dataset.slug));
    b.onclick = e => { e.preventDefault(); e.stopPropagation();
      SAVED.has(b.dataset.slug) ? SAVED.delete(b.dataset.slug) : SAVED.add(b.dataset.slug);
      b.setAttribute('aria-pressed', SAVED.has(b.dataset.slug)); persistSaved(); };
  });
}

/* ---------- the pouch: every placeholder product, packaged like a statement object ---------- */
function pouch(p, extraStyle) {
  const k = COLL[p.category] || COLL.phones;
  const deco = ['tools', 'studios', 'voices'].includes(p.category)
    ? '<span class="p-lines"><i></i><i></i><i></i></span>'
    : `<span class="p-dots">${'<i></i>'.repeat(1 + (p.index % 3))}</span>`;
  return `<span class="pouch ${k.v}" style="--c:${k.c};${extraStyle || ''}"><span class="p-name">${esc(p.name.toLowerCase())}</span><span class="p-sub">${esc(p.maker)}</span>${deco}</span>`;
}
const plate = (p, shot) => `<span class="plate"><span class="floor"></span><span class="ui shot">${shot}</span><span class="ui idx">${pad(p.index)}</span>${pouch(p)}</span>`;

function card(p) {
  return `<a class="card lift" href="object.html#i=${p.slug}">
    ${plate(p, 'Shot 01 &middot; 4:5')}
    <span class="cap"><span class="n">${esc(p.name)}</span><span class="price">${esc(priceShort(p))}</span>
    <span class="ui mk">${esc(p.maker)}</span><span class="ui ver">${esc(COLL[p.category].name)}</span></span>
  </a>`;
}

const setupTotal = s => s.pieces.reduce((n, x) => n + ((DB.p(x.slug) || {}).price || 0), 0);
const setupUnpriced = s => s.pieces.filter(x => !((DB.p(x.slug) || {}).price > 0)).length;

function setupCard(s) {
  const ps = s.pieces.map(x => DB.p(x.slug)).filter(Boolean);
  return `<a class="setup-card" href="setup.html#s=${s.slug}">
    <span class="ui dim">Look ${pad(s.index)} &middot; ${ps.length} pieces</span>
    <span class="mini-pouches" aria-hidden="true">${ps.map(p => `<span style="--c:${COLL[p.category].c}"></span>`).join('')}</span>
    <span class="d-m">${esc(s.title)}</span>
    <span class="who">${esc(s.who)}</span>
    <span class="foot-row"><span class="ui">${money(setupTotal(s))}${setupUnpriced(s) ? ' +' : ''}</span><span class="ui dim">Try it on &rarr;</span></span>
  </a>`;
}

/* ---------- chrome ---------- */
function chrome() {
  const nav = document.body.dataset.nav;
  const cur = h => nav === h ? ' aria-current="page"' : '';
  document.getElementById('top').outerHTML = `
  <header class="topbar">
    <nav class="l" aria-label="Primary"><a class="ui" href="directory.html"${cur('index')}>&#9656; Index</a><a class="ui" href="./#collections">Collections</a><a class="ui" href="setup.html#s=night-out"${cur('setups')}>Fitting Room</a></nav>
    <a class="mark" href="./">Connected Living</a>
    <div class="r"><a class="ui" href="directory.html">Search</a><span class="ui" id="savedCount">Saved (0)</span><button class="ui" id="themeBtn">Light / Dark</button></div>
  </header>`;
  document.getElementById('foot').outerHTML = `
  <footer class="foot"><div class="wrap">
    <div class="foot-cols">
      <div><div class="h">Collections</div><ul>${ORDER.map(k => `<li><a href="directory.html#c=${k}">${COLL[k].name}</a></li>`).join('')}</ul></div>
      <div><div class="h">Shop</div><ul><li><a href="directory.html">The index</a></li><li><a href="setup.html#s=night-out">Fitting Room</a></li><li>Saved</li></ul></div>
      <div><div class="h">Fitting Room</div><ul>${DB.setups.map(s => `<li><a href="setup.html#s=${s.slug}">${esc(s.title.replace(/\.$/, ''))}</a></li>`).join('')}</ul></div>
      <div><div class="h">Makers</div><ul><li>Submit your work</li><li>Get featured</li></ul></div>
      <div><div class="h">Index</div><ul><li class="num">${DB.products.length} entries</li><li>${ORDER.length} collections</li><li>Est. 2026</li></ul></div>
      <div><div class="h">Studio</div><ul><li>Online &amp; IRL</li><li>Los Angeles</li></ul></div>
    </div>
    <div class="giant" aria-hidden="true">Connected Living</div>
    <div class="foot-bottom"><span class="ui dim">&copy; 2026 Connected Living &middot; Curated by DISC</span><span class="ui">DISC = Digital Independence Supply Co.</span></div>
  </div></footer>`;
  paintSaved();
  const root = document.documentElement;
  document.getElementById('themeBtn').onclick = () => {
    const dark = root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'light' : 'dark');
  };
}

const marquee = words => `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[...words, ...words].map(w => `<span>${esc(w)}</span>`).join('')}</div></div>`;
const secHead = (label, title, why) => `<div class="sec-head"><span class="ui dim">${label}</span><div><h2 class="d-l">${title}</h2>${why ? `<p class="why">${why}</p>` : ''}</div></div>`;

/* ---------- HOME ---------- */
function pageHome() {
  const featured = ['light-flip', 'loop-earplugs', 'are-na'].map(DB.p).filter(Boolean);
  document.getElementById('main').innerHTML = `
  <section class="hero"><div class="wrap">
    <h1 class="sr-only">Connected Living, curated by DISC</h1>
    <div class="hero-word d-xl" aria-hidden="true"><span class="spray b">Connected Living</span><span class="spray a">Connected Living</span><span class="crisp">Connected Living</span></div>
    <p class="ui" style="margin-top:18px">Curated by DISC</p>
    <div class="thesis">
      <h2 class="d-m">Less detox, more design.</h2>
      <div>
        <p class="hero-lede">Phones that stop, objects that do one thing, software that gives time back, and the people building all of it. Curated like a store, and arranged into whole lives you can try on.</p>
        <div class="hero-cta"><a class="btn solid" href="directory.html">Browse the index</a><a class="btn" href="setup.html#s=night-out">Enter the fitting room</a></div>
      </div>
    </div>
    <div class="hero-meta">
      <div><span class="ui dim">Entries</span><span class="ui num">${DB.products.length}</span></div>
      <div><span class="ui dim">Collections</span><span class="ui num">${ORDER.length}</span></div>
      <div><span class="ui dim">Looks</span><span class="ui num">${DB.setups.length}</span></div>
      <div><span class="ui dim">Est.</span><span class="ui num">2026 &middot; Los Angeles</span></div>
    </div>
  </div></section>
  ${marquee(ORDER.map(k => COLL[k].name).concat(['Less detox, more design']))}
  <section class="sec" id="collections"><div class="wrap">
    ${secHead('Collections', 'Six collections, one shelf.', 'Four wear a neon. Workshop and Voices wear black and white, like raw stock and newsprint.')}
    <div class="colls">${ORDER.map(k => {
      const p = DB.p(REP[k]); const n = DB.products.filter(x => x.category === k).length;
      return `<a class="coll lift" href="directory.html#c=${k}">
        <span class="plate"><span class="floor"></span><span class="ui shot">Collection</span><span class="ui idx">${pad(n)}</span>${p ? pouch(p) : ''}</span>
        <span class="coll-cap"><span><span class="d-m">${COLL[k].name}</span><p class="blurb">${esc(DB.blurb(k))}</p></span><span class="ui"><span>${pad(n)}</span><span class="dim">entries</span></span></span>
      </a>`; }).join('')}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    ${secHead('Shop', 'New on the shelf.', 'Picked this week. Every link goes straight to the maker, and every price is either read off their store or marked for you to check.')}
    <div class="cards">${featured.map(card).join('')}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    ${secHead('Fitting Room', 'Try on a life.', 'Nobody lives with one object. These are whole arrangements (a phone, the things that take its jobs, and where it sleeps) with the bill at the bottom.')}
    <div class="setups">${DB.setups.slice(0, 3).map(setupCard).join('')}</div>
  </div></section>`;
}

/* ---------- THE INDEX ---------- */
function pageIndex() {
  const st = { c: params().get('c') || 'all', n: params().get('n') || 'any', q: '', sort: 'index' };
  const main = document.getElementById('main');
  const count = (k, v) => DB.products.filter(p => k === 'c' ? p.category === v : p.intents.includes(v)).length;

  main.innerHTML = `
  <section class="page-head"><div class="wrap" id="head"></div></section>
  <div class="wrap"><div class="dir">
    <aside class="facets" aria-label="Filters">
      <input class="search" id="q" type="search" placeholder="Search the index" aria-label="Search the index">
      <div class="facet" id="fc"><span class="ui dim">Collection</span>
        <button data-k="c" data-v="all"><span class="lbl">All</span><span class="n">${pad(DB.products.length)}</span></button>
        ${ORDER.map(k => `<button data-k="c" data-v="${k}"><span class="lbl"><i style="--c:${COLL[k].c}"></i>${COLL[k].name}</span><span class="n">${pad(count('c', k))}</span></button>`).join('')}
      </div>
      <div class="facet" id="fi"><span class="ui dim">I want to</span>
        <button data-k="n" data-v="any"><span class="lbl">Anything</span><span class="n">${pad(DB.products.length)}</span></button>
        ${DB.intents.map(i => `<button data-k="n" data-v="${i.id}"><span class="lbl">${esc(i.label)}</span><span class="n">${pad(count('n', i.id))}</span></button>`).join('')}
      </div>
    </aside>
    <div class="results">
      <div class="results-bar"><span class="ui" id="rc"></span>
        <select id="sort" aria-label="Sort"><option value="index">Index order</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option><option value="az">A&ndash;Z</option></select>
      </div>
      <div id="grid"></div>
    </div>
  </div></div>`;

  main.querySelectorAll('.facet button').forEach(b => b.onclick = () => { st[b.dataset.k] = b.dataset.v; draw(); });
  document.getElementById('q').oninput = e => { st.q = e.target.value.trim().toLowerCase(); draw(); };
  document.getElementById('sort').onchange = e => { st.sort = e.target.value; draw(); };

  function draw() {
    main.querySelectorAll('.facet button').forEach(b => b.setAttribute('aria-pressed', st[b.dataset.k] === b.dataset.v));
    const k = COLL[st.c];
    const spray = k && NEON.includes(k.c) ? k.c : null;
    document.getElementById('head').innerHTML = `
      <span class="ui dim">${k ? 'Collection' : 'The index'}</span>
      <div class="hero-word d-l" style="margin-top:14px">
        ${spray ? `<span class="spray a" aria-hidden="true" style="color:${spray}">${k.name}</span>` : ''}
        <span class="crisp">${k ? `${k.name}.` : 'Every object, on one shelf.'}</span>
      </div>
      <p class="why">${esc(k ? DB.blurb(st.c) : 'Phones, objects, software, studios and voices. Filter by what you want to change, not by what it is.')}</p>`;

    let list = DB.products.filter(p => (st.c === 'all' || p.category === st.c) && (st.n === 'any' || p.intents.includes(st.n)) &&
      (!st.q || `${p.name} ${p.maker} ${p.summary}`.toLowerCase().includes(st.q)));
    const S = { index: (a, b) => a.index - b.index, low: (a, b) => (a.price || 1e9) - (b.price || 1e9), high: (a, b) => b.price - a.price, az: (a, b) => a.name.localeCompare(b.name) };
    list.sort(S[st.sort]);
    document.getElementById('rc').textContent = `${pad(list.length)} of ${pad(DB.products.length)} entries`;
    document.getElementById('grid').innerHTML = list.length
      ? `<div class="cards">${list.map(card).join('')}</div>`
      : `<div class="empty"><span class="d-m">Nothing here yet.</span><p class="muted">No entry matches that combination. Try another collection, or clear the search.</p></div>`;
    const h = new URLSearchParams(); if (st.c !== 'all') h.set('c', st.c); if (st.n !== 'any') h.set('n', st.n);
    history.replaceState(null, '', location.pathname + (h.toString() ? '#' + h : ''));
  }
  draw();
}

/* ---------- PRODUCT ---------- */
function pageObject() {
  const p = DB.p(params().get('i')) || DB.products[0];
  document.title = `${p.name} — Connected Living`;
  const k = COLL[p.category];
  const specs = Object.entries(p.specs || {}).slice(0, 3);
  const related = DB.products.filter(x => x.slug !== p.slug)
    .map(x => ({ x, s: (x.category === p.category ? 2 : 0) + x.intents.filter(i => p.intents.includes(i)).length }))
    .sort((a, b) => b.s - a.s || a.x.index - b.x.index).slice(0, 3).map(o => o.x);
  const media = DB.media.filter(m => (m.products || []).includes(p.slug) || (m.tags || []).some(t => p.intents.includes(t))).slice(0, 4);
  const inSetups = DB.setups.filter(s => s.pieces.some(x => x.slug === p.slug) || (s.extras || []).includes(p.slug));

  document.getElementById('main').innerHTML = `
  <section class="pdp-wrap"><div class="pdp">
    <div class="pdp-meta">
      <div class="crumb"><a class="ui dim" href="directory.html">Index</a><span class="ui dim">/</span><a class="ui" href="directory.html#c=${p.category}">${k.name}</a></div>
      <h1>${esc(p.name)}</h1>
      <dl class="kv">
        <div><dt>Collection</dt><dd>${k.name}</dd></div>
        <div><dt>Made by</dt><dd>${esc(p.maker)}</dd></div>
        ${specs.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}
        <div><dt>Intent</dt><dd>${esc(DB.intent(p.intents[0]))}</dd></div>
      </dl>
      ${p.caution ? `<div><button class="disclose" aria-expanded="true" id="fb">Fine print</button><p class="fine" id="ft" style="margin-top:8px">${esc(p.caution)}</p></div>` : ''}
      <div class="pdp-buy">
        <span class="amt">${esc(priceShort(p))}</span>
        <a class="btn solid" style="justify-content:center" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Buy</a>
        <button class="save" data-slug="${p.slug}" aria-label="Save ${esc(p.name)}">${HEART}</button>
      </div>
      <span class="ui buy-note">${p.priceVerified ? 'Price read off the maker&rsquo;s store' : 'Direct to maker &middot; check current price'}</span>
    </div>
    <div class="pdp-main"><span class="plate lift"><span class="floor"></span><span class="ui shot">Shot 01 &middot; front &middot; on tile</span><span class="ui idx">${pad(p.index)}</span>${pouch(p)}</span></div>
    <div class="pdp-side">
      <span class="plate"><span class="floor"></span><span class="ui shot">Shot 02</span>${pouch(p, 'transform:translate(-50%,-52%) rotate(8deg)')}</span>
      <div class="alt">
        <span class="ui dim">Collection</span>
        <span class="chip fill" style="--c:${k.c};${k.v === 'ink' ? 'color:#F9F8F3;border-color:var(--edge)' : ''};justify-self:start">${k.name}</span>
        <span class="ui dim">${inSetups.length ? `In ${inSetups.length} look${inSetups.length > 1 ? 's' : ''}` : 'Not in a look yet'}</span>
      </div>
    </div>
  </div></section>
  <div class="wrap"><div class="pitch">
    <span class="ui dim">The pitch</span>
    <div><h2 class="d-m">${esc(p.summary)}</h2><p class="body">${esc(p.argument)}</p>
    ${inSetups.length ? `<div class="in-setups" style="margin-top:22px">${inSetups.map(s => `<a class="chip" style="--c:var(--ink)" href="setup.html#s=${s.slug}"><i></i>${esc(s.title.replace(/\.$/, ''))}</a>`).join('')}</div>` : ''}</div>
  </div></div>
  ${marquee(Array(6).fill('You may also like'))}
  <div class="wrap" style="padding-block:0 0"><div class="cards" style="border-top:0">${related.map(card).join('')}</div></div>
  ${media.length ? `<section class="sec" style="border-bottom:0"><div class="wrap">
    ${secHead('Press', 'Seen elsewhere.', 'Coverage and creators talking about this corner of the index. Links open at the source.')}
    <div class="seen">${media.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">
      ${m.image ? `<img src="${esc(m.image)}" alt="" loading="lazy">` : `<span style="width:120px;aspect-ratio:16/10;border:1px solid var(--edge);display:grid;place-items:center" class="ui dim">${esc(m.platform)}</span>`}
      <span><span class="ui dim">${esc(m.platform)}</span><br><span class="t">${esc(m.title)}</span></span>
      <span class="ui dim">${esc(m.published || '')}</span></a>`).join('')}</div>
  </div></section>` : ''}`;

  const fb = document.getElementById('fb'), ft = document.getElementById('ft');
  if (fb) fb.onclick = () => { const o = fb.getAttribute('aria-expanded') !== 'true'; fb.setAttribute('aria-expanded', o); ft.hidden = !o; };
  window.onhashchange = () => { pageObject(); wireSaves(); scrollTo(0, 0); };
}

/* ---------- SETUP (the fitting room) ---------- */
function pageSetup() {
  const s = DB.setups.find(x => x.slug === params().get('s')) || DB.setups[0];
  document.title = `${s.title.replace(/\.$/, '')} — Connected Living`;
  const pieces = s.pieces.map(x => ({ ...x, p: DB.p(x.slug) })).filter(x => x.p);
  const extras = (s.extras || []).map(DB.p).filter(Boolean);
  const glow = (pieces.map(x => COLL[x.p.category].c).find(c => NEON.includes(c))) || NEON[0];
  const others = DB.setups.filter(x => x.slug !== s.slug);

  const slot = (p, role, on) => `<button class="slot lift${on ? ' on' : ''}" data-price="${p.price || 0}" aria-pressed="${on}">
      <span class="plate"><span class="floor"></span>${pouch(p)}</span>
      <span class="tag"><span>${esc(role)}</span><span>${esc(priceShort(p))}</span></span></button>`;

  document.getElementById('main').innerHTML = `
  <section class="setup-head"><span class="spray-blob" style="background:${glow}"></span><div class="wrap">
    <span class="ui dim">Fitting Room &middot; Look ${pad(s.index)} of ${pad(DB.setups.length)}</span>
    <h1 class="d-l" style="margin-top:14px">${esc(s.title)}</h1>
    <p class="who">${esc(s.who)}</p>
    <p class="dek">${esc(s.dek)}</p>
    <div class="meta-row">
      <div><span class="ui dim">Pieces</span><span class="ui num">${pad(pieces.length)}</span></div>
      <div><span class="ui dim">Total</span><span class="ui num">${money(setupTotal(s))}</span></div>
      <div><span class="ui dim">Unpriced</span><span class="ui num">${pad(setupUnpriced(s))}</span></div>
    </div>
  </div></section>

  <section class="room-sec"><div class="wrap">
    <div class="room" id="room" style="--room-c:${glow}">
      <div class="room-title"><span class="t">${esc(s.title.replace(/\.$/, ''))} &ndash; Fitting Room</span><span class="ctl" aria-hidden="true"><i>_</i><i>&#9633;</i><i>&times;</i></span></div>
      <div class="room-menu"><nav aria-label="Fitting room menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>S</u>tack</span><span><u>H</u>elp</span></nav>
        <span class="room-search">&#9906; ${esc(s.who.toLowerCase().replace(/[.,].*$/, ''))}</span></div>
      <div class="room-body">
        <div>
          <div class="tools" role="toolbar" aria-label="Tools">
            <button aria-pressed="true" aria-label="Select">&#8598;</button><button aria-label="Marquee">&#11034;</button>
            <button aria-label="Add">+</button><button aria-label="Text" style="font-family:var(--display);font-size:22px">T</button>
            <button aria-label="Favourite">&#9734;</button><button aria-label="Brush">&#9998;</button>
            <button aria-label="Search">&#9906;</button><button aria-label="Shape">&#9711;</button>
          </div>
          <div class="fg-bg" aria-hidden="true"><i></i><i></i></div>
        </div>
        <div class="canvas">
          <div class="stage"><div class="select-box"><div class="avatar" aria-label="Avatar placeholder">
            <span class="plumbob" aria-hidden="true"></span><span class="av-head"></span><span class="av-body"></span><span class="av-feet"></span>
          </div></div></div>
          <div class="closet" id="closet">
            ${pieces.map(x => slot(x.p, x.role, true)).join('')}
            ${extras.map(p => slot(p, 'Try instead', false)).join('')}
          </div>
        </div>
      </div>
      <div class="room-foot"><span></span>
        <div style="display:grid;gap:8px">
          <div class="scroll" aria-hidden="true"><b>&#9664;</b><i></i></div>
          <div class="palette" id="palette" role="group" aria-label="Room colour">
            ${['#DCFC73', '#F06038', '#8C9EFF', '#E1D2F3', '#000000', '#3E433C', '#F9F8F3', '#054FF0', '#A196F8', '#EEFF00']
              .map(c => `<button style="--c:${c}" data-c="${c}" aria-pressed="${c === glow}" aria-label="Colour ${c}"></button>`).join('')}
          </div>
        </div>
        <div class="status"><span id="slotCount"></span><span class="tot" id="total"></span><span class="dim" id="unpriced"></span></div>
      </div>
    </div>
  </div></section>

  <div class="wrap">
    <div class="story-block"><span class="ui dim">Situation</span><div><h2 class="d-m">Why it&rsquo;s hard.</h2><p>${esc(s.situation)}</p></div></div>
    <div class="story-block"><span class="ui dim">Kit</span><div><h2 class="d-m">What&rsquo;s in the kit.</h2>
      <div class="kit">${pieces.map(x => `<a href="object.html#i=${x.p.slug}">
        <span class="sw-mini" style="--c:${COLL[x.p.category].c}"></span>
        <span class="ui role">${esc(x.role)}</span>
        <span class="txt"><span class="n">${esc(x.p.name)}</span><br><span class="why">${esc(x.why)}</span></span>
        <span class="p">${esc(priceShort(x.p))}</span></a>`).join('')}</div>
      <div class="kit-total"><span class="ui dim">Total, before unpriced pieces</span><span class="tot num">${money(setupTotal(s))}</span></div>
    </div></div>
    <div class="story-block"><span class="ui dim">Trade-offs</span><div><h2 class="d-m">What breaks.</h2><p>${esc(s.breaks)}</p></div></div>
    <div class="story-block" style="border-bottom:0"><span class="ui dim">Next</span><div><h2 class="d-m">What we&rsquo;d change.</h2><p>${esc(s.change)}</p></div></div>
  </div>
  ${marquee(Array(6).fill('More looks'))}
  <div class="wrap" style="padding-bottom:56px"><div class="setups${others.length === 2 ? ' two' : ''}" style="border-top:0">${others.map(setupCard).join('')}</div></div>`;

  const slots = [...document.querySelectorAll('#closet .slot')];
  const tally = () => {
    const on = slots.filter(b => b.classList.contains('on'));
    const sum = on.reduce((n, b) => n + (parseFloat(b.dataset.price) || 0), 0);
    const un = on.filter(b => !(parseFloat(b.dataset.price) > 0)).length;
    document.getElementById('slotCount').textContent = `${on.length} of ${slots.length} pieces on`;
    document.getElementById('total').textContent = money(sum);
    document.getElementById('unpriced').textContent = un ? `+ ${un} unpriced` : 'all priced';
  };
  slots.forEach(b => b.onclick = () => { b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); tally(); });
  tally();
  const room = document.getElementById('room');
  document.querySelectorAll('#palette button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#palette button').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); room.style.setProperty('--room-c', b.dataset.c);
  });
  window.onhashchange = () => { pageSetup(); scrollTo(0, 0); };
}

/* ---------- boot ---------- */
const PAGES = { home: pageHome, index: pageIndex, object: pageObject, setup: pageSetup };
load().then(() => {
  chrome();
  (PAGES[document.body.dataset.page] || pageHome)();
  wireSaves();
}).catch(err => {
  console.error(err);
  document.getElementById('main').innerHTML = '<div class="wrap" style="padding:60px 0"><p class="ui">The catalogue could not load. Serve this folder over http:// rather than opening the file directly.</p></div>';
});
