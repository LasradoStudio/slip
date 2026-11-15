/* Slip motion scenes: looping, brand-tinted vector animations that work as
   "pre-rendered" visuals. They cost nothing in the share link (just an id). */
window.SlipScenes = (() => {
  'use strict';

  const LIST = [
    { id: 'browser', name: 'Website',     kw: ['website', 'web', 'site', 'page', 'pages', 'homepage', 'landing', 'ui', 'ux', 'redesign', 'correction', 'corrections', 'update', 'wireframe'] },
    { id: 'code',    name: 'Development', kw: ['develop', 'development', 'dev', 'code', 'coding', 'build', 'frontend', 'backend', 'api', 'integration', 'wordpress', 'shopify', 'webflow', 'plugin', 'software', 'cms', 'ecommerce'] },
    { id: 'devices', name: 'Responsive',  kw: ['responsive', 'mobile', 'app', 'apps', 'ios', 'android', 'tablet', 'device', 'devices'] },
    { id: 'print',   name: 'Print',       kw: ['flyer', 'flyers', 'brochure', 'print', 'poster', 'card', 'cards', 'menu', 'catalog', 'catalogue', 'leaflet', 'packaging', 'stationery', 'magazine', 'book'] },
    { id: 'brand',   name: 'Branding',    kw: ['brand', 'branding', 'logo', 'identity', 'icon', 'icons', 'guideline', 'guidelines', 'typography', 'palette'] },
    { id: 'growth',  name: 'Growth',      kw: ['seo', 'marketing', 'ads', 'analytics', 'growth', 'strategy', 'campaign', 'ppc', 'report', 'reporting', 'audit', 'conversion', 'sales'] },
    { id: 'motion',  name: 'Video',       kw: ['video', 'videos', 'animation', 'animations', 'animated', 'motion', 'reel', 'reels', 'edit', 'editing', 'film', 'youtube', 'promo', 'trailer', 'explainer'] },
    { id: 'social',  name: 'Social',      kw: ['social', 'instagram', 'facebook', 'linkedin', 'tiktok', 'post', 'posts', 'community', 'influencer', 'content'] },
    { id: 'chat',    name: 'Support',     kw: ['support', 'maintenance', 'hosting', 'consult', 'consultation', 'meeting', 'training', 'retainer', 'care', 'email', 'chatbot', 'onboarding'] },
    { id: 'photo',   name: 'Photography', kw: ['photo', 'photos', 'photography', 'photographer', 'shoot', 'portrait', 'portraits', 'headshot', 'headshots', 'camera', 'wedding', 'event'] },
    { id: 'cube',    name: '3D',          kw: ['3d', 'render', 'renders', 'rendering', 'blender', 'model', 'modeling', 'modelling', 'product', 'cgi', 'visualization', 'visualisation', 'architectural'] },
    { id: 'orbit',   name: 'Abstract',    kw: [] },
  ];
  const IDS = new Set(LIST.map(s => s.id));
  const NAME = Object.fromEntries(LIST.map(s => [s.id, s.name]));

  /* deterministic gradient ids per render host, so re-renders diff cleanly */
  let prefix = 'x', n = 0;
  const seq = p => { prefix = p; n = 0; };

  const sd = s => `style="--sd:${s}s"`;
  const svg = body => `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  const grad = id => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="st-a"/><stop offset="1" class="st-b"/></linearGradient></defs>`;
  const win = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="win"/>` +
    [16, 28, 40].map(o => `<circle cx="${x + o}" cy="${y + 15}" r="3.5" class="dot"/>`).join('') +
    `<rect x="${x}" y="${y + 30}" width="${w}" height="1" class="w1"/>`;
  const HEART = 'M6 11S0 7 0 3.2C0 .6 2.9-.8 6 2 9.1-.8 12 .6 12 3.2 12 7 6 11 6 11z';

  const B = {
    browser: g => svg(`${grad(g)}<g class="flt">${win(60, 32, 280, 196)}
      <rect x="130" y="42" width="140" height="10" rx="5" class="w1"/>
      <rect x="78" y="80" width="140" height="16" rx="4" class="fa sx" ${sd(.2)}/>
      <rect x="78" y="104" width="118" height="7" rx="3.5" class="w3 sx" ${sd(.45)}/>
      <rect x="78" y="117" width="92" height="7" rx="3.5" class="w2 sx" ${sd(.6)}/>
      <rect x="78" y="134" width="56" height="17" rx="8.5" class="fb sp" ${sd(.85)}/>
      <rect x="236" y="78" width="88" height="74" rx="9" fill="url(#${g})" class="si" ${sd(.35)}/>
      <rect x="78" y="166" width="76" height="46" rx="8" class="w1 si" ${sd(1.05)}/>
      <rect x="162" y="166" width="76" height="46" rx="8" class="w1 si" ${sd(1.2)}/>
      <rect x="246" y="166" width="78" height="46" rx="8" class="w1 si" ${sd(1.35)}/>
      <path class="cur" d="M0 0v15l4-4 3.5 7 2.6-1.3-3.4-6.7H12z"/></g>`),

    code: g => {
      const L = [[[0, 26, 'fa'], [32, 44, 'w3'], [82, 18, 'fb']], [[14, 36, 'w3'], [56, 60, 'w2']], [[14, 22, 'fb'], [42, 30, 'w3'], [78, 48, 'fa']],
        [[28, 70, 'w2'], [104, 26, 'w3']], [[28, 40, 'fa'], [74, 54, 'w2']], [[14, 18, 'fb'], [38, 36, 'w3']], [[0, 30, 'fa'], [36, 28, 'w2'], [70, 44, 'w3']], [[14, 52, 'w2']]];
      let body = '';
      L.forEach((line, i) => {
        const y = 74 + i * 17;
        body += `<rect x="66" y="${y}" width="10" height="7" rx="2" class="w1"/>`;
        line.forEach(([x, w, c], j) => { body += `<rect x="${92 + x}" y="${y}" width="${w}" height="7" rx="3.5" class="${c} sx" ${sd((.15 + i * .3 + j * .09).toFixed(2))}/>`; });
      });
      return svg(`${grad(g)}<g class="flt">${win(50, 28, 300, 204)}${body}
        <rect class="caret" x="${92 + 66 + 6}" y="${74 + 7 * 17 - 2}" width="2" height="11"/>
        <rect x="262" y="40" width="72" height="12" rx="6" fill="url(#${g})" class="sp" ${sd(2.9)}/></g>`);
    },

    devices: g => svg(`${grad(g)}<g class="flt">
      <rect x="62" y="46" width="214" height="138" rx="10" class="win"/>
      <rect x="72" y="56" width="194" height="118" rx="5" fill="url(#${g})" class="o8"/>
      <rect x="84" y="70" width="80" height="10" rx="5" class="wf sx" ${sd(.3)}/>
      <rect x="84" y="88" width="120" height="6" rx="3" class="w4 sx" ${sd(.5)}/>
      <rect x="84" y="100" width="96" height="6" rx="3" class="w4 sx" ${sd(.6)}/>
      <rect x="84" y="118" width="40" height="14" rx="7" class="wf sp" ${sd(.8)}/>
      <rect x="190" y="116" width="62" height="46" rx="6" class="w4 si" ${sd(.9)}/>
      <path d="M40 188h258l-12 12H52z" class="w2"/><rect x="150" y="188" width="38" height="4" rx="2" class="w3"/></g>
      <g class="flt2"><rect x="282" y="86" width="74" height="136" rx="13" class="phone"/>
      <rect x="288" y="94" width="62" height="120" rx="9" fill="url(#${g})"/>
      <rect x="296" y="106" width="34" height="7" rx="3.5" class="wf sx" ${sd(.7)}/>
      <rect x="296" y="120" width="46" height="5" rx="2.5" class="w4 sx" ${sd(.85)}/>
      <rect x="296" y="160" width="46" height="40" rx="6" class="w4 si" ${sd(1)}/></g>`),

    print: g => svg(`${grad(g)}<g class="flt"><g transform="translate(200 236)">` +
      [['-15deg', '-60px', .7], ['15deg', '60px', .82], ['0deg', '0px', 1]].map(([r, tx, o]) =>
        `<g class="pap" style="--rot:${r};--tx:${tx}"><rect x="-58" y="-184" width="116" height="164" rx="6" class="paper" style="opacity:${o}"/>
        <rect x="-48" y="-174" width="96" height="46" rx="4" fill="url(#${g})"/>
        <rect x="-48" y="-118" width="70" height="7" rx="3.5" class="ink2"/>
        <rect x="-48" y="-104" width="88" height="5" rx="2.5" class="ink1"/><rect x="-48" y="-94" width="80" height="5" rx="2.5" class="ink1"/>
        <rect x="-48" y="-84" width="60" height="5" rx="2.5" class="ink1"/>
        <rect x="-48" y="-50" width="40" height="13" rx="6.5" class="fb"/><circle cx="34" cy="-44" r="10" class="fa"/></g>`).join('') +
      `</g></g>`),

    brand: g => `<div class="br-grid"></div>` + svg(`${grad(g)}
      <g class="br-rot"><circle cx="200" cy="130" r="96" class="ring"/><circle cx="200" cy="34" r="5" class="fb"/></g>
      <g class="br-rot2"><circle cx="200" cy="130" r="118" class="ring r2"/><circle cx="318" cy="130" r="3.5" class="wf"/></g>`) +
      `<div class="br-shape"></div><div class="br-aa">Aa</div><div class="br-sw"><i></i><i></i><i></i></div>`,

    growth: g => {
      const hs = [46, 70, 62, 98, 124, 156];
      const bars = hs.map((h, i) => `<rect x="${78 + i * 46}" y="${214 - h}" width="28" height="${h}" rx="5" class="${i === 5 ? 'fa' : 'bar'} sy" ${sd((.15 + i * .12).toFixed(2))}/>`).join('');
      const pts = hs.map((h, i) => `${92 + i * 46},${214 - h - 18}`).join(' ');
      return svg(`${grad(g)}<path d="M60 170H350M60 126H350M60 82H350" class="gridl"/><path d="M60 214H350M60 40V214" class="axis"/>${bars}
        <polyline points="${pts}" class="ln"/><circle cx="${92 + 5 * 46}" cy="${214 - 156 - 18}" r="6" class="wf sp" ${sd(1.6)}/>
        <g class="sp" ${sd(1.8)}><rect x="300" y="24" width="50" height="24" rx="12" fill="url(#${g})"/><path d="M318 41l7-7 7 7M325 34v11" class="arr"/></g>`);
    },

    motion: g => {
      const film = Array.from({ length: 11 }, (_, i) => `<rect x="${-280 + i * 70}" y="24" width="60" height="38" rx="6" class="${i % 3 === 1 ? 'fa o5' : 'w1'}"/>`).join('');
      const H = [10, 22, 34, 18, 40, 26, 14, 30, 46, 20, 36, 16, 28, 42, 24, 12, 32, 44, 18, 30, 22, 38, 14, 26, 10];
      const wave = H.map((h, i) => `<rect x="${78 + i * 10}" y="${222 - h / 2}" width="5" height="${h}" rx="2.5" class="wv" style="animation-delay:-${(i * .13).toFixed(2)}s"/>`).join('');
      return svg(`${grad(g)}<g class="film">${film}</g>
        <circle cx="200" cy="128" r="36" class="pulse"/><circle cx="200" cy="128" r="36" class="pulse p2"/>
        <circle cx="200" cy="128" r="36" fill="url(#${g})"/><path d="M191 112v32l26-16z" class="wf"/>${wave}`);
    },

    social: g => {
      const cards = [[46, 64], [254, 64], [150, 40]].map(([x, y], k) =>
        `<g class="si" ${sd((.2 + k * .25).toFixed(2))}><rect x="${x}" y="${y}" width="100" height="168" rx="12" class="card"/>
        <circle cx="${x + 14}" cy="${y + 14}" r="6" class="w3"/><rect x="${x + 25}" y="${y + 11}" width="40" height="6" rx="3" class="w2"/>
        <rect x="${x + 8}" y="${y + 28}" width="84" height="84" rx="8" fill="url(#${g})" class="${k === 2 ? '' : 'o6'}"/>
        <rect x="${x + 8}" y="${y + 122}" width="62" height="6" rx="3" class="w3"/><rect x="${x + 8}" y="${y + 134}" width="44" height="6" rx="3" class="w2"/>
        <g transform="translate(${x + 78} ${y + 146})"><path class="hrt" style="animation-delay:${(1 + k * .6).toFixed(1)}s" d="${HEART}"/></g></g>`).join('');
      const fly = [[214, 78, .4], [232, 92, 1.6], [196, 96, 2.6]].map(([x, y, dl]) =>
        `<g transform="translate(${x} ${y})"><path class="fly" style="animation-delay:${dl}s" d="${HEART}"/></g>`).join('');
      return svg(`${grad(g)}${cards}${fly}`);
    },

    chat: g => svg(`${grad(g)}
      <g class="si" ${sd(.2)}><circle cx="52" cy="61" r="10" class="w2"/><rect x="70" y="44" width="160" height="34" rx="14" class="bub"/>
        <rect x="84" y="54" width="110" height="6" rx="3" class="w3"/><rect x="84" y="65" width="70" height="5" rx="2.5" class="w2"/></g>
      <g class="si" ${sd(.9)}><rect x="200" y="92" width="130" height="34" rx="14" fill="url(#${g})"/>
        <rect x="214" y="102" width="96" height="6" rx="3" class="w5"/><rect x="214" y="113" width="60" height="5" rx="2.5" class="w4"/><circle cx="348" cy="109" r="10" class="fa"/></g>
      <g class="si" ${sd(1.6)}><circle cx="52" cy="157" r="10" class="w2"/><rect x="70" y="140" width="180" height="34" rx="14" class="bub"/>
        <rect x="84" y="150" width="140" height="6" rx="3" class="w3"/><rect x="84" y="161" width="92" height="5" rx="2.5" class="w2"/></g>
      <g class="si" ${sd(2.4)}><circle cx="52" cy="203" r="10" class="w2"/><rect x="70" y="188" width="62" height="30" rx="15" class="bub"/>
        <circle cx="88" cy="203" r="3.5" class="tdot"/><circle cx="101" cy="203" r="3.5" class="tdot" style="animation-delay:.15s"/><circle cx="114" cy="203" r="3.5" class="tdot" style="animation-delay:.3s"/></g>`),

    photo: g => svg(`${grad(g)}<g class="flt">
      <rect x="110" y="70" width="180" height="120" rx="18" class="cam"/>
      <rect x="140" y="56" width="50" height="20" rx="6" class="cam"/>
      <rect x="250" y="84" width="22" height="12" rx="4" class="w3"/>
      <circle cx="200" cy="132" r="44" class="lens1"/>
      <circle cx="200" cy="132" r="34" fill="url(#${g})"/>
      <g class="ap">${[0, 60, 120, 180, 240, 300].map(a => `<path d="M200 132 L200 104 A28 28 0 0 1 224.2 118 Z" class="blade" transform="rotate(${a} 200 132)"/>`).join('')}</g>
      <circle cx="200" cy="132" r="10" class="pupil"/><circle cx="192" cy="124" r="4" class="wf o8"/></g>
      <rect x="0" y="0" width="400" height="260" class="flash"/>
      <g class="si" ${sd(1.2)}><rect x="300" y="168" width="64" height="48" rx="5" class="photo-card"/><rect x="305" y="173" width="54" height="30" rx="3" fill="url(#${g})"/></g>
      <g class="si" ${sd(1.5)}><rect x="36" y="44" width="56" height="42" rx="5" class="photo-card"/><rect x="41" y="49" width="46" height="25" rx="3" fill="url(#${g})" class="o6"/></g>`),

    cube: () => `<div class="cb-floor"></div><div class="cb-glow"></div><div class="cb-stage"><div class="cb">${'<i></i>'.repeat(6)}</div></div>`,

    orbit: g => `<div class="ob o1"></div><div class="ob o2"></div><div class="ob o3"></div>` + svg(`${grad(g)}
      <g class="or1"><ellipse cx="200" cy="130" rx="150" ry="54" class="ring"/><circle cx="350" cy="130" r="5" class="wf"/></g>
      <g class="or2"><ellipse cx="200" cy="130" rx="104" ry="96" class="ring r2"/><circle cx="200" cy="34" r="4" class="fb"/></g>
      <circle cx="200" cy="130" r="26" fill="url(#${g})" class="core"/>`),
  };

  function html(id, p) {
    if (!IDS.has(id)) id = 'orbit';
    const g = `${p || prefix}-g${n++}`;
    return `<div class="scene sc-${id}" aria-hidden="true">${B[id](g)}</div>`;
  }

  /* generic words that shouldn't outvote specific ones ("Flyer update" → print, not website) */
  const WEAK = new Set(['update', 'redesign', 'correction', 'corrections', 'page', 'pages', 'site', 'build', 'content',
    'edit', 'model', 'product', 'card', 'cards', 'post', 'posts', 'report', 'care', 'email', 'style', 'app', 'apps', 'book']);

  function best(text) {
    const s = ` ${(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
    let top = '', score = 0;
    for (const sc of LIST) {
      let v = 0;
      for (const k of sc.kw) if (s.includes(` ${k} `)) v += WEAK.has(k) ? .5 : k.length > 3 ? 2 : 1;
      if (v > score) { score = v; top = sc.id; }
    }
    return top;
  }
  const match = (title, text) => best(title) || best(text) || 'orbit';

  return { LIST, IDS, NAME, html, match, seq };
})();
