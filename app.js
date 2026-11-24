/* Slip: animated quotes, proposals & invoices. No build step, no server.
   The whole document is compressed into the URL hash (#q=…), so any static host works. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const Scenes = window.SlipScenes;
  const STORE = 'slip:draft:v1';
  const SETTINGS = 'slip:settings:v1';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CURRENCIES = [
    ['USD', 'US Dollar'], ['EUR', 'Euro'], ['GBP', 'British Pound'], ['INR', 'Indian Rupee'],
    ['AUD', 'Australian Dollar'], ['CAD', 'Canadian Dollar'], ['NZD', 'New Zealand Dollar'],
    ['SGD', 'Singapore Dollar'], ['AED', 'UAE Dirham'], ['JPY', 'Japanese Yen'],
    ['CHF', 'Swiss Franc'], ['SEK', 'Swedish Krona'], ['ZAR', 'South African Rand'], ['BRL', 'Brazilian Real'],
  ];
  const SWATCHES = ['#2f7bff', '#4f46e5', '#0891b2', '#059669', '#65a30d', '#d97706', '#e11d48', '#c026d3', '#18181b'];

  /* ---------- small utils ---------- */
  const pad = n => String(n).padStart(2, '0');
  const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const parseISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
  const fmtDate = s => { const d = parseISO(s); return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'; };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  };

  const fmtCache = {};
  function money(n, cur) {
    try {
      fmtCache[cur] ||= new Intl.NumberFormat(undefined, { style: 'currency', currency: cur });
      return fmtCache[cur].format(n);
    } catch { return `${cur} ${(+n).toFixed(2)}`; }
  }
  const qty = n => (+n).toLocaleString(undefined, { maximumFractionDigits: 3 });

  /* ---------- colour ---------- */
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  function luminance(hex) {
    const lin = c => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    const [r, g, b] = hexRgb(hex).map(v => lin(v / 255));
    return .2126 * r + .7152 * g + .0722 * b;
  }
  const onAccent = hex => (luminance(hex) > .42 ? '#111111' : '#ffffff');
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
  function shiftHue(hex, deg, light) {
    let [r, g, b] = hexRgb(hex).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    h = (h + deg + 360) % 360;
    const L = Math.min(.8, l + light), C = (1 - Math.abs(2 * L - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L - C / 2;
    const [R, G, Bv] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
    return rgbHex([R + m, G + m, Bv + m].map(v => v * 255));
  }
  function accentVars(hex) {
    const on = onAccent(hex);
    const ink = on === '#111111' ? mix(hex, '#000000', .45) : hex;
    return `--accent:${hex};--accent2:${shiftHue(hex, 34, .08)};--on-accent:${on};--accent-ink:${ink}`;
  }
  function applyRootAccent(hex) {
    accentVars(hex).split(';').forEach(p => { const [k, v] = p.split(':'); document.documentElement.style.setProperty(k, v); });
  }
  const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  /* ---------- data model ---------- */
  function defaults() {
    const y = new Date().getFullYear();
    return {
      layout: 'proposal', type: 'quote', number: `Q-${y}-001`, issued: iso(), due: iso(30),
      currency: 'USD', tax: 0, discount: 0, color: SWATCHES[0], logo: '', banner: null,
      from: { name: 'Studio North', tagline: 'Design · Build · Grow', email: 'hello@studionorth.co', details: '12 Harbour Street, Lisbon\n+351 912 345 678' },
      to: { name: 'Acme Corporation', contact: 'Jordan Lee', email: 'jordan@acme.com', details: '400 Market Street\nSan Francisco, CA' },
      intro: 'Thanks for the great conversation last week. Below is how we’d approach the project, section by section, with timelines and costs for each.',
      items: [
        { d: 'Website redesign', q: 1, r: 1179, t: '2.5 weeks', x: 'Homepage update\nService page update\n11 sub-service pages\n---\n13 pages in total, each with content, UI and development', m: null },
        { d: 'Flyer update', q: 1, r: 55, t: '3-4 days', x: 'Redesign of the entire flyer to fit all services and sub-services in the most efficient way', m: null },
        { d: 'Brand identity refresh', q: 1, r: 640, t: '1.5 weeks', x: 'Logo refinement and icon\nColour palette and typography\nOne-page brand guidelines', m: null },
      ],
      notes: '50% advance payment is required to start the project. The remaining 50% is due on delivery of all agreed deliverables.\nCorrections or revisions beyond the agreed scope are charged separately.',
    };
  }

  const str = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
  const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0; };
  const isoOr = v => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
  /* A media/image source we are willing to put in src="" */
  function safeSrc(v, kind) {
    if (typeof v !== 'string') return '';
    if (/^https:\/\/[^\s"'<>\\]+$/i.test(v) && v.length < 2048) return v;
    if (/^media\/[\w\-./ ]+$/i.test(v) && !v.includes('..')) return v;
    if (/^local:[a-z0-9]{6,20}$/.test(v)) return v;
    if (kind === 'img' && v.length < 600000 && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(v)) return v;
    return '';
  }
  /* Framing for an image/video: focus point (x, y in %) and zoom (1-3). Default = centred, no zoom. */
  function safeFrame(f) {
    if (!f || typeof f !== 'object') return null;
    const c = (v, lo, hi, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
    const o = { x: Math.round(c(f.x, 0, 100, 50) * 10) / 10, y: Math.round(c(f.y, 0, 100, 50) * 10) / 10, z: Math.round(c(f.z, 1, 3, 1) * 100) / 100 };
    return o.x === 50 && o.y === 50 && o.z === 1 ? null : o;
  }
  /* A link we are willing to put in href="": https only */
  const safeLink = v => (typeof v === 'string' && v.length < 2048 && /^https:\/\/[^\s"'<>\\]+$/i.test(v.trim()) ? v.trim() : '');
  const linkHost = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'Open link'; } };
  const frameStyle = f => (f ? ` style="object-position:${f.x}% ${f.y}%;transform:scale(${f.z});transform-origin:${f.x}% ${f.y}%"` : '');
  function safeMedia(m) {
    if (!m || typeof m !== 'object') return null;
    switch (m.k) {
      case 'none': return { k: 'none' };
      case 'scene': return Scenes.IDS.has(m.v) ? { k: 'scene', v: m.v } : null;
      case 'yt': return /^[\w-]{6,15}$/.test(m.v) ? { k: 'yt', v: m.v } : null;
      case 'vimeo': return /^\d{4,12}$/.test(m.v) ? { k: 'vimeo', v: m.v } : null;
      case 'img': case 'vid': {
        const v = safeSrc(m.v, m.k);
        if (!v) return null;
        const o = { k: m.k, v };
        const p = safeSrc(m.p, 'img'); if (p) o.p = p;
        if (m.c) o.c = str(m.c, 80);
        const f = safeFrame(m.f); if (f) o.f = f;
        return o;
      }
      default: return null;
    }
  }
  /* Everything coming from a link or storage goes through here: never trust the hash. */
  function normalize(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const f = r.from || {}, t = r.to || {};
    return {
      layout: r.layout === 'proposal' ? 'proposal' : 'classic',
      type: r.type === 'invoice' ? 'invoice' : 'quote',
      number: str(r.number, 40),
      issued: isoOr(r.issued), due: isoOr(r.due),
      currency: CURRENCIES.some(c => c[0] === r.currency) ? r.currency : 'USD',
      tax: num(r.tax, 0, 100), discount: num(r.discount, 0, 100),
      look: r.look === 'editorial' ? 'editorial' : '',   // proposal styling: '' = soft (original), 'editorial' = paper, ink and accent-coloured mono numbers
      noTotal: r.noTotal === true,   // separate services: no combined total, and unpriced sections show no price
      color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color.toLowerCase() : SWATCHES[0],
      logo: safeSrc(r.logo, 'img').startsWith('local:') ? '' : (r.logo && String(r.logo).length < 160000 ? safeSrc(r.logo, 'img') : ''),
      banner: safeMedia(r.banner),
      from: { name: str(f.name, 80), tagline: str(f.tagline, 80), email: str(f.email, 120), details: str(f.details, 300) },
      to: { name: str(t.name, 80), contact: str(t.contact, 80), email: str(t.email, 120), details: str(t.details, 300) },
      intro: str(r.intro, 1200),
      items: (Array.isArray(r.items) ? r.items : []).slice(0, 60).map(it => {
        it = it && typeof it === 'object' ? it : {};
        const o = { d: str(it.d, 200), q: num(it.q, 0, 1e7), r: num(it.r, 0, 1e11), t: str(it.t, 40), x: str(it.x, 1500), m: safeMedia(it.m) };
        const r2 = num(it.r2, 0, 1e11); if (r2 > o.r) o.r2 = r2;   // price range: r is "from", r2 is "to"
        if (Array.isArray(it.g) && it.g.length) {                   // more references on a visual page
          o.g = it.g.slice(0, 8).map(x => { x = x && typeof x === 'object' ? x : {}; const r = { m: safeMedia(x.m), u: str(x.u, 2048), c: str(x.c, 80) }; if (x.t) r.t = str(x.t, 80); return r; });
          if (['grid', 'strip', 'bento'].includes(it.gl)) o.gl = it.gl;
        }
        if (it.v === true) o.v = true;            // visual page: full-page image, video or animation between sections
        if (it.u) o.u = str(it.u, 2048);          // optional reference link (checked again with safeLink when shown)
        return o;
      }),
      notes: str(r.notes, 1500),
    };
  }

  const hiRate = it => (it.r2 > it.r ? it.r2 : it.r);
  const isRange = it => it.r2 > it.r;
  const trim00 = s => s.replace(/[.,]00(?=\D*$)/, '');
  const priceText = (it, cur) => (isRange(it) ? `${trim00(money(it.q * it.r, cur))} – ${trim00(money(it.q * it.r2, cur))}` : money(it.q * it.r, cur));
  function totals(d) {
    const sub = d.items.reduce((s, it) => s + it.q * it.r, 0);
    const disc = sub * d.discount / 100;
    const tax = (sub - disc) * d.tax / 100;
    const k = (1 - d.discount / 100) * (1 + d.tax / 100);
    const hi = d.items.reduce((s, it) => s + it.q * hiRate(it), 0) * k;   // top of the range, when any section has one
    return { sub, disc, tax, total: sub - disc + tax, hi, range: hi > sub - disc + tax };
  }
  /* a total as text, and the attributes for the count-up (a range doesn't count up) */
  const totalText = (t, cur) => (t.range ? `${trim00(money(t.total, cur))} – ${trim00(money(t.hi, cur))}` : money(t.total, cur));
  const totalAttr = (t, cur) => (t.range ? '' :` data-count="${t.total}" data-cur="${cur}"`);
  const visibleItems = d => d.items.filter(it => it.v || it.d.trim() || it.q * it.r || it.x.trim());

  function status(d) {
    const due = parseISO(d.due);
    if (!due) return null;
    const days = Math.round((due - parseISO(iso())) / 864e5);
    if (d.type === 'quote') {
      if (days < 0) return { t: 'Expired', k: 'bad' };
      return { t: days === 0 ? 'Expires today' : `Valid for ${plural(days, 'day')}`, k: days <= 3 ? 'warn' : 'ok' };
    }
    if (days < 0) return { t: `Overdue by ${plural(-days, 'day')}`, k: 'bad' };
    return { t: days === 0 ? 'Due today' : `Due in ${plural(days, 'day')}`, k: days <= 3 ? 'warn' : 'ok' };
  }

  /* ---------- media ---------- */
  const localURLs = new Map();   // "local:abc" -> blob: URL (uploads that live only in this browser)
  function srcAttr(v) {
    if (v.startsWith('local:')) { const u = localURLs.get(v); return u ? `src="${u}" data-local="${v}"` : `data-local="${v}"`; }
    return `src="${esc(v)}"`;
  }
  const sceneFor = (m, ctx) => (m && m.k === 'scene' ? m.v : Scenes.match(ctx.title, ctx.text));
  function mediaHTML(m, ctx = {}) {
    m = m || { k: 'auto' };
    if (m.k === 'none') return '';
    let inner = '';
    if (m.k === 'auto' || m.k === 'scene') inner = Scenes.html(sceneFor(m, ctx), ctx.prefix);
    else if (m.k === 'img') inner = `<img class="m-fill" ${srcAttr(m.v)}${frameStyle(m.f)} alt="" decoding="async">`;
    else if (m.k === 'vid') inner = `<video class="m-fill" ${srcAttr(m.v)}${frameStyle(m.f)}${m.p ? ` poster="${esc(m.p)}"` : ''} autoplay muted loop playsinline preload="auto"></video>`;
    else if (m.k === 'yt') {
      const th = `https://i.ytimg.com/vi/${m.v}/hqdefault.jpg`;
      inner = ctx.lite
        ? `<img class="m-fill" src="${th}" alt=""><span class="m-badge">▶ YouTube</span>`
        : `<img class="m-fill m-print" src="${th}" alt=""><iframe class="m-frame" src="https://www.youtube-nocookie.com/embed/${m.v}?autoplay=1&amp;mute=1&amp;loop=1&amp;playlist=${m.v}&amp;controls=0&amp;modestbranding=1&amp;playsinline=1&amp;rel=0" allow="autoplay; encrypted-media; picture-in-picture" title="Video" tabindex="-1"></iframe>`;
    } else if (m.k === 'vimeo') {
      inner = ctx.lite
        ? `<div class="m-ph"></div><span class="m-badge">▶ Vimeo</span>`
        : `<iframe class="m-frame" src="https://player.vimeo.com/video/${m.v}?background=1&amp;autoplay=1&amp;loop=1&amp;muted=1" allow="autoplay; fullscreen" title="Video" tabindex="-1"></iframe>`;
    }
    const credit = m.c && !ctx.lite ? `<span class="m-credit">${esc(m.c)}</span>` : '';
    return `<div class="media">${inner}${credit}</div>`;
  }
  function parseMediaURL(u) {
    u = (u || '').trim();
    if (!u) return null;
    let m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,15})/i))) return { k: 'yt', v: m[1] };
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d{4,12})/i))) return { k: 'vimeo', v: m[1] };
    // Pexels photo page → direct image (no key needed)
    if ((m = u.match(/pexels\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:photo|foto)\/(?:[^/?#]*-)?(\d{4,12})(?:[/?#]|$)/i)))
      return { k: 'img', v: `https://images.pexels.com/photos/${m[1]}/pexels-photo-${m[1]}.jpeg?auto=compress&cs=tinysrgb&w=1600`, c: 'Photo · Pexels' };
    if (/pexels\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:video|videos)\/[^?#]*\d/i.test(u)) return { err: 'For a Pexels video, play it, right-click the video → Copy video address (videos.pexels.com…), and paste that here.' };
    if (/unsplash\.com\/(?:[a-z]{2}\/)?(?:photos|fotos)\//i.test(u)) return { err: 'For Unsplash, right-click the photo → Copy image address (starts with images.unsplash.com) and paste that.' };
    if (/(?:^|\/\/|\.)freepik\.com\//i.test(u)) return { err: 'Freepik doesn’t allow linking to its files. Download it with your account and use the Upload tab.' };
    if (/pixabay\.com\/(?:[a-z-]+\/)?(?:photos|videos|illustrations|vectors|images)?\/?[^?#]*-\d+/i.test(u) || /cdn\.pixabay\.com/i.test(u)) return { err: 'Pixabay doesn’t allow linking to its files. Download it and use the Upload tab.' };
    if (/pinterest\.[a-z.]+\/pin\//i.test(u) || /pin\.it\//i.test(u)) return { err: 'That’s a Pinterest page link. Open the pin, right-click the image → Copy image address, and paste that instead.' };
    if (/drive\.google\.com|dropbox\.com\/s/i.test(u)) return { err: 'Share-page links (Drive, Dropbox) don’t embed. Use a direct file link, Cloudinary, or your site’s media/ folder.' };
    const v = safeSrc(u, 'img');
    if (!v || v.startsWith('data:') || v.startsWith('local:')) return { err: 'Paste a full https:// link (or media/your-file.mp4).' };
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) ? { k: 'vid', v } : { k: 'img', v };
  }

  /* IndexedDB for uploaded videos when no host is connected */
  const idb = (() => {
    let p;
    const open = () => (p ||= new Promise((res, rej) => {
      const r = indexedDB.open('slip-media', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => { const t = db.transaction('f', mode); const q = fn(t.objectStore('f')); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); });
    };
    return { get: k => tx('readonly', s => s.get(k)), put: (k, v) => tx('readwrite', s => s.put(v, k)) };
  })();
  async function hydrateLocal(host, quiet) {
    for (const el of $$('[data-local]:not([src])', host)) {
      const key = el.dataset.local;
      let url = localURLs.get(key);
      if (!url) {
        const blob = await idb.get(key).catch(() => null);
        if (!blob) {
          const media = el.closest('.media');
          if (media) media.innerHTML = Scenes.html('orbit', 'l') + (quiet ? '' : '<span class="m-credit">Uploaded file isn’t on this device</span>');
          continue;
        }
        url = URL.createObjectURL(blob);
        localURLs.set(key, url);
      }
      el.src = url;
    }
  }

  /* ---------- renderers ---------- */
  const logoHTML = d => (d.logo ? `<img class="doc-logo" src="${esc(d.logo)}" alt="${esc(d.from.name)}">` : `<span class="mono">${esc(initials(d.from.name))}</span>`);

  /* Small credit at the end of every document, so clients can find Slip. Set siteUrl in config.js. */
  const SLIP_URL = /^https:\/\//.test(window.SlipConfig?.siteUrl || '') ? window.SlipConfig.siteUrl : 'https://lasradostudio.github.io/slip/';
  const MADE_WITH = `<a class="made-with" href="${SLIP_URL}" target="_blank" rel="noopener">Made with <b>Slip</b> · free animated proposals</a>`;

  function renderClassic(d, ctx = {}) {
    const t = totals(d), q = d.type === 'quote', kind = q ? 'Quote' : 'Invoice', cur = d.currency, st = status(d);
    const on = !!ctx.edit, ed = (path, ph, extra) => editAttr(on, path, ph, extra);
    let n = 0;
    const A = (cls = '') => `class="a ${cls}" style="--d:${Math.min(n++, 22)}"`;
    const items = (on ? d.items : visibleItems(d)).filter(it => !it.v);
    return `
<article class="doc" data-layout="classic" style="${accentVars(d.color)}">
  <div class="doc-bar"></div>
  <header class="doc-head">
    <div ${A('doc-brand')}>${logoHTML(d)}
      <div><div class="doc-brand-name">${esc(d.from.name) || 'Your business'}</div>${d.from.email ? `<div class="sub">${esc(d.from.email)}</div>` : ''}</div>
    </div>
    <div ${A('doc-kind')}><span class="kind-tag">${kind}</span>${d.number ? `<span class="doc-num">#${esc(d.number)}</span>` : ''}</div>
  </header>
  <section class="hero">
    <div ${A()}>
      <p class="eyebrow">${q ? 'Prepared for' : 'Billed to'}</p>
      <h1${ed('to.name', 'Client name')}>${on ? esc(d.to.name) : esc(d.to.name || d.to.contact) || 'Your client'}</h1>
      ${st ? `<span class="pill ${st.k}"><i></i>${esc(st.t)}</span>` : ''}
    </div>
    ${d.noTotal ? '' : `<div ${A('hero-total')}>
      <p class="eyebrow">${q ? 'Quote total' : 'Amount due'}</p>
      <div class="big"${totalAttr(t, cur)}>${totalText(t, cur)}</div>
      <div class="sub">${q ? 'Valid until' : 'Due'} ${fmtDate(d.due)}</div>
    </div>`}
  </section>
  <section class="parties">
    <div ${A()}><h3>From</h3><p><strong>${esc(d.from.name) || '-'}</strong>${esc(d.from.details)}${d.from.email ? `\n${esc(d.from.email)}` : ''}</p></div>
    <div ${A()}><h3>${q ? 'For' : 'Bill to'}</h3><p><strong>${esc(d.to.contact || d.to.name) || '-'}</strong>${d.to.contact && d.to.name ? `${esc(d.to.name)}\n` : ''}${esc(d.to.details)}${d.to.email ? `\n${esc(d.to.email)}` : ''}</p></div>
    <div ${A('p-meta')}><h3>Details</h3><dl class="meta-list">
      ${d.number ? `<dt>Number</dt><dd>${esc(d.number)}</dd>` : ''}<dt>Issued</dt><dd>${fmtDate(d.issued)}</dd><dt>${q ? 'Valid until' : 'Due'}</dt><dd>${fmtDate(d.due)}</dd>
    </dl></div>
  </section>
  <section class="lines">
    <div ${A('line lh')}><span>Description</span><span class="l-q">Qty</span><span class="l-r">Rate</span><span>Amount</span></div>
    ${items.length ? items.map(it => { const ix = d.items.indexOf(it); return `
    <div ${A('line')}>
      <span class="l-d"><span${ed(`items.${ix}.d`, 'Item')}>${on ? esc(it.d) : esc(it.d) || 'Item'}</span>${it.t ? `<span class="l-t">${esc(it.t)}</span>` : ''}<span class="l-sub">${qty(it.q)} × ${money(it.r, cur)}</span>${it.x.trim() || on ? `<span class="l-x"${ed(`items.${ix}.x`, 'Add details…')}>${esc(on ? it.x : it.x.trim().replace(/^[-–—_=]{3,}$/gm, '').replace(/\n{2,}/g, '\n'))}</span>` : ''}</span>
      <span class="l-q">${qty(it.q)}</span><span class="l-r">${money(it.r, cur)}</span><span class="l-a">${priceText(it, cur)}</span>
    </div>`; }).join('') : `<div ${A('line empty')}><span>No line items yet</span></div>`}
    ${on ? '<button type="button" class="add-line" data-add-section>+ Add line item</button>' : ''}
  </section>
  ${d.noTotal ? '' : `<section class="sum">
    <div ${A()}><span>Subtotal</span><span>${money(t.sub, cur)}</span></div>
    ${d.discount ? `<div ${A()}><span>Discount (${qty(d.discount)}%)</span><span>−${money(t.disc, cur)}</span></div>` : ''}
    ${d.tax ? `<div ${A()}><span>Tax (${qty(d.tax)}%)</span><span>${money(t.tax, cur)}</span></div>` : ''}
    <div ${A('grand')}><span>Total</span><span>${totalText(t, cur)}</span></div>
  </section>`}
  ${d.notes.trim() || on ? `<section ${A('notes')}><h3>Notes &amp; terms</h3><div${ed('notes', 'Add payment terms…')}>${esc(on ? d.notes : d.notes.trim())}</div></section>` : ''}
  <footer ${A('doc-foot')}>
    <span>Thank you${d.to.contact ? `, <b>${esc(d.to.contact.split(' ')[0])}</b>` : ''}.</span>
    <span>${esc([d.from.name, d.from.email].filter(Boolean).join(' · '))}</span>
  </footer>
  ${MADE_WITH}
</article>`;
  }

  const TICK = '<svg class="tick" viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="6"/><path d="M6 10.4l2.7 2.7L14 7.6"/></svg>';
  const CLOCK = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  /* On-page editing: attributes that make a piece of text editable in the editor's preview */
  const editAttr = (on, path, ph = '', extra = '') =>
    (on ? ` data-edit="${path}" data-ph="${esc(ph)}" contenteditable="plaintext-only" spellcheck="true"${extra}` : '');

  /* path given → each bullet is editable and an "+ Add point" button appears */
  function descHTML(x, path = '') {
    let out = '', ul = [];
    const flush = () => { if (ul.length) { out += `<ul>${ul.join('')}</ul>`; ul = []; } };
    (x || '').split('\n').forEach((raw, k) => {
      const l = raw.trim();
      if (!l) { flush(); return; }
      if (/^[-–—_=]{3,}$/.test(l)) { flush(); out += '<hr>'; return; }
      const text = esc(path ? raw.replace(/^\s*[-•*]\s+/, '') : l.replace(/^[-•*]\s+/, ''));
      ul.push(`<li>${TICK}<span${editAttr(!!path, path, 'New point', ` data-line="${k}"`)}>${text}</span></li>`);
    });
    flush();
    if (!out) out = '<p class="empty">Explain what’s included in this section.</p>';
    if (path) out += `<button type="button" class="add-point" data-add-point="${path}">+ Add point</button>`;
    return out;
  }

  function renderProposal(d, ctx = {}) {
    const t = totals(d), q = d.type === 'quote', cur = d.currency, st = status(d);
    const items = ctx.edit ? d.items : visibleItems(d);   // in the editor, show new empty sections too
    const logo = logoHTML(d);
    const brand = esc(d.from.name) || 'Your business';
    const client = esc(d.to.name || d.to.contact) || 'Your client';
    const contact = [d.from.email, ...d.from.details.split('\n')].map(s => s.trim()).filter(Boolean).map(esc).join('<i>|</i>');
    const mctx = (extra) => ({ lite: ctx.lite, prefix: ctx.prefix, ...extra });
    const on = !!ctx.edit, ed = (path, ph, extra) => editAttr(on, path, ph, extra);
    const breakdown = [
      ['Subtotal', money(t.sub, cur)],
      d.discount ? [`Discount (${qty(d.discount)}%)`, `−${money(t.disc, cur)}`] : null,
      d.tax ? [`Tax (${qty(d.tax)}%)`, money(t.tax, cur)] : null,
    ].filter(Boolean);
    /* No-total documents: each section is its own service. Unpriced sections show no price,
       and the scope table drops columns nobody filled in. (The editor keeps them so they stay editable.) */
    const noTot = d.noTotal;
    const priced = it => it.q * it.r > 0;
    const secs = items.filter(it => !it.v);   // numbered sections; visual pages sit between them, unnumbered
    const showCost = on || !noTot || secs.some(priced);
    const showTime = on || !noTot || secs.some(it => it.t.trim());
    const LINK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const linkHTML = (it, cls = '') => { const u = safeLink(it.u); return u ? `<a class="pp-link ${cls}" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><span>${esc(linkHost(u))}</span>${LINK}</a>` : ''; };
    const showPrice = it => on || !noTot || priced(it);
    const bannerHTML = d.banner && d.banner.k === 'none' ? '' : mediaHTML(d.banner || { k: 'scene', v: 'orbit' }, mctx({}));

    return `
<div class="pp${d.look ? ` lk-${d.look}` : ''}" data-layout="proposal" style="${accentVars(d.color)}">
  <section class="pp-page pp-cover grain">
    <div class="pp-glow g1"></div><div class="pp-glow g2"></div>
    <div class="pp-cover-mid">
      <div class="pp-cover-logo rv" style="--d:1">${logo}<span class="pp-wordmark"${ed('from.name', 'Your business')}>${on ? esc(d.from.name) : brand}</span></div>
      ${d.from.tagline || on ? `<p class="pp-tagline rv" style="--d:3"${ed('from.tagline', 'Add a tagline')}>${esc(d.from.tagline)}</p>` : ''}
    </div>
    <div class="pp-cover-foot rv" style="--d:5">
      <div><span class="eyebrow">${q ? 'Proposal for' : 'Invoice for'}</span><b${ed('to.name', 'Client name')}>${on ? esc(d.to.name) : client}</b></div>
      <div class="r">${d.number ? `#${esc(d.number)}<br>` : ''}${fmtDate(d.issued)}</div>
    </div>
  </section>

  <section class="pp-page pp-overview${showCost && secs.some(isRange) ? ' wide-toc' : ''}">
    <div>
      <p class="eyebrow rv">${q ? 'Prepared for' : 'Billed to'}</p>
      <h2 class="rv" style="--d:1"${ed('to.name', 'Client name')}>${on ? esc(d.to.name) : client}</h2>
      ${st ? `<span class="pill ${st.k} rv" style="--d:2"><i></i>${esc(st.t)}</span>` : ''}
      ${d.intro.trim() || on ? `<p class="pp-intro rv" style="--d:3"${ed('intro', 'Add a short intro for your client…')}>${esc(on ? d.intro : d.intro.trim())}</p>` : ''}
      <dl class="meta-list rv" style="--d:4">
        ${d.to.contact && d.to.name ? `<dt>Attn.</dt><dd>${esc(d.to.contact)}</dd>` : ''}
        ${d.number ? `<dt>Number</dt><dd>${esc(d.number)}</dd>` : ''}
        <dt>Issued</dt><dd>${fmtDate(d.issued)}</dd>
        ${d.due || !noTot ? `<dt>${q ? 'Valid until' : 'Due'}</dt><dd>${fmtDate(d.due)}</dd>` : ''}
      </dl>
    </div>
    <div class="pp-toc rv${showTime ? '' : ' no-time'}${showCost ? '' : ' no-cost'}" style="--d:2">
      <div class="pp-toc-h"><span>${noTot ? 'Services' : 'Scope'}</span>${showTime ? '<span>Timeline</span>' : ''}${showCost ? '<span>Cost</span>' : ''}</div>
      ${secs.map((it, i) => `<button type="button" class="pp-toc-row" data-goto="${i + 1}"><span><i>${pad(i + 1)}</i>${esc(it.d) || 'Untitled'}</span>${showTime ? `<span>${esc(it.t) || '-'}</span>` : ''}${showCost ? `<span>${noTot && !priced(it) ? '-' : priceText(it, cur)}</span>` : ''}</button>`).join('')}
      ${noTot ? '' : `<div class="pp-toc-total"><span>${q ? 'Total' : 'Amount due'}</span><b${totalAttr(t, cur)}>${totalText(t, cur)}</b></div>`}
    </div>
  </section>

  ${items.map(it => { const ix = d.items.indexOf(it), i = secs.indexOf(it);
    if (it.v && it.g && it.g.length) {
      const tiles = [{ m: it.m, u: it.u, c: (it.x || '').split('\n')[0].trim(), t: it.t }, ...it.g];
      const tagsHTML = t => { const a = (t || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4); return a.length ? `<span class="cg-tags">${a.map(s => `<s>${esc(s)}</s>`).join('')}</span>` : ''; };
      const lay = it.gl || 'mosaic', n = tiles.length;
      const tile = (t, k, span = 1) => {
        const u = safeLink(t.u), tag = u && !on ? 'a' : 'div';
        const m = t.m && t.m.k !== 'none' ? t.m : (k ? { k: 'scene', v: 'orbit' } : null);
        return `<${tag} class="cg-t${k ? '' : ' pp-media'}"${span > 1 ? ` style="grid-column:span ${span}"` : ''}${tag === 'a' ? ` href="${esc(u)}" target="_blank" rel="noopener noreferrer"` : ''}>${mediaHTML(m, mctx({ title: t.c || it.d, text: '' }))}<span class="cg-cap">${tagsHTML(t.t)}<i>${pad(k + 1)}</i>${t.c ? `<b>${esc(t.c)}</b>` : ''}${u ? `<em>${esc(linkHost(u))}${LINK}</em>` : ''}</span></${tag}>`;
      };
      /* a grid of `rest` tiles in `c` columns; the last tile stretches over any empty cells */
      const gridOf = (list, from, c) => `<div class="cg-rest" style="--c:${c}">${list.map((t, j) => tile(t, from + j, j === list.length - 1 ? 1 + (c - list.length % c) % c : 1)).join('')}</div>`;
      /* bento: columns of one or two boxes on a track wider than the page; CSS breathes their sizes, a small loop drifts it */
      const bento = () => {
        const cols = [];
        for (let k = 0; k < n;) { const take = cols.length % 2 && n - k > 1 ? 2 : 1; cols.push(tiles.slice(k, k + take).map((t, j) => tile(t, k + j))); k += take; }
        return `<div class="cg-track">${cols.map((c, ci) => `<div class="cg-col" style="--i:${ci}">${c.join('')}</div>`).join('')}</div>`;
      };
      const body = lay === 'bento' ? bento() : lay === 'strip' ? tiles.map((t, k) => tile(t, k)).join('')
        : lay === 'grid' ? gridOf(tiles, 0, n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4)
        : tile(tiles[0], 0) + gridOf(tiles.slice(1), 1, n - 1 <= 2 ? 1 : n - 1 <= 6 ? 2 : 3);
      return `
  <section class="pp-page pp-sec pp-visual has-refs" data-item="${ix}">
    <div class="pp-vis-head rv"><span class="pp-vis-title"${ed(`items.${ix}.d`, 'Add a title')}>${esc(it.d)}</span><span class="pp-idx">${pad(n)} references</span></div>
    <div class="pp-vis-corner"><button type="button" data-vis-toggle aria-pressed="false"><span class="vs-a">☰ List view</span><span class="vs-b">▦ Collage view</span></button></div>
    <div class="cg cg-${lay} rv" style="--d:1;--pc:${n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4}">${body}</div>
    ${lay === 'bento' ? '<button type="button" class="cg-nav prev" data-cg-nav="-1" aria-label="Browse left">‹</button><button type="button" class="cg-nav next" data-cg-nav="1" aria-label="Browse right">›</button>' : ''}
    ${on && n < 9 ? `<button type="button" class="pp-add-ref" data-add-ref="${ix}">+ Add reference</button>` : ''}
  </section>`;
    }
    if (it.v) return `
  <section class="pp-page pp-sec pp-visual" data-item="${ix}">
    <div class="pp-media rv">${mediaHTML(it.m && it.m.k !== 'none' ? it.m : { k: 'scene', v: 'orbit' }, mctx({ title: it.d, text: it.x }))}</div>
    ${it.d.trim() || safeLink(it.u) || on ? `<div class="pp-vis-cap rv" style="--d:2"><span class="pp-vis-title"${ed(`items.${ix}.d`, 'Add a caption')}>${esc(it.d)}</span>${linkHTML(it)}</div>` : ''}
    ${on ? `<button type="button" class="pp-add-ref" data-add-ref="${ix}">+ Add reference</button>` : ''}
  </section>`;
    return `
  <section class="pp-page pp-sec${i % 2 ? ' flip' : ''}" data-sec="${i + 1}" data-item="${ix}">
    <div class="pp-sec-body">
      <div class="pp-sec-top rv"><span class="pp-mini">${logo}</span><span class="pp-idx">${pad(i + 1)} / ${pad(secs.length)}</span></div>
      <div class="pp-sec-head">
        <div>
          <h2 class="pp-title rv" data-n="${pad(i + 1)}" style="--d:1"${ed(`items.${ix}.d`, 'Section title')}>${on ? esc(it.d) : esc(it.d) || 'Untitled section'}</h2>
          ${it.t || on ? `<p class="pp-time rv" style="--d:2">${CLOCK}Est. delivery · <span${ed(`items.${ix}.t`, 'add timeline')}>${esc(it.t)}</span></p>` : ''}
        </div>
        ${showPrice(it) ? `<div class="pp-price rv${isRange(it) ? ' is-range' : ''}" style="--d:3">${isRange(it) ? `<b>${priceText(it, cur)}</b>` : `<b data-count="${it.q * it.r}" data-cur="${cur}"${it.q === 1 ? ed(`items.${ix}.r`, '0', ' data-num') : ''}>${money(it.q * it.r, cur)}</b>`}${it.q !== 1 ? `<small>${qty(it.q)} × ${isRange(it) ? `${money(it.r, cur)} – ${money(it.r2, cur)}` : money(it.r, cur)}</small>` : ''}</div>` : ''}
      </div>
      <div class="pp-desc rv" style="--d:4">${descHTML(it.x, on ? `items.${ix}.x` : '')}</div>
      <div class="pp-sec-foot rv" style="--d:5"><span>${brand}</span>${linkHTML(it)}</div>
    </div>
    ${it.m && it.m.k === 'none' ? '' : `<div class="pp-media rv" style="--d:1">${mediaHTML(it.m, mctx({ title: it.d, text: it.x }))}</div>`}
  </section>`; }).join('')}

  ${on ? `<button type="button" class="pp-page pp-add-sec" data-add-section>
    <span class="pp-add-plus">+</span>
    <b>Add another section</b>
    <small>One per thing you charge for, like SEO setup · Logo design · Monthly maintenance</small>
  </button>
  <button type="button" class="pp-add-vis" data-add-visual>+ Add a visual page <small>a full page for a video, image or reference, between sections</small></button>` : ''}

  <section class="pp-page pp-terms">
    <div class="pp-terms-grid${noTot ? ' solo' : ''}">
      <div class="rv">
        <span class="pp-mini">${logo}</span>
        ${d.notes.trim() || on ? `<h3>Terms</h3><p${ed('notes', 'Add payment terms…')}>${esc(on ? d.notes : d.notes.trim())}</p>` : ''}
      </div>
      ${noTot ? '' : `<div class="pp-total rv" style="--d:2">
        ${breakdown.length > 1 ? `<div class="pp-breakdown">${breakdown.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('')}</div>` : ''}
        <span class="eyebrow">${q ? 'Total cost' : 'Amount due'}</span>
        <b class="pp-total-n${t.range ? ' is-range' : ''}"${totalAttr(t, cur)}>${totalText(t, cur)}</b>
        <span class="sub">${q ? 'Valid until' : 'Due'} ${fmtDate(d.due)}</span>
      </div>`}
    </div>
    ${bannerHTML ? `<div class="pp-banner pp-media rv">${bannerHTML}</div>` : ''}
  </section>

  <section class="pp-page pp-thanks grain">
    <h2 class="rv">Thank you</h2>
    <div class="pp-thanks-brand rv" style="--d:2">${d.logo ? `<span class="chip-logo">${logo}</span>` : logo}<span>${brand}</span></div>
    ${contact ? `<p class="pp-contact rv" style="--d:4">${contact}</p>` : ''}
    ${MADE_WITH}
  </section>
</div>`;
  }

  /* ---------- mounting: fresh render with animation, or a quiet DOM diff ---------- */
  /* Patch the live tree to match the new one. Unchanged nodes (videos, iframes, scenes)
     are left alone, so typing doesn't restart media or animations. */
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
    if (a.nodeType === 3 || a.nodeType === 8) { if (a.data !== b.data) a.data = b.data; return; }
    if (a.nodeType !== 1) return;
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    if (a.nodeName === 'IFRAME' || a.nodeName === 'VIDEO') return;
    if (a === document.activeElement && a.hasAttribute('data-edit')) return;   // don't fight the caret while typing
    const ac = [...a.childNodes], bc = [...b.childNodes];
    const n = Math.min(ac.length, bc.length);
    for (let i = 0; i < n; i++) morph(ac[i], bc[i]);
    for (let i = n; i < ac.length; i++) ac[i].remove();
    for (let i = n; i < bc.length; i++) a.appendChild(bc[i]);
  }

  function countUp(root, delay = 420, dur = 1400) {
    const els = [...(root.matches?.('[data-count]') ? [root] : []), ...$$('[data-count]', root)];
    els.forEach(el => {
      const target = +el.dataset.count, cur = el.dataset.cur;
      cancelAnimationFrame(el._raf);
      if (el === document.activeElement) return;   // someone is editing this number
      if (reduceMotion || !target) { el.textContent = money(target, cur); return; }
      el.textContent = money(0, cur);
      let t0;
      const step = now => {
        if (el === document.activeElement) return;
        t0 ??= now;
        const p = Math.min(1, Math.max(0, (now - t0 - delay) / dur));
        el.textContent = money(target * (p === 1 ? 1 : 1 - 2 ** (-10 * p)), cur);
        if (p < 1) el._raf = requestAnimationFrame(step);
      };
      el._raf = requestAnimationFrame(step);
    });
  }
  function finishCounts() {
    $$('[data-count]').forEach(el => { cancelAnimationFrame(el._raf); el.textContent = money(+el.dataset.count, el.dataset.cur); });
  }
  addEventListener('beforeprint', () => { finishCounts(); $$('.rv').forEach(e => e.classList.add('in')); });

  function observeReveal(host) {
    const els = $$('.rv', host);
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.matches('[data-count]') || en.target.querySelector('[data-count]')) countUp(en.target, 250, 1200);
      io.unobserve(en.target);
    }), { threshold: .12 });
    host._io = io;
    els.forEach(e => io.observe(e));
  }

  function mount(host, d, animate, quiet) {
    Scenes.seq(host.id || 'h');
    const ctx = { prefix: host.id, edit: host.id === 'preview' };   // text is editable only in the editor's preview
    const html = d.layout === 'proposal' ? renderProposal(d, ctx) : renderClassic(d, ctx);
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    const next = tpl.content.firstElementChild;
    const cur = host.firstElementChild;
    if (animate || !cur || cur.dataset.layout !== next.dataset.layout) {
      host._io?.disconnect();
      host.replaceChildren(next);
      if (animate && !reduceMotion) {
        if (d.layout === 'proposal') observeReveal(host);
        else { next.classList.add('animate'); countUp(next); }
      } else $$('.rv', next).forEach(e => e.classList.add('in'));
    } else {
      $$('.rv', next).forEach(e => e.classList.add('in'));
      if (cur.classList.contains('animate')) next.classList.add('animate');
      morph(cur, next);
    }
    hydrateLocal(host, quiet);
    $$('video', host).forEach(v => { if (v.paused) { v.muted = true; v.play().catch(() => {}); } });
  }

  /* Bento collages: the track is moved with a transform, which is smooth at sub-pixel speeds
     (scrollLeft snaps to whole pixels and judders). It drifts left and right by itself;
     drag, swipe, scroll sideways or use the arrows to browse. */
  const bentoState = new WeakMap();
  const bState = el => { let s = bentoState.get(el); if (!s) bentoState.set(el, s = { x: 0, d: 1, hold: 0, to: null }); return s; };
  const bMax = el => Math.max(0, (el.firstElementChild?.scrollWidth || 0) - el.clientWidth);
  const holdBento = el => { bState(el).hold = performance.now() + 2600; };
  let bentoDrag = null;
  {
    let bentos = [], last = 0;
    setInterval(() => { bentos = [...document.querySelectorAll('.cg-bento')]; }, 1000);   // cheap rescan instead of a query every frame
    (function tick(now) {
      const dt = Math.min(48, now - last || 16); last = now;
      if (bentos.length && !document.hidden) for (const el of bentos) {
        if (!el.isConnected || el.closest('.is-list')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
        const max = bMax(el), s = bState(el);
        if (max < 8) continue;
        if (bentoDrag && bentoDrag.el === el) { /* follows the pointer */ }
        else if (s.to != null) { s.x += (s.to - s.x) * Math.min(1, dt * .008); if (Math.abs(s.to - s.x) < .5) { s.x = s.to; s.to = null; } }
        else if (!reduceMotion && now > s.hold) {
          const edge = Math.min(s.x, max - s.x);                                  // slow into each end, then turn round
          s.x += s.d * dt * .035 * (.15 + .85 * Math.min(1, edge / 140));
          if (s.x >= max) s.d = -1; else if (s.x <= 0) s.d = 1;
        }
        s.x = Math.max(0, Math.min(max, s.x));
        el.firstElementChild.style.transform = `translate3d(${(-s.x).toFixed(2)}px,0,0)`;
      }
      requestAnimationFrame(tick);
    })(0);
  }
  addEventListener('pointerdown', e => {
    const el = !e.button && !e.target.closest('[contenteditable]') && e.target.closest?.('.cg-bento');
    if (!el || el.closest('.is-list')) return;
    const s = bState(el); s.to = null;
    bentoDrag = { el, x: e.clientX, s: s.x, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!bentoDrag) return;
    const dx = e.clientX - bentoDrag.x;
    if (Math.abs(dx) > 4) bentoDrag.moved = true;
    bState(bentoDrag.el).x = bentoDrag.s - dx;
    holdBento(bentoDrag.el);
  });
  const endBentoDrag = () => {
    if (bentoDrag?.moved) { const stop = ev => { ev.preventDefault(); ev.stopPropagation(); }; addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => removeEventListener('click', stop, { capture: true }), 50); }
    bentoDrag = null;
  };
  addEventListener('pointerup', endBentoDrag); addEventListener('pointercancel', endBentoDrag);
  addEventListener('wheel', e => {
    const el = e.target.closest?.('.cg-bento');
    if (!el || el.closest('.is-list') || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    const s = bState(el); s.to = null; s.x += e.deltaX; holdBento(el);
  }, { passive: false });

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-cg-nav]');
    if (nav) {
      const el = nav.closest('.pp-visual')?.querySelector('.cg-bento');
      if (el) { const s = bState(el); s.to = Math.max(0, Math.min(bMax(el), (s.to ?? s.x) + +nav.dataset.cgNav * el.clientWidth * .6)); holdBento(el); }
      return;
    }
    const vt = e.target.closest('[data-vis-toggle]');
    if (vt) {
      const sec = vt.closest('.pp-visual');
      if (sec) vt.setAttribute('aria-pressed', String(sec.classList.toggle('is-list')));
      return;
    }
    const b = e.target.closest('[data-goto]');
    if (!b) return;
    b.closest('.pp')?.querySelector(`[data-sec="${b.dataset.goto}"]`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- link encoding (deflate + base64url) ---------- */
  const b64u = {
    enc(bytes) {
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    dec(str) {
      let s = str.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return Uint8Array.from(atob(s), c => c.charCodeAt(0));
    },
  };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  async function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if ('CompressionStream' in window) {
      try { return 'z' + b64u.enc(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch { /* fall through */ }
    }
    return 'j' + b64u.enc(bytes);
  }
  async function decode(code) {
    const bytes = b64u.dec(code.slice(1));
    const out = code[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    return JSON.parse(new TextDecoder().decode(out));
  }
  const baseURL = () => location.href.split('#')[0];
  async function shareURL(d) { return `${baseURL()}#q=${await encode(d)}`; }

  /* ---------- toast + sparks ---------- */
  let toastT;
  function toast(msg, ms = 2600, action) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('has-action', !!action);
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = action.label;
      b.onclick = () => { el.classList.remove('show'); action.fn(); };
      el.appendChild(b);
      ms = Math.max(ms, 7000);
    }
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), ms);
  }
  function burst(x, y, color) {
    if (reduceMotion) return;
    for (let i = 0; i < 34; i++) {
      const s = document.createElement('i');
      const ang = Math.random() * Math.PI * 2, r = 70 + Math.random() * 120;
      s.className = 'spark';
      s.style.cssText = `left:${x - 4}px;top:${y - 4}px;--x:${Math.cos(ang) * r}px;--y:${Math.sin(ang) * r - 60}px;--r:${Math.random() * 540}deg;background:${i % 3 ? color : '#121212'};border-radius:${i % 2 ? '50%' : '2px'}`;
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
  }

  function printDoc(d) {
    const prev = document.title;
    const kind = d.layout === 'proposal' && d.type === 'quote' ? 'Proposal' : d.type === 'quote' ? 'Quote' : 'Invoice';
    document.title = [kind, d.number, d.to.name].filter(Boolean).join(' - ');
    finishCounts();
    $$('.rv').forEach(e => e.classList.add('in'));
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  }

  async function shrinkImage(file, max, quality) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const w = img.naturalWidth || max, h = img.naturalHeight || max;
      const k = Math.min(1, max / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let out = c.toDataURL('image/webp', quality);
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality);
      return out;
    } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- segmented controls ---------- */
  function setSeg(seg, val) {
    const btns = $$('button[data-val]', seg);
    const i = Math.max(0, btns.findIndex(b => b.dataset.val === val));
    seg.style.setProperty('--i', i);
    btns.forEach((b, j) => { b.classList.toggle('on', j === i); if (b.getAttribute('role') === 'radio') b.setAttribute('aria-checked', String(j === i)); });
  }

  /* =========================================================
     EDITOR
     ========================================================= */
  let state, settings, editorReady = false;
  const openItems = new Set();

  /* ---------- saved documents (one localStorage entry per document + a small index) ---------- */
  const DOCS = 'slip:docs:v1';
  const docKey = id => `slip:doc:${id}`;
  let currentId = null;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const listDocs = () => (store.get(DOCS, []) || []).filter(x => x && x.id);
  const loadDoc = id => { const d = store.get(docKey(id), null); return d ? normalize(d) : null; };
  function metaOf(id, d) {
    return {
      id, updated: Date.now(), type: d.type, layout: d.layout, number: d.number,
      client: d.to.name || d.to.contact || '', total: totals(d).total, currency: d.currency,
      color: d.color, items: visibleItems(d).length,
    };
  }
  const DELETED = 'slip:deleted';   // id → time it was deleted, so deletes also sync to Google Drive
  function saveDoc(id, d, updated) {
    if (!store.set(docKey(id), d)) return false;
    const meta = metaOf(id, d);
    if (updated) meta.updated = updated;
    store.set(DOCS, [meta, ...listDocs().filter(x => x.id !== id)].sort((a, b) => b.updated - a.updated));
    const del = store.get(DELETED, {});
    if (del[id]) { delete del[id]; store.set(DELETED, del); }
    return true;
  }
  function deleteDoc(id, fromSync) {
    try { localStorage.removeItem(docKey(id)); } catch { /* ignore */ }
    store.set(DOCS, listDocs().filter(x => x.id !== id));
    if (!fromSync) store.set(DELETED, { ...store.get(DELETED, {}), [id]: Date.now() });
  }
  function migrateOldDraft() {
    if (store.get(DOCS, null)) return;
    const old = store.get(STORE, null);
    store.set(DOCS, []);
    if (old) { saveDoc(newId(), normalize(old)); try { localStorage.removeItem(STORE); } catch { /* ignore */ } }
  }
  function nextNumber(kind) {
    const y = new Date().getFullYear();
    const nums = listDocs().filter(x => x.type === kind && x.number).map(x => x.number);
    let best = null, bestN = -1;
    nums.forEach(nm => { const m = nm.match(/(\d+)(?!.*\d)/); if (m && +m[1] > bestN) { bestN = +m[1]; best = nm; } });
    return best ? bumpNumber(best) : `${kind === 'invoice' ? 'INV' : 'Q'}-${y}-001`;
  }
  /* New document: the very first one shows the sample; later ones copy your brand from your latest document */
  function createDoc(kind = 'quote') {
    const docs = listDocs();
    const base = docs.length ? loadDoc(docs[0].id) : null;
    const d = normalize(defaults());
    if (base) {
      Object.assign(d, {
        layout: base.layout, look: base.look, color: base.color, logo: base.logo, currency: base.currency, tax: base.tax,
        from: { ...base.from }, notes: base.notes, banner: base.banner,
        to: { name: '', contact: '', email: '', details: '' }, intro: '',
        items: [{ d: '', q: 1, r: 0, t: '', x: '', m: null }],
      });
    }
    d.type = kind === 'invoice' ? 'invoice' : 'quote';
    d.number = nextNumber(d.type);
    d.issued = iso(); d.due = iso(d.type === 'invoice' ? 14 : 30);
    const id = newId();
    saveDoc(id, d);
    return id;
  }

  let saveT;
  function flashSaved(saving) {
    const tag = $('#savedTag');
    if (!tag) return;
    tag.textContent = saving ? 'Saving…' : 'Saved ✓';
    tag.classList.toggle('busy', saving);
  }
  function save() {
    clearTimeout(saveT);
    flashSaved(true);
    saveT = setTimeout(flushSave, 300);
  }
  function flushSave() {
    if (!saveT || !currentId || !state) return;
    clearTimeout(saveT); saveT = null;
    if (saveDoc(currentId, state)) { flashSaved(false); Drive.schedule(); }
    else toast('Couldn’t save. This browser’s storage is full. Export a backup and delete old documents.', 6000);
  }
  addEventListener('pagehide', flushSave);

  const getPath = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
  const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

  function applyAccent() {
    applyRootAccent(state.color);
    $$('.sw[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === state.color));
    $('.sw-custom')?.classList.toggle('on', !SWATCHES.includes(state.color));
  }
  function renderLogo() {
    $('#logoPreview').innerHTML = state.logo ? `<img src="${esc(state.logo)}" alt="">` : `<span class="mono">${esc(initials(state.from.name))}</span>`;
    $('#logoRemove').hidden = !state.logo;
  }
  function renderTypeLabels() {
    const q = state.type === 'quote';
    setSeg($('#typeSeg'), state.type);
    $('#dueLabel').textContent = q ? 'Valid until' : 'Due date';
    $('#clientTitle').textContent = q ? 'Prepared for' : 'Bill to';
  }
  function renderLayout() {
    const p = state.layout === 'proposal';
    $('#editor').dataset.layout = state.layout;
    $('#previewPane').dataset.layout = state.layout;
    $$('.lay').forEach(b => b.classList.toggle('on', b.dataset.layout === state.layout));
    $$('#looks .look').forEach(b => b.classList.toggle('on', b.dataset.look === (state.look || '')));
    /* Simple = the fast draft (brand, sections, prices). Custom adds looks, links, visual pages, ranges and no-total.
       A document that already uses any of those always opens in Custom. */
    const usesCustom = !!(state.look || state.noTotal || state.items.some(it => it.v || it.u || it.r2 > it.r || it.g));
    const mode = usesCustom ? 'custom' : store.get('slip:mode', 'simple');
    $('#editor').dataset.mode = mode;
    $$('#modes .look').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    $('#itemsTitle').textContent = p ? 'Sections' : 'Line items';
    $('#addLabel').textContent = p ? 'Add section' : 'Add item';
    $('#addItemTop').textContent = p ? 'Add section' : 'Add line';
    $('#addHintTitle').textContent = p ? 'One section per thing you charge for' : 'One line per thing you charge for';
    $('#addHintText').textContent = p
      ? 'Website design, Logo, SEO… add as many as you need. Each gets its own page.'
      : 'Design, development, hosting… add as many lines as you need.';
    fitPreview();
  }
  function renderTotals() {
    const t = totals(state);
    $('#tSub').textContent = money(t.sub, state.currency);
    $('#tTot').textContent = money(t.total, state.currency);
    $('#noTotal').checked = !!state.noTotal;
    $('#totalsMini').classList.toggle('off', !!state.noTotal);
  }

  function thumbHTML(m, ctx) {
    if (m && m.k === 'none') return '<span class="m-none">No visual</span><span>Choose</span>';
    return mediaHTML(m, { ...ctx, lite: true, prefix: 't' }) + '<span>Change</span>';
  }
  function itemHTML(it, i) {
    const open = state.layout === 'proposal' || openItems.has(i);
    const sid = (!it.m || it.m.k === 'scene') ? sceneFor(it.m, { title: it.d, text: it.x }) : '';
    return `<div class="item${open ? ' open' : ''}${it.v ? ' is-visual' : ''}" data-i="${i}">
      <div class="item-row">
        <input class="it-d" data-f="d" placeholder="${state.layout === 'proposal' ? 'Section title' : 'What you’re delivering'}" value="${esc(it.d)}" aria-label="Description">
        <input class="it-q" data-f="q" type="number" min="0" step="any" inputmode="decimal" value="${it.q}" aria-label="Quantity">
        <input class="it-r" data-f="r" type="number" min="0" step="any" inputmode="decimal" value="${it.r}" aria-label="Rate">
        <output class="it-a">${priceText(it, state.currency)}</output>
        <button type="button" class="it-x" data-del="${i}" aria-label="Remove">×</button>
      </div>
      <div class="item-more">
        <button type="button" class="m-thumb" data-only="proposal" data-pick="${i}" data-sid="${sid}" draggable="true" title="Click to choose · drop an image or video here · drag onto another section to swap" aria-label="Choose visual">${thumbHTML(it.m, { title: it.d, text: it.x })}</button>
        <div class="item-more-fields">
          <div class="t-row">
            <input data-f="t" placeholder="Timeline, e.g. 2.5 weeks" value="${esc(it.t)}" aria-label="Timeline">
            <button type="button" class="ai-mini" data-ai="${i}" title="Write the timeline and details with AI">✨ Write</button>
          </div>
          <label class="range-row"><span>Price range: up to</span><input data-f="r2" type="number" min="0" step="any" inputmode="decimal" placeholder="optional" value="${it.r2 > it.r ? it.r2 : ''}" aria-label="Top of the price range"><small>Rate is the “from” price</small></label>
          <textarea data-f="x" rows="3" placeholder="What’s included, one point per line. Use --- for a divider." aria-label="Details">${esc(it.x)}</textarea>
          <input data-f="u" data-only="proposal" type="url" inputmode="url" placeholder="Link (optional), e.g. a reference or live example: https://…" value="${esc(it.u || '')}" aria-label="Link">
          <div class="item-tools" data-only="proposal">
            <label class="check"><input type="checkbox" data-f="v"${it.v ? ' checked' : ''}> Visual page <small>full-page visual, no text or price</small></label>
            <span class="mv"><button type="button" data-mv="${i}:-1" aria-label="Move up" title="Move up"${i ? '' : ' disabled'}>↑</button><button type="button" data-mv="${i}:1" aria-label="Move down" title="Move down"${i < state.items.length - 1 ? '' : ' disabled'}>↓</button></span>
          </div>
          ${it.v ? `<div class="refs" data-only="proposal">
            <div class="refs-h"><b>References on this page</b><span class="gl">${[['', 'Mosaic'], ['grid', 'Grid'], ['strip', 'Strip'], ['bento', 'Bento']].map(([v, n]) => `<button type="button" data-gl="${i}:${v}" class="${(it.gl || '') === v ? 'on' : ''}">${n}</button>`).join('')}</span></div>
            <input data-f="x" placeholder="Caption for the first visual" value="${esc((it.x || '').split('\n')[0])}" aria-label="Caption for the first visual">
            <input data-f="t" placeholder="Tags for the first visual, e.g. Advert, 3D" value="${esc(it.t || '')}" aria-label="Tags for the first visual">
            ${(it.g || []).map((r, k) => `<div class="ref-row">
              <button type="button" class="g-thumb" data-pick="${i}:${k}" aria-label="Choose visual for reference ${k + 2}">${mediaHTML(r.m && r.m.k !== 'none' ? r.m : { k: 'scene', v: 'orbit' }, { lite: true, prefix: `r${i}${k}` })}</button>
              <span><input data-g="${k}" data-gf="c" placeholder="Caption" value="${esc(r.c || '')}" aria-label="Caption"><input data-g="${k}" data-gf="t" placeholder="Tags, e.g. Website, E-commerce" value="${esc(r.t || '')}" aria-label="Tags"><input data-g="${k}" data-gf="u" type="url" placeholder="Link: https://…" value="${esc(r.u || '')}" aria-label="Link"></span>
              <button type="button" class="it-x" data-del-ref="${i}:${k}" aria-label="Remove reference">×</button>
            </div>`).join('')}
            ${(it.g || []).length < 8 ? `<button type="button" class="add-ref" data-add-ref="${i}">+ Add reference</button>` : ''}
          </div>` : ''}
        </div>
      </div>
      <button type="button" class="more-toggle" data-only="classic" data-toggle="${i}">${open ? '− Hide details' : '+ Timeline & details'}</button>
    </div>`;
  }
  function renderItems(enterIdx = -1) {
    $('#items').innerHTML = state.items.map(itemHTML).join('');
    const n = state.items.length;
    $('#itemsCount').textContent = `${n} ${state.layout === 'proposal' ? (n === 1 ? 'section' : 'sections') : (n === 1 ? 'line' : 'lines')}`;
    if (enterIdx >= 0) $(`.item[data-i="${enterIdx}"]`)?.classList.add('enter');
    hydrateLocal($('#items'));
  }
  function refreshThumb(target) {
    if (target === 'banner') {
      $('#bannerThumb').innerHTML = thumbHTML(state.banner || { k: 'scene', v: 'orbit' }, {});
      hydrateLocal($('#bannerThumb'));
      return;
    }
    const it = state.items[target];
    const btn = $(`.m-thumb[data-pick="${target}"]`);
    if (!it || !btn) return;
    btn.dataset.sid = (!it.m || it.m.k === 'scene') ? sceneFor(it.m, { title: it.d, text: it.x }) : '';
    btn.innerHTML = thumbHTML(it.m, { title: it.d, text: it.x });
    hydrateLocal(btn);
  }

  let pvT;
  function preview(animate = false) {
    clearTimeout(pvT);
    if (animate) { $('#previewPane').scrollTop = 0; mount($('#preview'), state, true); }
    else pvT = setTimeout(() => mount($('#preview'), state, false), 120);
  }
  function update() { save(); renderTotals(); preview(false); }

  /* Proposal previews at desktop width, zoomed down to fit the pane */
  const PREVIEW_W = 1120;
  function fitPreview() {
    const pane = $('#previewPane'), pv = $('#preview');
    if (!pane || !pv) return;
    const avail = pane.clientWidth - 56;
    if (state.layout === 'proposal' && avail >= 520 && avail < PREVIEW_W) {
      pv.style.width = PREVIEW_W + 'px';
      pv.style.zoom = (avail / PREVIEW_W).toFixed(4);
    } else { pv.style.width = ''; pv.style.zoom = ''; }
  }

  function fillForm() {
    $$('[data-bind]').forEach(el => { el.value = getPath(state, el.dataset.bind) ?? ''; });
    renderLayout();
    renderItems();
    refreshThumb('banner');
    renderLogo();
    renderTypeLabels();
    applyAccent();
    renderTotals();
  }

  function addItem(focus = true) {
    state.items.push({ d: '', q: 1, r: 0, t: '', x: '', m: null });
    renderItems(state.items.length - 1);
    if (focus) $('.item:last-child .it-d').focus();
    update();
  }

  async function setLogo(file) {
    if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file');
    try { state.logo = await shrinkImage(file, 320, .9); renderLogo(); update(); toast('Logo added'); }
    catch { toast('Could not read that image'); }
  }

  const bumpNumber = s => (/\d+(?!.*\d)/.test(s) ? s.replace(/(\d+)(?!.*\d)/, m => String(+m + 1).padStart(m.length, '0')) : s);

  /* ---------- visual picker ---------- */
  let pickTarget = null, stockResults = [], stockType = 'videos', linkParsed = null;
  const dlg = () => $('#mediaDlg');

  const refOf = t => { if (typeof t !== 'string' || !t.includes(':')) return null; const [i, k] = t.split(':').map(Number); return state.items[i]?.g?.[k] || null; };
  function targetMedia() { const r = refOf(pickTarget); return r ? r.m : pickTarget === 'banner' ? state.banner : state.items[pickTarget]?.m; }
  function targetCtx() {
    const r = refOf(pickTarget);
    if (r) return { title: r.c || '', text: '' };
    if (pickTarget === 'banner') return { title: '', text: '' };
    const it = state.items[pickTarget];
    return { title: it.d, text: it.x };
  }
  /* target: a section index or 'banner' */
  const getMedia = t => (refOf(t) ? refOf(t).m : t === 'banner' ? state.banner : state.items[t]?.m);
  function setMediaFor(target, m) {
    const r = refOf(target);
    if (r) { r.m = m; renderItems(); update(); return; }
    if (target === 'banner') state.banner = m;
    else if (state.items[target]) state.items[target].m = m;
    else return;
    refreshThumb(target);
    update();
  }
  function applyMedia(m) {
    setMediaFor(pickTarget, m);
    dlg().close();
  }

  function renderSceneGrid() {
    const cur = targetMedia(), ctx = targetCtx();
    const auto = pickTarget === 'banner' ? 'orbit' : Scenes.match(ctx.title, ctx.text);
    const selected = cur && cur.k === 'scene' ? cur.v : (!cur && pickTarget !== 'banner') ? 'auto' : (!cur ? 'orbit' : '');
    const tiles = [];
    if (pickTarget !== 'banner') tiles.push(`<button type="button" class="sc-tile${selected === 'auto' ? ' on' : ''}" data-scene="auto"><div class="sc-prev">${Scenes.html(auto, 'g')}</div><span>Auto-match<small>${Scenes.NAME[auto]}</small></span></button>`);
    Scenes.LIST.forEach(s => tiles.push(`<button type="button" class="sc-tile${selected === s.id ? ' on' : ''}" data-scene="${s.id}"><div class="sc-prev">${Scenes.html(s.id, 'g')}</div><span>${s.name}${s.id === auto && pickTarget !== 'banner' ? '<small>Suggested</small>' : ''}</span></button>`));
    $('#sceneGrid').innerHTML = tiles.join('');
  }

  function setTab(tab) {
    setSeg($('#mTabs'), tab);
    $$('.mpanel').forEach(p => { p.hidden = p.dataset.panel !== tab; });
    if (tab === 'stock') renderStockPanel();
    if (tab === 'upload') renderUploadMode();
  }

  function openPicker(target) {
    pickTarget = target;
    const ref = refOf(target);
    const it = target === 'banner' || ref ? null : state.items[target];
    $('#mdlgFor').textContent = ref ? `For reference “${ref.c || 'untitled'}”` : target === 'banner' ? 'For the closing banner under your total' : `For “${it.d || 'Untitled section'}”`;
    renderSceneGrid();
    // photo-friendly search words per kind of section ("Website redesign" → "laptop desk")
    const SQ = { browser: 'laptop desk', code: 'programming laptop', devices: 'smartphone laptop', print: 'printed brochure', brand: 'design studio',
      growth: 'business analytics', motion: 'video camera', social: 'smartphone social media', chat: 'team meeting', photo: 'photographer camera', cube: '3d render', orbit: 'abstract light' };
    const sid = it ? Scenes.match(it.d, it.x) : 'orbit';
    $('#stockQ').value = it && sid !== 'orbit' ? SQ[sid] : it ? (it.d || '').replace(/\b(update|redesign|corrections?|refresh)\b/gi, '').trim() || 'workspace' : 'abstract light';
    $('#linkIn').value = ''; $('#linkPrev').innerHTML = ''; $('#linkMsg').textContent = ''; $('#linkUse').disabled = true; linkParsed = null;
    $('#upStatus').textContent = '';
    const cur = targetMedia();
    setTab(!cur || cur.k === 'scene' || cur.k === 'none' ? 'motion' : 'link');
    if (cur && ['img', 'vid', 'yt', 'vimeo'].includes(cur.k) && !String(cur.v).startsWith('data:') && !String(cur.v).startsWith('local:')) {
      $('#linkIn').value = cur.k === 'yt' ? `https://youtu.be/${cur.v}` : cur.k === 'vimeo' ? `https://vimeo.com/${cur.v}` : cur.v;
      onLinkInput();
    }
    dlg().showModal();
  }

  /* Stock: a free, no-account library (Openverse), optional Pexels key, or browse sites yourself */
  let stockSrc = 'free', lastStock = '';
  const enc = encodeURIComponent;
  const slug = q => q.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const STOCK_SITES = [
    { name: 'Pexels', kind: 'Free photos & videos', url: q => `https://www.pexels.com/search/${enc(q)}/`,
      how: 'Copy the photo’s page link and paste it in <b>Link</b>. Slip turns it into the image. For a video, right-click it while it plays → <em>Copy video address</em>.' },
    { name: 'Unsplash', kind: 'Free photos', url: q => `https://unsplash.com/s/photos/${enc(slug(q))}`,
      how: 'Right-click the photo → <em>Copy image address</em> (images.unsplash.com…) and paste it in <b>Link</b>.' },
    { name: 'Freepik', kind: 'Photos, vectors, 3D & video', url: q => `https://www.freepik.com/search?format=search&query=${enc(q)}`,
      how: 'Download with your Freepik account, then drop the file in <b>Upload</b>. Free Freepik files need a credit, so add “Image: Freepik” to the section text.' },
    { name: 'Pixabay', kind: 'Free photos & videos', url: q => `https://pixabay.com/images/search/${enc(q)}/`,
      how: 'Download the file, then use <b>Upload</b>. Pixabay doesn’t allow linking straight to its files.' },
    { name: 'Mixkit', kind: 'Free video clips', url: q => `https://mixkit.co/free-stock-video/${slug(q)}/`,
      how: 'Download the clip, then use <b>Upload</b>.' },
    { name: 'Pinterest', kind: 'Ideas & inspiration', url: q => `https://www.pinterest.com/search/pins/?q=${enc(q)}`,
      how: 'Right-click the image → <em>Copy image address</em>, paste in <b>Link</b>. Only use images you have the rights to.' },
  ];
  function renderSites() {
    const q = $('#stockQ').value.trim() || 'workspace';
    $('#stockSites').innerHTML = `<p class="mhint">Search with your own account on any of these sites. They open in a new tab. Then bring the file back as described.</p>` +
      STOCK_SITES.map(s => `<div class="site"><div><b>${s.name}</b><small>${s.kind}</small><p>${s.how}</p></div>
        <a class="btn" href="${esc(s.url(q))}" target="_blank" rel="noopener">Search “${esc(q)}” ↗</a></div>`).join('');
  }
  function renderStockPanel() {
    setSeg($('#stockSrc'), stockSrc);
    const hasKey = !!settings.pexels, pexelsLocked = stockSrc === 'pexels' && !hasKey;
    $('#stockFree').hidden = stockSrc !== 'free';
    $('#stockSetup').hidden = !pexelsLocked;
    $('#pexelsFoot').hidden = !(stockSrc === 'pexels' && hasKey);
    $('#stockType').hidden = stockSrc !== 'pexels' || !hasKey;
    $('#stockForm').hidden = pexelsLocked;
    $('#stockGo').textContent = stockSrc === 'sites' ? 'Update links' : 'Search';
    $('#stockGrid').hidden = stockSrc === 'sites' || pexelsLocked;
    $('#stockSites').hidden = stockSrc !== 'sites';
    setSeg($('#stockType'), stockType);
    if (stockSrc === 'sites') return renderSites();
    if (!pexelsLocked && lastStock !== `${stockSrc}|${stockType}|${$('#stockQ').value.trim()}`) runStock();
  }
  const licLabel = x => (x.license === 'cc0' || x.license === 'pdm' ? 'Public domain' : `CC ${String(x.license || '').toUpperCase()} ${x.license_version || ''}`.trim());
  async function searchOpenverse(q) {
    const r = await fetch(`https://api.openverse.org/v1/images/?q=${enc(q)}&page_size=20&license_type=commercial,modification&aspect_ratio=wide&mature=false`);
    if (r.status === 429) throw new Error('busy');
    if (!r.ok) throw new Error('net');
    const j = await r.json();
    return (j.results || [])
      .filter(x => /^https:\/\//.test(x.url || '') && (x.width || 1024) >= 640)
      .map(x => ({ th: x.thumbnail || x.url, m: { k: 'img', v: x.url, c: `${x.creator ? `${x.creator} · ` : ''}${licLabel(x)}` } }));
  }
  async function searchPexels(q, vids) {
    const url = vids
      ? `https://api.pexels.com/videos/search?query=${enc(q)}&per_page=24&orientation=landscape`
      : `https://api.pexels.com/v1/search?query=${enc(q)}&per_page=24&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: settings.pexels } });
    if (r.status === 401 || r.status === 403) throw new Error('key');
    if (!r.ok) throw new Error('net');
    const j = await r.json();
    return vids
      ? (j.videos || []).map(v => {
        const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4' && f.link);
        files.sort((a, b) => Math.abs((a.width || 0) - 1280) - Math.abs((b.width || 0) - 1280));
        return files[0] && { th: v.image, m: { k: 'vid', v: files[0].link, p: v.image, c: `${v.user?.name || 'Pexels'} · Pexels` } };
      }).filter(Boolean)
      : (j.photos || []).map(p => ({ th: p.src.medium, m: { k: 'img', v: p.src.large2x || p.src.large, c: `${p.photographer} · Pexels` } }));
  }
  async function runStock() {
    const q = $('#stockQ').value.trim() || 'technology';
    lastStock = `${stockSrc}|${stockType}|${$('#stockQ').value.trim()}`;
    const grid = $('#stockGrid');
    const vids = stockSrc === 'pexels' && stockType === 'videos';
    grid.innerHTML = '<div class="stock-msg">Searching…</div>';
    try {
      stockResults = stockSrc === 'free' ? await searchOpenverse(q) : await searchPexels(q, vids);
      grid.innerHTML = stockResults.length
        ? stockResults.map((s, i) => `<button type="button" class="stk" data-stk="${i}" title="${esc(s.m.c || '')}"><img src="${esc(s.th)}" alt="" loading="lazy">${vids ? '<span class="m-badge">▶ Video</span>' : ''}</button>`).join('')
        : '<div class="stock-msg">No results. Try a simpler word, like “desk” or “city”.</div>';
    } catch (e) {
      lastStock = '';
      const msg = { key: 'Pexels didn’t accept that key. Check it and try again.', busy: 'The free library is busy. Try again in a minute.' }[e.message]
        || (stockSrc === 'free' ? 'Couldn’t reach the free library. Check your connection.' : 'Couldn’t reach Pexels. Check your connection.');
      grid.innerHTML = `<div class="stock-msg">${msg}</div>`;
      if (e.message === 'key') { settings.pexels = ''; store.set(SETTINGS, settings); setTimeout(renderStockPanel, 1800); }
    }
  }

  function onLinkInput() {
    const p = parseMediaURL($('#linkIn').value);
    const msg = $('#linkMsg');
    linkParsed = null;
    $('#linkUse').disabled = true;
    if (!p) { msg.textContent = ''; $('#linkPrev').innerHTML = ''; return; }
    if (p.err) { msg.textContent = p.err; msg.className = 'link-msg bad'; $('#linkPrev').innerHTML = ''; return; }
    linkParsed = safeMedia(p);
    msg.className = 'link-msg';
    msg.textContent = p.c === 'Photo · Pexels' ? 'Pexels photo, found from the page link'
      : { yt: 'YouTube video, plays muted on a loop', vimeo: 'Vimeo video, plays muted on a loop', vid: 'Video file', img: 'Image' }[p.k];
    $('#linkPrev').innerHTML = mediaHTML(linkParsed, { prefix: 'k' });
    $('#linkUse').disabled = !linkParsed;
    // If the file can't load (wrong link, blocked hotlinking), say so instead of saving a broken visual
    const el = $('#linkPrev img.m-fill:not(.m-print), #linkPrev video');
    const shown = linkParsed && linkParsed.v;
    if (el) el.addEventListener('error', () => {
      if (!linkParsed || linkParsed.v !== shown) return;   // user already pasted something else
      msg.className = 'link-msg bad';
      msg.textContent = p.c === 'Photo · Pexels'
        ? 'Couldn’t load that Pexels photo. Right-click the photo on Pexels → Copy image address, and paste that instead.'
        : 'That file didn’t load. The link may be wrong, private, or blocked from use on other sites.';
      $('#linkUse').disabled = true;
    }, { once: true });
  }

  function renderUploadMode() {
    const cloud = settings.cloud && settings.preset;
    $('#upMode').innerHTML = cloud
      ? `Uploads go to your Cloudinary (<b>${esc(settings.cloud)}</b>) and work in every shared link.`
      : 'Images are compressed into the link. Videos stay on this device until you connect a host below.';
    $('#cloudName').value = settings.cloud || '';
    $('#cloudPreset').value = settings.preset || '';
  }
  async function cloudUpload(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', settings.preset);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloud)}/auto/upload`, { method: 'POST', body: fd });
    if (!r.ok) throw new Error('upload');
    const j = await r.json();
    if (!j.secure_url) throw new Error('upload');
    return j.resource_type === 'video'
      ? { k: 'vid', v: j.secure_url, p: j.secure_url.replace(/\.[a-z0-9]+$/i, '.jpg') }
      : { k: 'img', v: j.secure_url };
  }
  /* Turn a file into a media object: Cloudinary if connected, else embed images / keep videos locally */
  async function mediaFromFile(file, say = () => {}) {
    const isVid = file.type.startsWith('video/'), isImg = file.type.startsWith('image/');
    if (!isVid && !isImg) throw new Error('That isn’t an image or a video file.');
    if (settings.cloud && settings.preset) {
      say(`Uploading ${file.name}…`);
      try { return { m: safeMedia(await cloudUpload(file)), msg: 'Uploaded. It works in shared links' }; }
      catch { throw new Error('Upload failed. Check your Cloudinary cloud name and unsigned preset.'); }
    }
    if (isImg) {
      say('Optimising image…');
      return { m: { k: 'img', v: await shrinkImage(file, 1100, .66) }, msg: 'Image added and saved inside the link' };
    }
    if (file.size > 300e6) throw new Error('That video is over 300 MB. Try a shorter clip.');
    const key = 'local:' + Math.random().toString(36).slice(2, 12);
    await idb.put(key, file);
    localURLs.set(key, URL.createObjectURL(file));
    return { m: { k: 'vid', v: key }, msg: 'Video added. It only plays on this device until hosted', long: true };
  }
  async function handleUpload(file) {
    if (!file) return;
    const st = $('#upStatus');
    try {
      const r = await mediaFromFile(file, t => { st.textContent = t; });
      applyMedia(r.m);
      toast(r.msg, r.long ? 4200 : 2600);
    } catch (e) { st.textContent = e.message || 'Couldn’t add that file.'; }
  }

  /* ---------- drag & drop visuals ---------- */
  const SLIP_MIME = 'application/x-slip-media';
  const dragTypes = dt => (dt ? [...dt.types] : []);
  const isMediaDrag = dt => dragTypes(dt).some(t => t === 'Files' || t === 'text/uri-list' || t === 'text/html' || t === SLIP_MIME);

  /* What was dropped: an internal visual, a file, or a URL dragged from another tab */
  function dropPayload(dt) {
    if (dragTypes(dt).includes(SLIP_MIME)) return { swap: dt.getData(SLIP_MIME) };
    const file = [...(dt.files || [])].find(f => /^(image|video)\//.test(f.type));
    if (file) return { file };
    if (dt.files && dt.files.length) return { bad: 'That file isn’t an image or a video.' };
    let url = '';
    const html = dt.getData('text/html');
    if (html) {
      const m = html.match(/<(?:img|video|source)[^>]+src=["']([^"']+)["']/i);
      if (m) url = m[1].replace(/&amp;/g, '&');
    }
    if (!url) url = (dt.getData('text/uri-list') || '').split(/\r?\n/).find(l => l && !l.startsWith('#')) || dt.getData('text/plain') || '';
    url = url.trim();
    return url ? { url } : null;
  }
  /* Make sure a remote file actually loads here before using it (some sites block hotlinking) */
  function probe(m) {
    if (m.k !== 'img' && m.k !== 'vid') return Promise.resolve(true);
    return new Promise(res => {
      const el = document.createElement(m.k === 'vid' ? 'video' : 'img');
      const done = ok => { clearTimeout(t); res(ok); };
      const t = setTimeout(() => done(true), 8000);   // slow isn't the same as broken
      if (m.k === 'vid') { el.muted = true; el.preload = 'metadata'; el.onloadedmetadata = () => done(true); }
      else el.onload = () => done(true);
      el.onerror = () => done(false);
      el.src = m.v;
    });
  }
  function swapMedia(from, to) {
    from = from === 'banner' ? 'banner' : +from;
    if (from === to || (from !== 'banner' && !state.items[from])) return false;
    const a = getMedia(from), b = getMedia(to);
    if (from === 'banner') state.banner = b; else state.items[from].m = b;
    if (to === 'banner') state.banner = a; else state.items[to].m = a;
    refreshThumb(from); refreshThumb(to); update();
    toast('Visuals swapped');
    return true;
  }
  async function dropInto(target, dt) {
    const p = dropPayload(dt);
    if (!p) { toast('Drop an image or video file, or drag an image from another tab'); return false; }
    if (p.bad) { toast(p.bad); return false; }
    if (p.swap != null && p.swap !== '') return swapMedia(p.swap, target);
    let file = p.file;
    if (!file && /^data:image\//.test(p.url)) {   // image dragged straight out of a web page
      try { const b = await (await fetch(p.url)).blob(); file = new File([b], 'image', { type: b.type }); } catch { /* fall through */ }
    }
    if (file) {
      try {
        const r = await mediaFromFile(file, t => toast(t, 30000));
        setMediaFor(target, r.m);
        toast(r.msg, r.long ? 4200 : 2600);
        return true;
      } catch (e) { toast(e.message || 'Couldn’t add that file', 4500); return false; }
    }
    const parsed = parseMediaURL(p.url);
    if (!parsed || parsed.err) { toast(parsed?.err || 'Couldn’t use what was dropped', 6000); return false; }
    const m = safeMedia(parsed);
    if (!m) { toast('That link can’t be used'); return false; }
    toast('Checking the file…', 10000);
    if (!(await probe(m))) { toast('That site blocks using its files elsewhere. Download it and drop the file instead.', 6000); return false; }
    setMediaFor(target, m);
    toast(m.c ? `Visual added · ${m.c}` : 'Visual added');
    return true;
  }
  /* Which section (or the banner) sits under the pointer: in the form or the live preview */
  function dropTargetOf(el) {
    if (!el || !el.closest) return null;
    const thumb = el.closest('.m-thumb[data-pick]');
    if (thumb && !thumb.closest('[hidden]')) return { t: thumb.dataset.pick === 'banner' ? 'banner' : +thumb.dataset.pick, el: thumb };
    if (state.layout !== 'proposal' || !el.closest('#preview')) return null;
    const sec = el.closest('.pp-sec[data-item]');
    if (sec) return { t: +sec.dataset.item, el: sec.querySelector('.pp-media') || sec };
    const terms = el.closest('.pp-terms');
    if (terms) return { t: 'banner', el: terms.querySelector('.pp-banner') || terms };
    return null;
  }

  function initDragDrop() {
    let hot = null;
    const setHot = el => { if (hot === el) return; hot?.classList.remove('drop-hot'); hot = el; hot?.classList.add('drop-hot'); };
    const clear = () => { document.body.classList.remove('dragging', 'dragging-internal'); setHot(null); };
    const active = () => !$('#editor').hidden;

    // our own thumbnails can be dragged onto another section to swap visuals
    $('#form').addEventListener('dragstart', e => {
      const th = e.target.closest?.('.m-thumb[data-pick]');
      if (!th) return;
      e.dataTransfer.setData(SLIP_MIME, th.dataset.pick);
      e.dataTransfer.effectAllowed = 'move';
      document.body.classList.add('dragging', 'dragging-internal');
    });

    document.addEventListener('dragenter', e => {
      if (!active() || !isMediaDrag(e.dataTransfer)) return;
      document.body.classList.add('dragging');
      $('#dropHint').textContent = state.layout === 'proposal'
        ? (document.body.classList.contains('dragging-internal') ? 'Drop on another section to swap visuals' : 'Drop on a section in the form or the preview')
        : 'Visuals are used in the Proposal layout. Switch layout in step 1';
    });
    document.addEventListener('dragover', e => {
      if (!document.body.classList.contains('dragging')) return;
      e.preventDefault();
      if ($('#mediaDlg').open && e.target.closest?.('#mediaDlg')) { setHot($('#mediaDlg')); e.dataTransfer.dropEffect = 'copy'; return; }
      const t = dropTargetOf(e.target);
      setHot(t ? t.el : null);
      e.dataTransfer.dropEffect = t ? (dragTypes(e.dataTransfer).includes(SLIP_MIME) ? 'move' : 'copy') : 'none';
    });
    document.addEventListener('dragleave', e => { if (!e.relatedTarget) clear(); });
    document.addEventListener('dragend', clear);
    document.addEventListener('drop', async e => {
      const was = document.body.classList.contains('dragging');
      clear();
      if (e.defaultPrevented || !was) return;   // e.g. the logo drop zone handled it
      e.preventDefault();
      if ($('#mediaDlg').open && e.target.closest?.('#mediaDlg')) {
        if (await dropInto(pickTarget, e.dataTransfer)) dlg().close();
        return;
      }
      const t = dropTargetOf(e.target);
      if (t) {
        t.el.classList.add('drop-done');
        setTimeout(() => t.el.classList.remove('drop-done'), 700);
        dropInto(t.t, e.dataTransfer);
      } else if (state.layout === 'proposal') toast('Drop it on a section’s visual in the form or the preview');
    });
    // never let a stray drop navigate away from the editor
    addEventListener('dragover', e => { if (active() && isMediaDrag(e.dataTransfer)) e.preventDefault(); });
  }

  function initPicker() {
    const d = dlg();
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    $('#mTabs').addEventListener('click', e => { const b = e.target.closest('[data-val]'); if (b) setTab(b.dataset.val); });
    $('#sceneGrid').addEventListener('click', e => {
      const b = e.target.closest('[data-scene]');
      if (b) applyMedia(b.dataset.scene === 'auto' ? null : { k: 'scene', v: b.dataset.scene });
    });
    $('#mAuto').addEventListener('click', () => applyMedia(pickTarget === 'banner' ? null : null));
    $('#mNone').addEventListener('click', () => applyMedia({ k: 'none' }));

    $('#pexelsSave').addEventListener('click', () => {
      const k = $('#pexelsKey').value.trim();
      if (!k) return;
      settings.pexels = k; store.set(SETTINGS, settings); $('#pexelsKey').value = '';
      stockResults = []; renderStockPanel();
    });
    $('#pexelsReset').addEventListener('click', () => { settings.pexels = ''; store.set(SETTINGS, settings); stockResults = []; lastStock = ''; renderStockPanel(); });
    $('#stockForm').addEventListener('submit', e => { e.preventDefault(); stockSrc === 'sites' ? renderSites() : runStock(); });
    $('#stockSrc').addEventListener('click', e => { const b = e.target.closest('[data-val]'); if (!b) return; stockSrc = b.dataset.val; renderStockPanel(); });
    $('#stockType').addEventListener('click', e => { const b = e.target.closest('[data-val]'); if (!b) return; stockType = b.dataset.val; setSeg($('#stockType'), stockType); runStock(); });
    $('#stockGrid').addEventListener('click', e => { const b = e.target.closest('[data-stk]'); if (b) applyMedia(safeMedia(stockResults[+b.dataset.stk].m)); });

    $('#linkIn').addEventListener('input', onLinkInput);
    $('#linkUse').addEventListener('click', () => { if (linkParsed) applyMedia(linkParsed); });

    const drop = $('#upDrop'), input = $('#upInput');
    drop.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { handleUpload(input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
    // no preventDefault on drop here: the dialog-wide handler in initDragDrop adds the file
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('drag')));
    $('#cloudSave').addEventListener('click', () => {
      settings.cloud = $('#cloudName').value.trim().replace(/[^\w-]/g, '');
      settings.preset = $('#cloudPreset').value.trim().replace(/[^\w-]/g, '');
      store.set(SETTINGS, settings);
      renderUploadMode();
      toast(settings.cloud && settings.preset ? 'Cloudinary connected' : 'Cloudinary disconnected');
    });
  }

  /* ---------- undo for templates / AI ---------- */
  function restore(snap) {
    state = normalize(JSON.parse(snap));
    openItems.clear();
    state.items.forEach((it, i) => { if (it.t || it.x) openItems.add(i); });
    fillForm(); save(); preview(true);
    toast('Restored your previous version');
  }
  function afterBulkChange(msg, snap) {
    openItems.clear();
    state.items.forEach((_, i) => openItems.add(i));
    fillForm(); save(); preview(true);
    toast(msg, 7000, { label: 'Undo', fn: () => restore(snap) });
  }

  /* ---------- template gallery ---------- */
  const Templates = window.SlipTemplates || [];
  function renderTemplates(q = '') {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = Templates.filter(t => words.every(w => `${t.name} ${t.tags}`.toLowerCase().includes(w)));
    $('#tplGrid').innerHTML = list.length ? list.map((t, k) => {
      const total = t.items.reduce((s, i) => s + i.q * i.r, 0);
      return `<button type="button" class="tpl" data-tpl="${t.id}" style="--k:${k}">
        <div class="tpl-art">${Scenes.html(t.scene, 'tp')}</div>
        <b>${esc(t.name)}</b><small>${esc(t.intro)}</small>
        <span class="tpl-meta">${t.items.length} sections · ${money(total, state.currency)}</span></button>`;
    }).join('') : '<div class="tpl-empty">No templates match. Try another word.</div>';
  }
  function applyTemplate(t) {
    const snap = JSON.stringify(state);
    if (!state.from.tagline || state.from.tagline === 'Design · Build · Grow') state.from.tagline = t.tagline;
    state.intro = t.intro;
    state.notes = t.notes;
    state.items = t.items.map(it => ({ d: it.d, q: it.q, r: it.r, t: it.t, x: it.x, m: it.m ? { ...it.m } : null }));
    $('#tplDlg').close();
    afterBulkChange(`“${t.name}” applied. Edit anything you like`, snap);
  }
  function initTemplates() {
    const d = $('#tplDlg');
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    $('#tplBtn').addEventListener('click', () => { $('#tplQ').value = ''; renderTemplates(); d.showModal(); });
    $('#tplQ').addEventListener('input', e => renderTemplates(e.target.value));
    $('#tplGrid').addEventListener('click', e => {
      const b = e.target.closest('[data-tpl]');
      if (b) applyTemplate(Templates.find(t => t.id === b.dataset.tpl));
    });
  }

  /* ---------- AI: bring your own account ---------- */
  const AI = window.SlipAI;
  const ai = { kind: 'draft', i: null, mode: 'new', result: null, stage: 'form', timer: null };
  const sceneList = () => Scenes.LIST.map(s => ({ id: s.id, name: s.name }));
  const sceneIds = () => Scenes.LIST.map(s => s.id);
  function aiSettings() {
    settings.ai ||= { provider: 'chatbot', keys: {}, models: {}, compatBase: '', compatPreset: 'github' };
    settings.ai.keys ||= {}; settings.ai.models ||= {};
    return settings.ai;
  }
  const aiSave = () => store.set(SETTINGS, settings);
  function aiCfg(p = aiSettings().provider) {
    const a = aiSettings();
    const presetBase = AI.COMPAT_PRESETS.find(x => x.id === a.compatPreset)?.base || '';
    return { key: a.keys[p] || '', model: a.models[p] || AI.PROVIDERS[p].model || '', base: a.compatBase || presetBase };
  }
  function aiReady(p = aiSettings().provider) {
    if (p === 'chatbot') return true;
    const c = aiCfg(p);
    return p === 'compat' ? !!(c.base && c.model) : !!c.key;
  }

  function renderProviders() {
    const cur = aiSettings().provider;
    $('#aiProviders').innerHTML = Object.entries(AI.PROVIDERS).map(([id, p]) =>
      `<button type="button" role="radio" aria-checked="${id === cur}" class="ai-prov${id === cur ? ' on' : ''}${aiReady(id) ? ' ready' : ''}" data-prov="${id}"><i></i>${p.name}<small>${p.short}</small></button>`).join('');
  }
  function renderConn() {
    const p = aiSettings().provider, P = AI.PROVIDERS[p], c = aiCfg(p), box = $('#aiConn');
    if (p === 'chatbot') {
      box.innerHTML = `<p>No API key needed. Use your own <b>ChatGPT, Claude, Gemini or Copilot</b> account: Slip writes the prompt, you paste it into the chat, then paste the answer back here.</p>`;
      return;
    }
    if (p === 'compat') {
      box.innerHTML = `<p>Any OpenAI-compatible service, like <b>GitHub Models</b> (the API behind Copilot), OpenRouter, or a local Ollama. The service must allow requests from a browser.</p>
        <div class="grid2">
          <label class="field"><span>Service</span><select id="aiPreset">${AI.COMPAT_PRESETS.map(x => `<option value="${x.id}"${x.id === aiSettings().compatPreset ? ' selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="field"><span>Model</span><input id="aiModel" value="${esc(c.model)}" placeholder="model name from the service"></label>
        </div>
        <label class="field"><span>Base URL</span><input id="aiBase" value="${esc(c.base)}" placeholder="https://…/v1"></label>
        <div class="inline-form"><input id="aiKey" type="password" placeholder="${esc(AI.COMPAT_PRESETS.find(x => x.id === aiSettings().compatPreset)?.hint || 'API key')}" autocomplete="off" aria-label="API key"><button type="button" class="btn" id="aiSaveKey">Save</button></div>
        ${c.key ? '<p style="margin-top:8px">Key saved in this browser. <button type="button" class="linkish" id="aiForget">Forget key</button></p>' : ''}`;
      return;
    }
    box.innerHTML = c.key
      ? `<div class="connected"><span><b>● Connected</b> · key ending <code>${esc(c.key.slice(-4))}</code></span><button type="button" class="linkish" id="aiForget">Disconnect</button></div>
         <label class="field" style="margin:10px 0 0"><span>Model</span><input id="aiModel" value="${esc(c.model)}" placeholder="${esc(P.model)}"></label>`
      : `<p>Paste your <b>${P.name}</b> API key. It’s saved only in this browser and sent straight to ${P.name}, never put in links. <a href="${P.keyUrl}" target="_blank" rel="noopener">Get a key ↗</a></p>
         <div class="inline-form"><input id="aiKey" type="password" placeholder="${esc(P.keyHint)}" autocomplete="off" aria-label="${P.name} API key"><button type="button" class="btn primary" id="aiSaveKey">Connect</button></div>
         <p style="margin-top:8px">A paid ${P.name} chat subscription doesn’t include API access. To use your subscription instead, pick <b>Any chatbot</b>.</p>`;
  }
  function aiSetStage(stage) {
    ai.stage = stage;
    const chat = aiSettings().provider === 'chatbot';
    $('#aiForm').hidden = stage === 'result';
    $('#aiResult').hidden = stage !== 'result';
    $('#aiProviders').hidden = $('#aiConn').hidden = stage === 'result';
    $('#aiBack').hidden = stage !== 'result';
    $('#aiChat').hidden = !(chat && stage === 'copied');
    $('#aiImport').hidden = !(chat && stage === 'copied');
    $('#aiGo').textContent = stage === 'result' ? (ai.kind === 'draft' ? 'Apply to proposal' : 'Apply to section')
      : chat ? (stage === 'copied' ? 'Copy again' : 'Copy prompt') : 'Generate';
    $('#aiNote').textContent = stage === 'result' ? 'You can undo after applying.' : chat ? '' : aiReady() ? `Uses your ${AI.PROVIDERS[aiSettings().provider].name} account` : '';
    $$('[data-only-mode="draft"]').forEach(el => { el.hidden = ai.kind !== 'draft' || stage === 'result'; });
  }
  function aiStatus(msg, bad) { const el = $('#aiStatus'); el.className = 'ai-status' + (bad ? ' bad' : ''); el.innerHTML = msg; }

  function openAI(kind, i = null) {
    ai.kind = kind; ai.i = i; ai.result = null;
    const it = kind === 'section' ? state.items[i] : null;
    $('#aiTitle').textContent = kind === 'draft' ? 'Draft with AI' : 'Write this section with AI';
    $('#aiFor').textContent = kind === 'draft' ? 'Describe the job and get a full proposal back. You review it before anything changes.' : `For “${it.d || 'Untitled section'}”: writes the timeline and what’s included.`;
    $('#aiBriefLabel').textContent = kind === 'draft' ? 'The brief' : 'Extra context (optional)';
    $('#aiBrief').placeholder = kind === 'draft'
      ? 'e.g. Bakery in Lisbon needs a new 5-page website with online orders, a menu flyer and Instagram templates. Budget around $3,500, launch in 6 weeks.'
      : 'e.g. They already have a logo; include two revision rounds.';
    if (kind === 'section') $('#aiBrief').value = '';
    setSeg($('#aiMode'), ai.mode);
    $('#aiPaste').value = '';
    aiStatus('');
    renderProviders(); renderConn(); aiSetStage('form');
    $('#aiDlg').showModal();
  }
  function aiOpts() {
    return { mode: ai.mode, brief: $('#aiBrief').value, tone: $('#aiTone').value, prices: $('#aiPrices').checked };
  }
  function aiPrompt() {
    return ai.kind === 'draft' ? AI.draftPrompt(state, aiOpts(), sceneList()) : AI.sectionPrompt(state, ai.i, aiOpts());
  }
  function renderResult() {
    const r = ai.result, cur = state.currency;
    if (ai.kind === 'draft') {
      const total = r.sections.reduce((s, x) => s + x.quantity * x.rate, 0);
      $('#aiResult').innerHTML = `${r.intro ? `<div class="r-intro">${esc(r.intro)}</div>` : ''}
        ${r.sections.map((x, k) => `<div class="r-row" style="--k:${k}"><span><b>${esc(x.title)}</b><small>${esc(x.details.slice(0, 2).join(' · '))}${x.details.length > 2 ? ' …' : ''}</small></span><span>${esc(x.timeline)}</span><span>${x.rate ? money(x.quantity * x.rate, cur) : '-'}</span></div>`).join('')}
        <div class="r-total"><span>Total</span><span>${money(total, cur)}</span></div>`;
    } else {
      $('#aiResult').innerHTML = `<div class="r-row"><span><b>${esc(state.items[ai.i].d || 'Section')}</b><small>${esc(r.timeline)}</small></span><span></span><span>${r.rate ? money(r.rate, cur) : '-'}</span></div>
        ${r.details.map((x, k) => `<div class="r-row" style="--k:${k + 1}"><span>✓ ${esc(x)}</span><span></span><span></span></div>`).join('')}`;
    }
    aiStatus('');
    aiSetStage('result');
  }
  function applyAIResult() {
    const r = ai.result, snap = JSON.stringify(state);
    if (ai.kind === 'draft') {
      const polish = ai.mode === 'polish';
      if (r.intro) state.intro = r.intro;
      if (r.terms) state.notes = r.terms;
      state.items = r.sections.map((x, k) => {
        const prev = polish ? state.items[k] : null;
        return { d: x.title, q: x.quantity || 1, r: x.rate || 0, t: x.timeline, x: x.details.join('\n'), m: prev && prev.m ? prev.m : (x.visual ? { k: 'scene', v: x.visual } : null) };
      });
      $('#aiDlg').close();
      afterBulkChange('AI draft applied. Review prices before sending', snap);
    } else {
      applySection(ai.i, r, snap);
      $('#aiDlg').close();
    }
  }
  function applySection(i, r, snap) {
    const it = state.items[i];
    if (!it) return;
    if (r.timeline) it.t = r.timeline;
    if (r.details.length) it.x = r.details.join('\n');
    if (!it.r && r.rate) it.r = r.rate;
    openItems.add(i);
    renderItems(); update();
    toast('Section written', 7000, { label: 'Undo', fn: () => restore(snap) });
  }
  async function runAI(kind, prompt) {
    const p = aiSettings().provider;
    return AI.run(p, aiCfg(p), kind, prompt, sceneIds());
  }
  async function aiGenerate() {
    if (!aiReady()) { aiStatus('Connect your account above first.', true); $('#aiKey')?.focus(); return; }
    if (ai.kind === 'draft' && ai.mode === 'new' && !$('#aiBrief').value.trim()) { aiStatus('Write a short brief first.', true); $('#aiBrief').focus(); return; }
    const t0 = Date.now();
    const tick = () => aiStatus(`<span class="spin"></span>Writing with ${AI.PROVIDERS[aiSettings().provider].name}… ${Math.round((Date.now() - t0) / 1000)}s`);
    tick(); clearInterval(ai.timer); ai.timer = setInterval(tick, 1000);
    $('#aiGo').disabled = true;
    try { ai.result = await runAI(ai.kind, aiPrompt()); renderResult(); }
    catch (e) { aiStatus(esc(e.message || 'Something went wrong.'), true); }
    finally { clearInterval(ai.timer); $('#aiGo').disabled = false; }
  }
  async function aiCopyPrompt() {
    const text = AI.chatPrompt(aiPrompt(), ai.kind === 'draft' ? 'draft' : 'section');
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    $('#aiOpen').innerHTML = AI.CHATBOTS.map(c => `<a class="btn" href="${c.url}" target="_blank" rel="noopener">Open ${c.name} ↗</a>`).join('');
    aiSetStage('copied');
    aiStatus('Prompt copied ✓ Paste it into your chatbot, then paste its reply below.');
  }
  function aiImport() {
    try { ai.result = AI.parse($('#aiPaste').value, ai.kind === 'draft' ? 'draft' : 'section', sceneIds()); renderResult(); }
    catch (e) { aiStatus(esc(e.message), true); }
  }
  /* "✨ Write" on a section: instant if an API account is connected, otherwise open the dialog */
  async function quickSection(i, btn) {
    const p = aiSettings().provider;
    if (p === 'chatbot' || !aiReady(p)) return openAI('section', i);
    if (!state.items[i].d.trim()) { toast('Give the section a title first'); $(`.item[data-i="${i}"] .it-d`)?.focus(); return; }
    const snap = JSON.stringify(state);
    btn.classList.add('busy'); btn.textContent = 'Writing…';
    try {
      const r = await runAI('section', AI.sectionPrompt(state, i, { brief: '', tone: $('#aiTone').value }));
      applySection(i, r, snap);
    } catch (e) { toast(e.message || 'AI request failed', 5000); }
    finally { btn.classList.remove('busy'); btn.textContent = '✨ Write'; }
  }

  function initAI() {
    const d = $('#aiDlg');
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    d.addEventListener('close', () => clearInterval(ai.timer));
    $('#aiBtn').addEventListener('click', () => openAI('draft'));
    $('#aiProviders').addEventListener('click', e => {
      const b = e.target.closest('[data-prov]');
      if (!b) return;
      aiSettings().provider = b.dataset.prov; aiSave();
      renderProviders(); renderConn(); aiStatus(''); aiSetStage('form');
    });
    $('#aiConn').addEventListener('click', e => {
      const a = aiSettings(), p = a.provider;
      if (e.target.id === 'aiSaveKey') {
        const k = $('#aiKey').value.trim();
        if (p === 'compat') { a.compatBase = $('#aiBase').value.trim(); a.models.compat = $('#aiModel').value.trim(); if (k) a.keys.compat = k; }
        else { if (!k) return $('#aiKey').focus(); a.keys[p] = k; }
        aiSave(); renderProviders(); renderConn(); aiSetStage('form');
        aiStatus(aiReady(p) ? `${AI.PROVIDERS[p].name} connected ✓` : 'Add the base URL and model name.', !aiReady(p));
      }
      if (e.target.id === 'aiForget') { delete a.keys[p]; aiSave(); renderProviders(); renderConn(); aiStatus('Key removed from this browser.'); }
    });
    $('#aiConn').addEventListener('change', e => {
      const a = aiSettings();
      if (e.target.id === 'aiPreset') {
        const pr = AI.COMPAT_PRESETS.find(x => x.id === e.target.value);
        a.compatPreset = pr.id; if (pr.base) a.compatBase = pr.base;
        aiSave(); renderConn();
      }
      if (e.target.id === 'aiModel') { a.models[a.provider] = e.target.value.trim(); aiSave(); renderProviders(); }
      if (e.target.id === 'aiBase') { a.compatBase = e.target.value.trim(); aiSave(); renderProviders(); }
    });
    $('#aiMode').addEventListener('click', e => {
      const b = e.target.closest('[data-val]');
      if (!b) return;
      ai.mode = b.dataset.val; setSeg($('#aiMode'), ai.mode);
      $('#aiBrief').placeholder = ai.mode === 'polish' ? 'Optional: what to change, e.g. “make it sound more premium and split design from development”.' : 'Describe the client, what they need, budget and deadline…';
    });
    $('#aiGo').addEventListener('click', () => {
      if (ai.stage === 'result') return applyAIResult();
      if (aiSettings().provider === 'chatbot') return aiCopyPrompt();
      return aiGenerate();
    });
    $('#aiImport').addEventListener('click', aiImport);
    $('#aiBack').addEventListener('click', () => { aiStatus(''); aiSetStage('form'); });
  }

  /* ---------- edit text directly on the page ---------- */
  function syncForm(path) {
    const m = path.match(/^items\.(\d+)\.(\w)$/);
    if (m) {
      const i = +m[1], f = m[2], it = state.items[i], row = $(`.item[data-i="${i}"]`);
      if (!it || !row) return;
      const field = $(`[data-f="${f}"]`, row);
      if (field && document.activeElement !== field) field.value = it[f];
      if (f === 'q' || f === 'r') $('.it-a', row).textContent = money(it.q * it.r, state.currency);
      if (f === 'x' || f === 't') { openItems.add(i); row.classList.add('open'); }
      return;
    }
    const el = $(`[data-bind="${path}"]`);
    if (el && document.activeElement !== el) el.value = getPath(state, path) ?? '';
    if (path === 'from.name' && !state.logo) renderLogo();
  }
  const isMultiline = el => el.dataset.line == null && /^(intro|notes|items\.\d+\.x)$/.test(el.dataset.edit);
  function selectAll(el) {
    const r = document.createRange(); r.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function caretToEnd(el) {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  /* Read what the user typed: raw text, not innerText (which would bake in CSS like uppercase titles) */
  function readText(el) {
    let s = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) s += n.data;
      else if (n.nodeName === 'BR') s += '\n';
      else if (n.nodeType === 1) {
        if (/^(DIV|P)$/.test(n.nodeName) && s && !s.endsWith('\n')) s += '\n';
        s += readText(n);
      }
    });
    return s;
  }
  function applyEdit(el, final) {
    const path = el.dataset.edit;
    let v = readText(el).replace(/ /g, ' ').replace(/\n$/, '');
    if (!isMultiline(el)) v = v.replace(/\s*\n\s*/g, ' ');
    if (el.dataset.line != null) {                      // one bullet of a section's details
      const i = +path.split('.')[1], it = state.items[i];
      if (!it) return;
      const lines = it.x.split('\n'), k = +el.dataset.line;
      if (final && !v.trim()) lines.splice(k, 1); else lines[k] = final ? v.trim() : v;
      it.x = lines.join('\n');
      syncForm(path);
    } else if ('num' in el.dataset) {                   // prices: commit on blur
      if (!final) return;
      setPath(state, path, Math.max(0, parseFloat(v.replace(/[^0-9.]/g, '')) || 0));
      syncForm(path);
    } else {
      setPath(state, path, final && !isMultiline(el) ? v.trim() : v);
      syncForm(path);
    }
    save(); renderTotals();
  }
  /* "+ Add another section" on the page: adds it and puts the cursor in its title, right there */
  function addRef(i) {
    const it = state.items[i];
    if (!it || (it.g || []).length >= 8) return;
    (it.g ||= []).push({ m: null, u: '', c: '' });
    renderItems(); save(); preview(true);
    $(`.item[data-i="${i}"] .ref-row:last-of-type [data-gf="c"]`)?.focus();
  }
  function addSectionOnPage(visual) {
    state.items.push(visual ? { d: '', q: 1, r: 0, t: '', x: '', m: null, v: true }
      : { d: state.layout === 'proposal' ? 'New section' : 'New item', q: 1, r: 0, t: '', x: '', m: null });
    const i = state.items.length - 1;
    openItems.add(i);
    renderItems(i); save(); renderTotals();
    rerenderAndFocus(`[data-edit="items.${i}.d"]`, true);
    $(`#preview [data-edit="items.${i}.d"]`)?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    toast('Section added. Type its title, then fill in the details');
  }
  function rerenderAndFocus(selector, select) {
    mount($('#preview'), state, false);
    const el = $(selector, $('#preview'));
    if (el) { el.focus(); select ? selectAll(el) : caretToEnd(el); }
  }
  function initInlineEdit() {
    const host = $('#preview');
    host.addEventListener('input', e => {
      const el = e.target.closest?.('[data-edit]');
      if (!el) return;
      applyEdit(el, false);
      preview(false);   // refresh totals, contents table etc. (the field being typed in is left alone)
    });
    host.addEventListener('focusin', e => {
      const el = e.target.closest?.('[data-edit]');
      if (!el) return;
      $('#visBar').hidden = true;
      if ('num' in el.dataset) { cancelAnimationFrame(el._raf); el.textContent = String(getPath(state, el.dataset.edit) ?? 0); requestAnimationFrame(() => selectAll(el)); }
    });
    host.addEventListener('focusout', e => {
      const el = e.target.closest?.('[data-edit]');
      if (!el) return;
      applyEdit(el, true);
      setTimeout(() => preview(false), 0);
    });
    host.addEventListener('keydown', e => {
      const el = e.target.closest?.('[data-edit]');
      if (!el) return;
      if (e.key === 'Escape') { el.blur(); return; }
      const path = el.dataset.edit;
      if (el.dataset.line != null) {
        const k = +el.dataset.line;
        if (e.key === 'Enter') {                      // new bullet underneath, ready to type over
          e.preventDefault();
          applyEdit(el, false);
          const it = state.items[+path.split('.')[1]];
          const lines = it.x.split('\n'); lines.splice(k + 1, 0, 'New point'); it.x = lines.join('\n');
          syncForm(path); save();
          rerenderAndFocus(`[data-edit="${path}"][data-line="${k + 1}"]`, true);
        } else if (e.key === 'Backspace' && !readText(el).trim()) {   // empty bullet → remove it
          e.preventDefault();
          const it = state.items[+path.split('.')[1]];
          const lines = it.x.split('\n'); lines.splice(k, 1); it.x = lines.join('\n');
          syncForm(path); save();
          let prev = k - 1;
          while (prev >= 0 && !(lines[prev] || '').trim()) prev--;
          rerenderAndFocus(prev >= 0 ? `[data-edit="${path}"][data-line="${prev}"]` : '#none', false);
        }
        return;
      }
      if (e.key === 'Enter' && !isMultiline(el)) { e.preventDefault(); el.blur(); }
    });
    host.addEventListener('click', e => {
      if (e.target.closest('[data-add-section]')) { addSectionOnPage(); return; }
      if (e.target.closest('[data-add-visual]')) { addSectionOnPage(true); return; }
      const ar = e.target.closest('[data-add-ref]');
      if (ar) { addRef(+ar.dataset.addRef); return; }
      const b = e.target.closest('[data-add-point]');
      if (!b) return;
      const path = b.dataset.addPoint, it = state.items[+path.split('.')[1]];
      if (!it) return;
      const lines = it.x.trim() ? it.x.split('\n') : [];
      lines.push('New point');
      it.x = lines.join('\n');
      syncForm(path); save();
      rerenderAndFocus(`[data-edit="${path}"][data-line="${lines.length - 1}"]`, true);
    });
    // paste as plain text everywhere (for browsers without plaintext-only editing)
    host.addEventListener('paste', e => {
      if (!e.target.closest?.('[data-edit]')) return;
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
    });
  }

  /* ---------- hover a visual → Reframe / Change ---------- */
  let rf = null;   // active reframe session
  function initVisuals() {
    const bar = $('#visBar'), ov = $('#reframe'), zoom = $('#rfZoom');
    let barTarget = null, barEl = null, hideT;
    const targetOf = el => { const sec = el.closest('.pp-sec[data-item]'); if (sec) return +sec.dataset.item; return el.closest('.pp-terms') ? 'banner' : null; };
    const placeBar = () => {
      const r = barEl.getBoundingClientRect();
      bar.style.left = `${r.right - 12}px`;
      bar.style.top = `${Math.max(76, r.top + 12)}px`;
    };
    $('#preview').addEventListener('mouseover', e => {
      if (rf || document.body.classList.contains('dragging')) return;
      const media = e.target.closest('.pp-media');
      if (!media) return;
      const t = targetOf(media);
      if (t == null) return;
      clearTimeout(hideT);
      barTarget = t; barEl = media;
      const m = getMedia(t);
      bar.querySelector('[data-vis="reframe"]').hidden = !(m && (m.k === 'img' || m.k === 'vid'));
      placeBar();
      bar.hidden = false;
    });
    $('#preview').addEventListener('mouseout', e => {
      if (e.relatedTarget && (barEl?.contains(e.relatedTarget) || bar.contains(e.relatedTarget))) return;
      hideT = setTimeout(() => { bar.hidden = true; }, 250);
    });
    bar.addEventListener('mouseenter', () => clearTimeout(hideT));
    bar.addEventListener('mouseleave', () => { hideT = setTimeout(() => { bar.hidden = true; }, 250); });
    $('#previewPane').addEventListener('scroll', () => { bar.hidden = true; }, { passive: true });
    addEventListener('scroll', () => { bar.hidden = true; }, { passive: true });
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-vis]');
      if (!b) return;
      bar.hidden = true;
      if (b.dataset.vis === 'change') openPicker(barTarget);
      else startReframe(barTarget, barEl);
    });

    function follow() {
      if (!rf) return;
      if (!rf.media.isConnected) { endReframe(false); return; }
      const r = rf.media.getBoundingClientRect();
      Object.assign(ov.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      requestAnimationFrame(follow);
    }
    function paint() {
      const { fill, f } = rf;
      fill.style.objectPosition = `${f.x}% ${f.y}%`;
      fill.style.transform = `scale(${f.z})`;
      fill.style.transformOrigin = `${f.x}% ${f.y}%`;
      zoom.value = f.z;
    }
    function startReframe(target, mediaEl) {
      const fill = mediaEl.querySelector('.m-fill');
      const m = getMedia(target);
      if (!fill || !m || !(m.k === 'img' || m.k === 'vid')) return;
      rf = { target, media: mediaEl, fill, m, f: { x: 50, y: 50, z: 1, ...(m.f || {}) } };
      mediaEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      ov.hidden = false;
      document.body.classList.add('reframing');
      paint(); follow();
    }
    function endReframe(commit) {
      if (!rf) return;
      const { target, m, f } = rf;
      rf = null;
      ov.hidden = true;
      document.body.classList.remove('reframing');
      if (commit) {
        const nm = { ...m }; const sf = safeFrame(f);
        if (sf) nm.f = sf; else delete nm.f;
        setMediaFor(target, nm);
        toast('Framing saved');
      } else preview(false);
    }
    let drag = null;
    ov.addEventListener('pointerdown', e => {
      if (!rf || e.target.closest('.rf-bar')) return;
      try { ov.setPointerCapture(e.pointerId); } catch { /* fine without capture */ }
      const r = rf.media.getBoundingClientRect();
      // how far the picture overflows the frame decides how much a drag moves it
      const nw = rf.fill.naturalWidth || rf.fill.videoWidth || r.width, nh = rf.fill.naturalHeight || rf.fill.videoHeight || r.height;
      const s = Math.max(r.width / nw, r.height / nh);
      drag = { x: e.clientX, y: e.clientY, fx: rf.f.x, fy: rf.f.y,
        ox: Math.max(nw * s * rf.f.z - r.width, r.width * .15), oy: Math.max(nh * s * rf.f.z - r.height, r.height * .15) };
      ov.classList.add('grabbing');
    });
    ov.addEventListener('pointermove', e => {
      if (!drag || !rf) return;
      rf.f.x = Math.min(100, Math.max(0, drag.fx - (e.clientX - drag.x) / drag.ox * 100));
      rf.f.y = Math.min(100, Math.max(0, drag.fy - (e.clientY - drag.y) / drag.oy * 100));
      paint();
    });
    const stopDrag = () => { drag = null; ov.classList.remove('grabbing'); };
    ov.addEventListener('pointerup', stopDrag);
    ov.addEventListener('pointercancel', stopDrag);
    ov.addEventListener('wheel', e => {
      if (!rf) return;
      e.preventDefault();
      rf.f.z = Math.min(3, Math.max(1, rf.f.z - e.deltaY * .0015));
      paint();
    }, { passive: false });
    zoom.addEventListener('input', () => { if (rf) { rf.f.z = +zoom.value; paint(); } });
    $('#rfReset').addEventListener('click', () => { if (rf) { rf.f = { x: 50, y: 50, z: 1 }; paint(); } });
    $('#rfDone').addEventListener('click', () => endReframe(true));
    addEventListener('keydown', e => {
      if (!rf) return;
      if (e.key === 'Escape') endReframe(false);
      if (e.key === 'Enter') endReframe(true);
    });
  }

  function openDoc(id) {
    if (id !== currentId || !state) {
      flushSave();
      currentId = id;
      state = loadDoc(id) || normalize(defaults());
      openItems.clear();
      state.items.forEach((it, i) => { if (it.t || it.x) openItems.add(i); });
      fillForm();
      $('#customColor').value = state.color;
      flashSaved(false);
    }
    scrollTo({ top: 0 });
    $('#previewPane').scrollTop = 0;
    fitPreview();
    preview(true);
  }

  function initEditor(id) {
    if (editorReady) { openDoc(id); return; }
    editorReady = true;
    currentId = id;
    state = loadDoc(id) || normalize(defaults());
    settings = store.get(SETTINGS, {}) || {};
    state.items.forEach((it, i) => { if (it.t || it.x) openItems.add(i); });

    $('#currency').innerHTML = CURRENCIES.map(([c, n]) => `<option value="${c}">${c} · ${n}</option>`).join('');
    $('#swatches').innerHTML = SWATCHES.map(c => `<button type="button" class="sw" data-c="${c}" style="--c:${c}" aria-label="Brand color ${c}"></button>`).join('')
      + `<label class="sw sw-custom" title="Custom color" style="--c:#999"><input type="color" id="customColor" aria-label="Custom brand color"></label>`;

    fillForm();
    $('#customColor').value = state.color;
    setSeg($('#mobileTabs'), 'edit');
    initPicker();
    initTemplates();
    initAI();
    initDragDrop();
    initInlineEdit();
    initVisuals();
    flashSaved(false);
    preview(true);
    if ('ResizeObserver' in window) new ResizeObserver(fitPreview).observe($('#previewPane'));

    const form = $('#form');
    form.addEventListener('input', e => {
      const el = e.target;
      if (el.dataset.bind) {
        let v = el.value;
        if ('num' in el.dataset) v = Math.min(100, Math.max(0, parseFloat(v) || 0));
        setPath(state, el.dataset.bind, v);
        if (el.dataset.bind === 'from.name' && !state.logo) renderLogo();
        return update();
      }
      const item = el.closest('.item');
      if (item && el.dataset.gf) {
        const r = state.items[+item.dataset.i]?.g?.[+el.dataset.g];
        if (r) r[el.dataset.gf] = el.value;
        return update();
      }
      if (item && el.dataset.f) {
        const i = +item.dataset.i, it = state.items[i], f = el.dataset.f;
        if (f === 'v') { if (el.checked) it.v = true; else delete it.v; renderItems(); save(); renderTotals(); preview(true); return; }
        it[f] = f === 'q' || f === 'r' || f === 'r2' ? Math.max(0, parseFloat(el.value) || 0) : el.value;
        if (f === 'q' || f === 'r' || f === 'r2') $('.it-a', item).textContent = priceText(it, state.currency);
        if ((f === 'd' || f === 'x') && (!it.m || it.m.k === 'scene')) {
          const btn = $('.m-thumb', item);
          if (btn && btn.dataset.sid !== sceneFor(it.m, { title: it.d, text: it.x })) refreshThumb(i);
        }
        return update();
      }
      if (el.id === 'customColor') { state.color = el.value; applyAccent(); update(); }
    });
    $('#noTotal').addEventListener('change', e => { state.noTotal = e.target.checked; update(); });
    $('#looks').addEventListener('click', e => {
      const b = e.target.closest('.look');
      if (!b) return;
      state.look = b.dataset.look;
      $$('#looks .look').forEach(x => x.classList.toggle('on', x === b));
      save(); preview(true);
    });
    $('#modes').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      if (b.dataset.mode === 'simple' && (state.look || state.noTotal || state.items.some(it => it.v || it.u || it.r2 > it.r || it.g))) {
        toast('This document uses Custom features (look, links, visual pages, ranges or no total), so it stays in Custom.', 5000);
        return;
      }
      store.set('slip:mode', b.dataset.mode);
      renderLayout();
    });
    form.addEventListener('change', e => { if (e.target.dataset.bind === 'currency') { renderItems(); update(); } });

    $('#items').addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.closest('.item-row')) return;
      e.preventDefault();
      const i = +e.target.closest('.item').dataset.i;
      if (i === state.items.length - 1) addItem();
      else $(`.item[data-i="${i + 1}"] .it-d`)?.focus();
    });
    $('#items').addEventListener('click', e => {
      const pick = e.target.closest('[data-pick]');
      if (pick) return openPicker(pick.dataset.pick.includes(':') ? pick.dataset.pick : +pick.dataset.pick);
      const aiB = e.target.closest('[data-ai]');
      if (aiB) return quickSection(+aiB.dataset.ai, aiB);
      const tg = e.target.closest('[data-toggle]');
      if (tg) {
        const i = +tg.dataset.toggle;
        openItems.has(i) ? openItems.delete(i) : openItems.add(i);
        const item = tg.closest('.item');
        item.classList.toggle('open', openItems.has(i));
        tg.textContent = openItems.has(i) ? '− Hide details' : '+ Timeline & details';
        if (openItems.has(i)) $('[data-f="t"]', item).focus();
        return;
      }
      const del = e.target.closest('[data-del]');
      if (!del) return;
      const i = +del.dataset.del;
      del.closest('.item').classList.add('leave');
      setTimeout(() => {
        state.items.splice(i, 1);
        const shifted = [...openItems].filter(x => x !== i).map(x => (x > i ? x - 1 : x));
        openItems.clear(); shifted.forEach(x => openItems.add(x));
        if (!state.items.length) state.items.push({ d: '', q: 1, r: 0, t: '', x: '', m: null });
        renderItems(); update();
      }, reduceMotion ? 0 : 260);
    });
    $('#bannerThumb').addEventListener('click', () => openPicker('banner'));
    $('#addItem').addEventListener('click', () => addItem());
    $('#items').addEventListener('click', e => {
      const ar = e.target.closest('[data-add-ref]');
      if (ar) return addRef(+ar.dataset.addRef);
      const dr = e.target.closest('[data-del-ref]'), gl = e.target.closest('[data-gl]');
      if (dr || gl) {
        const [i, v] = (dr ? dr.dataset.delRef : gl.dataset.gl).split(':'), it = state.items[+i];
        if (!it) return;
        if (dr) { it.g.splice(+v, 1); if (!it.g.length) delete it.g; }
        else if (v) it.gl = v; else delete it.gl;
        renderItems(); save(); preview(true);
        return;
      }
      const b = e.target.closest('[data-mv]');
      if (!b) return;
      const [i, by] = b.dataset.mv.split(':').map(Number), j = i + by;
      if (j < 0 || j >= state.items.length) return;
      [state.items[i], state.items[j]] = [state.items[j], state.items[i]];
      renderItems(j); save(); preview(true);
    });
    $('#addItemTop').addEventListener('click', () => { addItem(); $('.item:last-child')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });

    $('#layouts').addEventListener('click', e => {
      const b = e.target.closest('[data-layout]');
      if (!b || b.dataset.layout === state.layout) return;
      state.layout = b.dataset.layout;
      renderLayout(); renderItems(); save(); preview(true);
    });

    $('#swatches').addEventListener('click', e => {
      const b = e.target.closest('.sw[data-c]');
      if (!b) return;
      state.color = b.dataset.c;
      $('#customColor').value = state.color;
      applyAccent(); update();
    });

    const drop = $('#logoDrop'), input = $('#logoInput');
    drop.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { setLogo(input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => setLogo(e.dataTransfer.files[0]));
    $('#logoRemove').addEventListener('click', () => { state.logo = ''; renderLogo(); update(); });

    $('#typeSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-val]');
      if (!b || b.dataset.val === state.type) return;
      state.type = b.dataset.val;
      if (state.type === 'invoice' && /^Q-/i.test(state.number)) state.number = state.number.replace(/^Q-/i, 'INV-');
      if (state.type === 'quote' && /^INV-/i.test(state.number)) state.number = state.number.replace(/^INV-/i, 'Q-');
      $('[data-bind="number"]').value = state.number;
      renderTypeLabels(); save(); renderTotals(); preview(true);
    });

    $('#mobileTabs').addEventListener('click', e => {
      const b = e.target.closest('[data-val]');
      if (!b) return;
      setSeg($('#mobileTabs'), b.dataset.val);
      $('#app').dataset.pane = b.dataset.val;
      if (b.dataset.val === 'preview') { scrollTo({ top: 0 }); fitPreview(); preview(true); }
    });

    $('#replayBtn').addEventListener('click', () => preview(true));

    // "New" never loses anything: the current document stays saved in Your documents
    $('#newBtn').addEventListener('click', () => {
      flushSave();
      const id = createDoc(state.type);
      location.hash = `#doc/${id}`;
      setTimeout(() => {
        $('[data-bind="to.name"]')?.focus();
        toast(`New ${state.type} ${state.number} started. Your previous one is saved`, 3500);
      }, 300);
    });

    $('#copyBtn').addEventListener('click', async () => {
      const url = await shareURL(state);
      try { await navigator.clipboard.writeText(url); }
      catch {
        const ta = Object.assign(document.createElement('textarea'), { value: url });
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      const span = $('#copyBtn span');
      span.textContent = 'Copied!';
      setTimeout(() => { span.textContent = 'Copy link'; }, 1600);
      const all = [state.banner, ...state.items.map(i => i.m)];
      const locals = all.filter(m => m && String(m.v || '').startsWith('local:')).length;
      if (locals) toast(`Link copied, but ${plural(locals, 'uploaded video')} only play${locals === 1 ? 's' : ''} on this device. Connect Cloudinary in Upload to share ${locals === 1 ? 'it' : 'them'}.`, 6000);
      else if (url.length > 12000) toast(`Link copied (${Math.round(url.length / 1024)} KB, long because of embedded images)`, 4200);
      else toast('Link copied. Send it to your client');
    });

    $('#openBtn').addEventListener('click', async () => { window.open(await shareURL(state), '_blank', 'noopener'); });
    $('#pdfBtn').addEventListener('click', () => printDoc(state));
  }

  /* =========================================================
     CLIENT VIEW
     ========================================================= */
  async function showViewer(code) {
    const host = $('#viewDoc');
    let d;
    try { d = normalize(await decode(code)); }
    catch {
      host.innerHTML = `<div class="broken"><h1>This link looks broken</h1><p>It may have been cut off when it was copied. Ask the sender for a fresh link.</p><a class="btn primary" href="${esc(baseURL())}">Make your own</a></div>`;
      $('#viewActions').hidden = true;
      return;
    }
    const kind = d.type === 'quote' ? (d.layout === 'proposal' ? 'Proposal' : 'Quote') : 'Invoice';
    document.title = `${kind}${d.number ? ' ' + d.number : ''} · ${d.from.name || 'Slip'}`;
    applyRootAccent(d.color);
    $('#viewer').classList.toggle('is-proposal', d.layout === 'proposal');
    mount(host, d, true, true);

    $('#viewActions').hidden = false;
    $('#vPdf').onclick = () => printDoc(d);

    const accept = $('#vAccept');
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.from.email) ? d.from.email : '';
    accept.hidden = !email;
    if (!email) return;
    const t = totals(d);
    const who = d.to.contact || d.to.name || '';
    const subject = d.type === 'quote' ? `Accepted: ${kind} ${d.number}` : `Re: Invoice ${d.number}`;
    const body = d.type === 'quote'
      ? `Hi ${d.from.name},\n\nWe're happy to go ahead with ${kind.toLowerCase()} ${d.number}${d.noTotal ? '' : ` for ${totalText(t, d.currency)}`}.\n\nThanks,\n${who}`
      : `Hi ${d.from.name},\n\nAbout invoice ${d.number} (${money(t.total, d.currency)}):\n\n\nThanks,\n${who}`;
    accept.textContent = d.type === 'quote' ? `Accept ${kind.toLowerCase()}` : 'Reply';
    accept.classList.remove('done');
    accept.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    accept.onclick = e => {
      if (d.type !== 'quote') return;
      e.preventDefault();
      const r = accept.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, d.color);
      accept.textContent = 'Accepted ✓';
      accept.classList.add('done');
      setTimeout(() => { location.href = accept.href; }, 650);
    };
  }

  /* =========================================================
     GOOGLE DRIVE SYNC: documents saved to the user's own Drive
     (one "Slip documents.json" file in a "Slip" folder; drive.file scope =
     Slip can only see files it created, nothing else in their Drive)
     ========================================================= */
  const isLocalHost = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const Drive = (() => {
    const SCOPE = 'https://www.googleapis.com/auth/drive.file';
    const FOLDER = 'Slip', FILE = 'Slip documents.json', KEY = 'slip:drive';
    const clientId = () => { const id = ((window.SlipConfig || {}).google || {}).clientId || ''; return /\.apps\.googleusercontent\.com$/.test(id) ? id : ''; };
    let token = null, tokenExp = 0, gisP = null, pushT = null, busy = false, status = 'off', statusMsg = '';
    const st = () => store.get(KEY, {}) || {};
    const setSt = patch => store.set(KEY, { ...st(), ...patch });

    function loadGis() {
      return gisP ||= new Promise((res, rej) => {
        if (window.google?.accounts?.oauth2) return res();
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
        s.onload = () => res();
        s.onerror = () => { gisP = null; rej(new Error('Couldn’t load Google sign-in. Check your connection.')); };
        document.head.appendChild(s);
      });
    }
    async function getToken(interactive) {
      if (token && Date.now() < tokenExp - 60000) return token;
      if (!interactive) return null;
      await loadGis();
      return new Promise((res, rej) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId(), scope: SCOPE,
          callback: r => {
            if (r.error) return rej(new Error(r.error === 'access_denied' ? 'Google Drive access wasn’t allowed.' : `Google sign-in failed (${r.error}).`));
            token = r.access_token; tokenExp = Date.now() + (r.expires_in || 3600) * 1000; res(token);
          },
          error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? 'The Google window was closed.' : 'Google sign-in was blocked. Allow pop-ups for this site and try again.')),
        });
        client.requestAccessToken({ prompt: st().on ? '' : 'consent' });
      });
    }
    async function api(url, opts = {}) {
      const r = await fetch(url.startsWith('http') ? url : `https://www.googleapis.com${url}`, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
      if (r.status === 401) { token = null; throw new Error('auth'); }
      if (!r.ok) { let m = ''; try { m = (await r.json()).error?.message || ''; } catch { /* ignore */ } throw new Error(`Google Drive error ${r.status}${m ? `: ${m}` : ''}`); }
      return r;
    }
    const snapshot = () => ({
      app: 'slip', version: 1, updated: Date.now(),
      docs: listDocs().map(m => ({ id: m.id, updated: m.updated, doc: store.get(docKey(m.id), null) })).filter(x => x.doc),
      deleted: store.get(DELETED, {}),
    });
    async function ensureFile() {
      let { folderId, fileId } = st();
      if (fileId) {
        try { const j = await (await api(`/drive/v3/files/${fileId}?fields=id,trashed`)).json(); if (!j.trashed) return fileId; }
        catch (e) { if (e.message === 'auth') throw e; }
      }
      const q = encodeURIComponent(`name='${FILE}' and trashed=false`);
      const found = await (await api(`/drive/v3/files?q=${q}&spaces=drive&fields=files(id)`)).json();
      if (found.files && found.files.length) { setSt({ fileId: found.files[0].id }); return found.files[0].id; }
      if (!folderId) {
        const f = await (await api('/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: FOLDER, mimeType: 'application/vnd.google-apps.folder' }) })).json();
        folderId = f.id; setSt({ folderId });
      }
      const b = 'slip' + Math.random().toString(36).slice(2);
      const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE, parents: [folderId], mimeType: 'application/json' })}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(snapshot())}\r\n--${b}--`;
      const made = await (await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body })).json();
      setSt({ fileId: made.id });
      return made.id;
    }
    /* newest version of each document wins; deletes win if they're newer than the last edit */
    function merge(remote) {
      if (!remote || !Array.isArray(remote.docs)) return 0;
      const deleted = { ...store.get(DELETED, {}) };
      Object.entries(remote.deleted || {}).forEach(([id, ts]) => { if (!deleted[id] || ts > deleted[id]) deleted[id] = ts; });
      store.set(DELETED, deleted);
      const local = new Map(listDocs().map(m => [m.id, m]));
      let changed = 0;
      remote.docs.forEach(x => {
        if (!x || !x.id || !x.doc || !/^[a-z0-9]+$/.test(x.id)) return;
        if (deleted[x.id] && deleted[x.id] >= (x.updated || 0)) return;
        const l = local.get(x.id);
        if (!l || (x.updated || 0) > (l.updated || 0)) { saveDoc(x.id, normalize(x.doc), x.updated || Date.now()); changed++; }
      });
      Object.entries(deleted).forEach(([id, ts]) => { const l = local.get(id); if (l && ts >= (l.updated || 0)) { deleteDoc(id, true); changed++; } });
      return changed;
    }
    function setStatus(s, msg = '') { status = s; statusMsg = msg; renderSyncBar(); }
    async function sync(interactive = false) {
      if (!clientId() || busy) return 0;
      const tok = await getToken(interactive).catch(e => { setStatus(st().on ? 'paused' : 'off'); throw e; });
      if (!tok) { setStatus(st().on ? 'paused' : 'off'); return 0; }
      busy = true; setStatus('syncing');
      try {
        if (currentId && state) flushSave();
        const fileId = await ensureFile();
        const remote = await (await api(`/drive/v3/files/${fileId}?alt=media`)).json().catch(() => null);
        const changed = merge(remote);
        await api(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot()) });
        setSt({ on: true, last: Date.now() });
        setStatus('ok');
        return changed;
      } catch (e) {
        setStatus(e.message === 'auth' ? 'paused' : 'error', e.message === 'auth' ? '' : e.message);
        throw e;
      } finally { busy = false; }
    }
    function schedule() {
      if (!st().on || !clientId()) return;
      clearTimeout(pushT);
      pushT = setTimeout(() => { sync(false).catch(() => {}); }, 4000);
    }
    function disconnect() {
      try { if (token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(token, () => {}); } catch { /* ignore */ }
      token = null; setSt({ on: false });
      setStatus('off');
    }
    function initStatus() {
      if (!clientId()) { status = 'unset'; return; }
      status = st().on ? (token ? 'ok' : 'paused') : 'off';
    }
    return {
      clientId, sync, schedule, disconnect, initStatus,
      get status() { return status; }, get msg() { return statusMsg; }, get last() { return st().last || 0; }, get on() { return !!st().on; },
    };
  })();

  function renderSyncBar() {
    const bar = $('#syncBar');
    if (!bar) return;
    const s = Drive.status, set = !!Drive.clientId();
    const text = {
      unset: '<b>Saved in this browser only.</b> Your documents stay on this device. Use <b>Export</b> to keep a backup or move them to another computer.',
      off: '<b>Saved in this browser only.</b> Clearing your browser data or switching computers would lose them. Connect Google Drive to keep a copy in your Drive and open them anywhere.',
      syncing: '<b>Syncing with Google Drive…</b>',
      ok: `<b>✓ Saved to your Google Drive</b> (in a folder called “Slip”) · synced ${ago(Drive.last)}. Open Slip on any device and connect the same Google account to see them.`,
      paused: '<b>Google Drive is connected</b>, but the sign-in has expired. Click <b>Sync now</b> to continue saving there.',
      error: `<b>Couldn’t sync with Google Drive.</b> ${esc(Drive.msg)}`,
    }[s] || '';
    $('#syncText').innerHTML = text;
    bar.dataset.state = s;
    const connected = ['ok', 'paused', 'syncing', 'error'].includes(s) && Drive.on;
    $('#syncBtn').hidden = connected || (!set && !isLocalHost());
    $('#syncNow').hidden = !connected;
    $('#syncNow').disabled = s === 'syncing';
    $('#syncOff').hidden = !connected;
    const tag = $('#savedTag');
    if (tag && !tag.classList.contains('busy')) tag.textContent = s === 'ok' ? 'Saved ✓ · Drive' : 'Saved ✓';
  }
  function initSync() {
    Drive.initStatus();
    $('#syncBtn').addEventListener('click', async () => {
      if (!Drive.clientId()) {
        toast(isLocalHost() ? 'Google Drive isn’t set up yet. Add your Google Client ID in config.js (see README).' : 'Google Drive saving isn’t available on this site yet.', 6000);
        return;
      }
      try {
        const changed = await Drive.sync(true);
        renderHome();
        toast(`Connected. Your documents are saved in Google Drive › Slip${changed ? ` (${plural(changed, 'document')} brought in)` : ''}`, 5000);
      } catch (e) { if (e.message !== 'auth') toast(e.message, 5000); }
    });
    $('#syncNow').addEventListener('click', async () => {
      try { const changed = await Drive.sync(true); renderHome(); toast(changed ? `Synced: ${plural(changed, 'document')} updated` : 'Everything’s up to date'); }
      catch (e) { if (e.message !== 'auth') toast(e.message, 5000); }
    });
    $('#syncOff').addEventListener('click', () => {
      Drive.disconnect(); renderHome();
      toast('Disconnected. Your documents stay in this browser, and the copy in Google Drive stays too.', 5000);
    });
    renderSyncBar();
  }

  /* =========================================================
     FEEDBACK: "Help shape the next update"
     ========================================================= */
  function initFeedback() {
    const fb = (window.SlipConfig || {}).feedback || {};
    const endpoint = /^https:\/\/[^\s"'<>]+$/.test(fb.endpoint || '') ? fb.endpoint : '';
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fb.email || '') ? fb.email : '';
    const ready = !!(endpoint || email);
    $('#homeFeedback').hidden = !ready && !isLocalHost();
    $('#navFeedback').hidden = !ready;
    $$('[data-foot="feedback"]').forEach(a => { a.hidden = !ready; });
    const ideas = (Array.isArray(fb.ideas) ? fb.ideas : []).slice(0, 12).map(x => String(x).slice(0, 60));
    $('#fbChips').innerHTML = ideas.map((x, i) => `<button type="button" class="fb-chip" aria-pressed="false" data-i="${i}">${esc(x)}</button>`).join('');
    $('#fbChips').addEventListener('click', e => {
      const c = e.target.closest('.fb-chip');
      if (c) c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    });
    const status = (msg, bad) => { const el = $('#fbStatus'); el.textContent = msg; el.classList.toggle('bad', !!bad); };
    if (store.get('slip:fbSent', 0)) status('Thanks for your earlier feedback! Feel free to send more any time.');
    $('#fbForm').addEventListener('submit', async e => {
      e.preventDefault();
      const wants = $$('.fb-chip[aria-pressed="true"]').map(c => c.textContent);
      const message = $('#fbText').value.trim(), from = $('#fbEmail').value.trim();
      if (!message && !wants.length) { status('Tap an idea or write a few words first.', true); return; }
      if (from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) { status('That email doesn’t look right. You can also leave it empty.', true); return; }
      if (!ready) { status('Feedback isn’t set up yet. Add a Formspree/Web3Forms endpoint or your email in config.js. (Only you can see this.)', true); return; }
      const text = `${wants.length ? `Would use: ${wants.join(', ')}\n\n` : ''}${message}`;
      if (!endpoint) {
        location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Slip feedback')}&body=${encodeURIComponent(text + (from ? `\n\nReply to: ${from}` : ''))}`;
        status('Your email app should open with the message ready to send. Thank you!');
        return;
      }
      $('#fbSend').disabled = true; status('Sending…');
      try {
        const body = { subject: 'Slip feedback', message: text, wants: wants.join(', '), email: from || undefined, page: location.origin + location.pathname };
        if (fb.accessKey) body.access_key = fb.accessKey;
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error();
        store.set('slip:fbSent', Date.now());
        $('#fbForm').reset(); $$('.fb-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
        status('Thank you! ♥ Your feedback was sent. It really helps decide what comes next.');
        burst(innerWidth / 2, $('#fbSend').getBoundingClientRect().top, '#ff5a5f');
      } catch { status('Couldn’t send right now. Please try again in a moment.', true); }
      finally { $('#fbSend').disabled = false; }
    });
  }

  /* =========================================================
     FOOTER: your credit + useful links (set in config.js → author)
     ========================================================= */
  function renderFooter() {
    const a = (window.SlipConfig || {}).author || {};
    const name = String(a.name || '').slice(0, 60);
    const url = /^https:\/\/[^\s"'<>]+$/.test(a.url || '') ? a.url : '';
    $('#footYear').textContent = new Date().getFullYear();
    $('#footCredit').innerHTML = name
      ? `Made by ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : `<b>${esc(name)}</b>`}`
      : '';
    $('#footSite').hidden = !url;
    if (url) $('#footSite').href = url;
  }

  /* =========================================================
     HOME: your documents + tips
     ========================================================= */
  let docsFilter = 'all', homeReady = false;
  function ago(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    if (s < 172800) return 'yesterday';
    if (s < 604800) return `${Math.round(s / 86400)} days ago`;
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const NEW_CARD = `<div class="dcard new">
      <span class="dc-plus">+</span><b>Start something new</b>
      <div class="dc-new-btns"><a class="btn primary" href="#new">Quote</a><a class="btn" href="#new/invoice">Invoice</a><a class="btn ghost" href="#new/template">Template</a></div>
    </div>`;
  /* Home: a highlighted strip with your latest work. Documents page: everything. */
  function renderHome() {
    const all = listDocs();
    const recent = all.slice(0, 3);
    const where = Drive.status === 'ok' ? 'synced to your Google Drive' : 'saved in this browser';
    $('#recentTitle').textContent = all.length ? 'Pick up where you left off' : 'Your documents will live here';
    $('#recentSub').textContent = all.length
      ? `${plural(all.length, 'document')} · ${where}${all.length > 3 ? ' · showing the 3 most recent' : ''}`
      : 'Create your first quote or invoice. It saves automatically.';
    $('#recentAll').hidden = !all.length;
    $('#recentAll').innerHTML = `View all ${all.length > 3 ? `${all.length} ` : ''}documents <span>→</span>`;
    $('#recentGrid').innerHTML = NEW_CARD + recent.map(docCardHTML).join('');
    if ($('#home').dataset.page === 'docs') renderDocs();
  }
  function renderDocs() {
    const all = listDocs();
    const q = $('#docsQ').value.trim().toLowerCase();
    const list = all.filter(x => (docsFilter === 'all' || x.type === docsFilter) && (!q || `${x.client} ${x.number}`.toLowerCase().includes(q)));
    setSeg($('#docsFilter'), docsFilter);
    $('#docsCount').textContent = all.length
      ? `${plural(all.length, 'document')}${all.length !== list.length ? ` · showing ${list.length}` : ''}`
      : 'Nothing saved yet. Your quotes and invoices will appear here.';
    $('#docsGrid').innerHTML = NEW_CARD + list.map(docCardHTML).join('') + (all.length && !list.length ? '<p class="docs-empty">No documents match.</p>' : '');
  }
  function docCardHTML(x, k) {
    return `
      <article class="dcard" data-id="${x.id}" style="--c:${esc(x.color || '#2f7bff')};--k:${k}">
        <button type="button" class="dc-open" data-act="open" aria-label="Open ${esc(x.client || x.number || 'document')}">
          <div class="dc-art"><span class="dc-kind">${x.type === 'invoice' ? 'Invoice' : x.layout === 'proposal' ? 'Proposal' : 'Quote'}</span><span class="dc-num">${esc(x.number || '')}</span></div>
          <h3>${esc(x.client) || '<span class="muted">No client yet</span>'}</h3>
          <p class="dc-total">${money(x.total || 0, x.currency || 'USD')}</p>
          <p class="dc-meta">${plural(x.items || 0, 'section')} · edited ${ago(x.updated)}</p>
        </button>
        <div class="dc-actions">
          <button type="button" data-act="dup">Duplicate</button>
          ${x.type === 'quote' ? '<button type="button" data-act="invoice" title="Create an invoice from this quote">→ Invoice</button>' : ''}
          <button type="button" data-act="link">Copy link</button>
          <button type="button" data-act="del" class="danger">Delete</button>
        </div>
      </article>`;
  }
  function renderTip() {
    const t = (window.SlipConfig || {}).tip || {};
    const links = (t.links || []).filter(l => l && l.label && ((l.url && /^(https:|upi:|mailto:)/i.test(l.url)) || l.copy));
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    $('#homeTip').hidden = !links.length && !local;
    $('#navTip').hidden = !links.length;
    $$('[data-foot="tip"]').forEach(a => { a.hidden = !links.length; });
    $('#tipTitle').textContent = t.title || 'Enjoying Slip?';
    $('#tipMsg').textContent = t.message || '';
    $('#tipLinks').innerHTML = links.length
      ? links.map((l, i) => `<div class="tip-link">${l.copy
        ? `<button type="button" class="btn" data-tipcopy="${i}">${esc(l.label)} · ${esc(l.copy)}</button>`
        : `<a class="btn primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ♥</a>`}${l.note ? `<small>${esc(l.note)}</small>` : ''}</div>`).join('')
      : '<p class="tip-dev">Only you can see this box (local preview). Add your tip links in <code>config.js</code> and buttons appear here for everyone.</p>';
    $('#tipLinks').onclick = async e => {
      const b = e.target.closest('[data-tipcopy]');
      if (!b) return;
      try { await navigator.clipboard.writeText(links[+b.dataset.tipcopy].copy); toast('Copied. Thank you! ♥'); } catch { toast(links[+b.dataset.tipcopy].copy); }
    };
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  }
  function initHome() {
    if (homeReady) return;
    homeReady = true;
    mount($('#heroDoc'), normalize(defaults()), false);   // live sample proposal in the hero
    initSync();
    initFeedback();
    renderFooter();
    $('#docsQ').addEventListener('input', renderDocs);
    $('#docsFilter').addEventListener('click', e => { const b = e.target.closest('[data-val]'); if (b) { docsFilter = b.dataset.val; renderDocs(); } });
    // in-page links (Feedback, Support): jump back to Home first if we're on the Documents page
    $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const go = () => $('#' + a.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
      if ($('#home').dataset.page !== 'home') { location.hash = '#home'; setTimeout(go, 120); } else go();
    }));
    const onCardAction = async e => {
      const b = e.target.closest('[data-act]');
      const card = e.target.closest('.dcard[data-id]');
      if (!b || !card) return;
      const id = card.dataset.id, act = b.dataset.act;
      if (act === 'open') { location.hash = `#doc/${id}`; return; }
      const d = loadDoc(id);
      if (!d) { toast('That document couldn’t be read'); return; }
      if (act !== 'link') setTimeout(() => Drive.schedule(), 0);
      if (act === 'dup') {
        d.number = nextNumber(d.type);
        saveDoc(newId(), d); renderHome(); toast(`Duplicated as ${d.number}`);
      } else if (act === 'invoice') {
        Object.assign(d, { type: 'invoice', number: nextNumber('invoice'), issued: iso(), due: iso(14) });
        const nid = newId(); saveDoc(nid, d); renderHome();
        toast(`Invoice ${d.number} created from the quote`, 6000, { label: 'Open', fn: () => { location.hash = `#doc/${nid}`; } });
      } else if (act === 'link') {
        await copyText(await shareURL(d)); toast('Link copied. Send it to your client');
      } else if (act === 'del') {
        const meta = listDocs().find(x => x.id === id);
        deleteDoc(id); renderHome();
        toast(`Deleted ${d.to.name || d.number || 'document'}`, 7000, { label: 'Undo', fn: () => {
          saveDoc(id, d);
          if (meta) store.set(DOCS, [...listDocs().filter(x => x.id !== id), { ...meta }].sort((a, b) => b.updated - a.updated));
          renderHome(); Drive.schedule();
        } });
      }
    };
    $('#docsGrid').addEventListener('click', onCardAction);
    $('#recentGrid').addEventListener('click', onCardAction);
    $('#exportBtn').addEventListener('click', () => {
      const docs = listDocs().map(m => ({ id: m.id, doc: store.get(docKey(m.id), null) })).filter(x => x.doc);
      if (!docs.length) { toast('Nothing to export yet'); return; }
      const blob = new Blob([JSON.stringify({ app: 'slip', version: 1, exported: new Date().toISOString(), docs }, null, 1)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `slip-backup-${iso()}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast(`Exported ${plural(docs.length, 'document')}`);
    });
    $('#importBtn').addEventListener('click', () => $('#importInput').click());
    $('#importInput').addEventListener('change', async e => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const docs = Array.isArray(data?.docs) ? data.docs : [];
        let n = 0;
        docs.forEach(x => { if (x && x.doc && typeof x.doc === 'object') { saveDoc(newId(), normalize(x.doc)); n++; } });
        renderHome(); if (n) Drive.schedule();
        toast(n ? `Imported ${plural(n, 'document')}` : 'No documents found in that file', 4000);
      } catch { toast('That isn’t a Slip backup file', 4000); }
    });
  }

  /* ---------- routing ---------- */
  function show(view) {
    ['home', 'editor', 'viewer'].forEach(v => { $('#' + v).hidden = v !== view; });
    document.body.dataset.view = view;
    if (view !== 'editor') { $('#visBar').hidden = true; $('#reframe').hidden = true; }
  }
  function route() {
    const h = location.hash;
    let m;
    if ((m = /^#q=(.+)$/.exec(h))) { show('viewer'); showViewer(m[1]); return; }
    /* #import=… : the same code as a share link, but it lands in this browser's documents as an editable copy.
       For moving a document into your own Slip with one click (another device, or a draft someone prepared for you). */
    if ((m = /^#import=(.+)$/.exec(h))) {
      const code = m[1];
      history.replaceState(null, '', '#docs');   // so a reload never imports twice
      decode(code).then(raw => {
        const id = newId();
        if (!saveDoc(id, normalize(raw))) throw new Error('storage');
        history.replaceState(null, '', `#doc/${id}`);
        route();
        toast('Saved to your documents. This copy is yours to edit.', 5000);
      }).catch(err => { console.error('Slip import failed:', err); route(); toast('That import link looks broken, or this browser’s storage is full.', 6000); });
      return;
    }
    if ((m = /^#new(?:\/(invoice|template))?$/.exec(h))) {
      flushSave();
      const id = createDoc(m[1] === 'invoice' ? 'invoice' : 'quote');
      history.replaceState(null, '', `#doc/${id}`);
      route();
      if (m[1] === 'template') setTimeout(() => $('#tplBtn').click(), 350);
      return;
    }
    if ((m = /^#doc\/([a-z0-9]+)$/.exec(h))) {
      if (store.get(docKey(m[1]), null)) { show('editor'); initEditor(m[1]); return; }
      toast('That document isn’t saved on this device');
    }
    flushSave();
    show('home');
    const page = h === '#docs' ? 'docs' : 'home';
    $('#home').dataset.page = page;
    $('#navDocs').classList.toggle('on', page === 'docs');
    document.title = page === 'docs' ? 'Your documents · Slip by Lasrado' : 'Slip by Lasrado: animated quotes & invoices';
    initHome(); renderHome(); renderTip(); renderSyncBar();
    if (Drive.on) Drive.sync(false).then(c => { if (c) renderHome(); }).catch(() => {});   // quiet refresh if still signed in
    scrollTo({ top: 0 });
  }
  migrateOldDraft();
  addEventListener('hashchange', route);
  route();
})();
