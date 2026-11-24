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
    { id: 'sim',     name: 'Simulation',  kw: ['simulation', 'simulations', 'simulate', 'simulator', 'robot', 'robots', 'robotic', 'robotics', 'ros', 'unreal', 'subsea', 'underwater', 'rov', 'sonar', 'sensor', 'sensors', 'twin', 'autonomous', 'drone'] },
    { id: 'vfx',     name: 'VFX',         kw: ['vfx', 'visual effects', 'compositing', 'composite', 'fooh', 'tracking', 'greenscreen', 'green screen', 'rotoscoping', 'live action', 'footage', 'mixed reality'] },
    { id: 'tools',   name: 'Automation',  kw: ['tool', 'tools', 'tooling', 'automation', 'automate', 'automated', 'workflow', 'workflows', 'pipeline', 'pipelines', 'power apps', 'platform', 'platforms', 'addon', 'add-on', 'script', 'scripts', 'internal'] },
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

    /* subsea robot scanning the seabed, with live telemetry */
    sim: g => {
      const bed = [[0, 216], [40, 206], [80, 213], [118, 198], [150, 190], [186, 199], [222, 186], [256, 180], [292, 194], [330, 186], [366, 196], [400, 190]];
      const pts = bed.slice(1, -1).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.2" class="fb sp" ${sd((.5 + i * .28).toFixed(2))}/>`).join('');
      const ribs = bed.slice(1, -1).map(([x, y], i) => `<path d="M${x} ${y}V260" class="rib sy" ${sd((.5 + i * .28).toFixed(2))}/>`).join('');
      const bub = [[168, 0], [236, 1.1], [150, 2.2], [246, 3]].map(([x, dl]) => `<circle cx="${x}" cy="92" r="3" class="bub" style="animation-delay:${dl}s"/>`).join('');
      return svg(`${grad(g)}
        <path d="M0 60H400M0 110H400M0 160H400M80 0V260M200 0V260M320 0V260" class="gridl"/>
        <path d="M${bed.map(p => p.join(' ')).join('L')}V260H0Z" class="bed"/>${ribs}
        <polyline points="${bed.map(p => p.join(',')).join(' ')}" class="bedl"/>
        <path d="M200 96C196 62 214 40 206 0" class="tether"/>
        <path d="M200 116L138 232H262Z" fill="url(#${g})" class="cone"/>
        ${pts}${bub}
        <g class="flt">
          <rect x="160" y="80" width="80" height="12" rx="6" class="fa"/>
          <rect x="164" y="90" width="72" height="30" rx="8" class="rov"/>
          <rect x="150" y="98" width="14" height="16" rx="4" class="rov"/><rect x="236" y="98" width="14" height="16" rx="4" class="rov"/>
          <circle cx="200" cy="105" r="9" class="eye"/><circle cx="200" cy="105" r="4.5" class="wf"/>
          <circle cx="176" cy="105" r="2.5" class="fb led"/><circle cx="224" cy="105" r="2.5" class="fb led" style="animation-delay:.5s"/>
        </g>
        <g class="si" ${sd(.2)}><rect x="20" y="20" width="104" height="60" rx="9" class="win"/>
          <circle cx="34" cy="34" r="3.5" class="fb led"/><rect x="44" y="30.500" width="38" height="7" rx="3.5" class="w4"/>
          <rect x="32" y="48" width="78" height="5" rx="2.5" class="w2 sx" ${sd(.6)}/><rect x="32" y="59" width="54" height="5" rx="2.5" class="w3 sx" ${sd(.8)}/>
          <rect x="32" y="69" width="66" height="5" rx="2.5" class="w2 sx" ${sd(1)}/></g>
        <g class="si" ${sd(.5)}><rect x="286" y="20" width="94" height="56" rx="9" class="win"/>
          <polyline points="296,62 310,54 322,58 336,40 350,46 370,30" class="tr"/></g>`);
    },

    /* a filmed shot on the left, its CG wireframe on the right, and a wipe that keeps crossing between them */
    vfx: g => {
      const shapes = cls => `<circle cx="282" cy="92" r="20" class="${cls} s1"/>
        <path d="M60 205L128 138 172 176 214 126 290 205Z" class="${cls} s2"/>
        <rect x="168" y="118" width="64" height="87" rx="4" class="${cls} s3"/>
        <path d="M168 150H232M200 118V205" class="${cls} s4"/>`;
      const marks = [[92, 80], [140, 190], [246, 150], [318, 186]].map(([x, y], i) =>
        `<path d="M${x - 6} ${y}H${x + 6}M${x} ${y - 6}V${y + 6}" class="mk" style="animation-delay:${(i * .35).toFixed(2)}s"/>`).join('');
      const ticks = Array.from({ length: 25 }, (_, i) => `<rect x="${56 + i * 12}" y="${i % 4 ? 232 : 229}" width="2" height="${i % 4 ? 6 : 10}" class="w3"/>`).join('');
      return svg(`${grad(g)}<defs><clipPath id="${g}f"><rect x="52" y="44" width="296" height="164" rx="12"/></clipPath>
          <clipPath id="${g}w"><rect x="200" y="30" width="400" height="200" class="wipe"/></clipPath></defs>
        <g clip-path="url(#${g}f)">
          <rect x="52" y="44" width="296" height="164" fill="url(#${g})" class="o8"/>${shapes('real')}
          <g clip-path="url(#${g}w)"><rect x="52" y="44" width="296" height="164" class="void"/>
            <path d="M52 85H348M52 126H348M52 167H348M111 44V208M170 44V208M229 44V208M288 44V208" class="gridl"/>${shapes('wire')}${marks}</g>
          <g class="wipe"><rect x="199" y="44" width="2" height="164" class="wf"/><circle cx="200" cy="126" r="9" class="wf"/><path d="M196 122l-4 4 4 4M204 122l4 4-4 4" class="chev"/></g>
        </g>
        <rect x="52" y="44" width="296" height="164" rx="12" class="frame"/>
        <circle cx="68" cy="60" r="4" class="rec"/><rect x="78" y="56.500" width="26" height="7" rx="3.5" class="w5"/>
        <path d="M40 58V34H64M336 34H360V58M360 194V218H336M64 218H40V194" class="brk"/>
        ${ticks}<rect x="56" y="226" width="3" height="16" rx="1.5" class="fb head"/>`);
    },

    /* scattered inputs flow into one tool and come out as finished, ticked-off work */
    tools: g => {
      const ins = [58, 112, 166].map((y, i) => `<g class="si" ${sd((.15 + i * .18).toFixed(2))}><rect x="30" y="${y}" width="88" height="36" rx="9" class="card"/>
        <rect x="40" y="${y + 9}" width="18" height="18" rx="5" class="${['fa', 'fb', 'w4'][i]}"/>
        <rect x="66" y="${y + 11}" width="${[40, 30, 36][i]}" height="5" rx="2.5" class="w3"/><rect x="66" y="${y + 21}" width="${[26, 38, 22][i]}" height="5" rx="2.5" class="w2"/></g>`).join('');
      const teeth = [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="197" y="111" width="10" height="11" rx="2.5" class="wf" transform="rotate(${a} 202 130)"/>`).join('');
      const rows = [86, 112, 138].map((y, i) => `<g class="sp" ${sd((2 + i * .45).toFixed(2))}><circle cx="290" cy="${y}" r="8" class="fa"/><path d="M286 ${y}l3 3 5.500-6" class="tk"/></g>
        <rect x="306" y="${y - 3.500}" width="${[48, 38, 44][i]}" height="7" rx="3.5" class="w3 sx" ${sd((2.1 + i * .45).toFixed(2))}/>`).join('');
      return svg(`${grad(g)}
        <path d="M118 76C150 76 146 130 172 130M118 130H172M118 184C150 184 146 130 172 130M232 130H270" class="flow"/>
        ${ins}
        <circle cx="202" cy="130" r="34" class="pulse"/>
        <rect x="170" y="98" width="64" height="64" rx="18" fill="url(#${g})"/>
        <g class="gear">${teeth}<circle cx="202" cy="130" r="14" class="wf"/><circle cx="202" cy="130" r="6" class="hub"/></g>
        <g class="si" ${sd(1.6)}><rect x="270" y="58" width="104" height="144" rx="12" class="win"/>
          <rect x="282" y="172" width="80" height="8" rx="4" class="w1"/></g>
        ${rows}<rect x="282" y="172" width="80" height="8" rx="4" class="fb sx" ${sd(3.4)}/>
        <rect x="282" y="186" width="36" height="5" rx="2.5" class="w2 sx" ${sd(3.6)}/>`);
    },

    /* a small 3D still life: a glass cube with a solid core, two orbiting satellites and two rings. Drag to turn it. */
    cube: () => `<div class="cb-floor"></div><div class="cb-glow"></div><div class="cb-stage"><div class="cb-rig"><div class="cb">${'<i></i>'.repeat(6)}</div><div class="cb cb-in">${'<i></i>'.repeat(6)}</div><div class="cb-ring"></div><div class="cb-ring r2"></div><div class="cb-orb"><div class="cb cb-s">${'<i></i>'.repeat(6)}</div></div><div class="cb-orb o2"><div class="cb cb-s">${'<i></i>'.repeat(6)}</div></div></div></div><span class="cb-hint">Drag to rotate</span>`,

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
    'edit', 'model', 'product', 'card', 'cards', 'post', 'posts', 'report', 'care', 'email', 'style', 'app', 'apps', 'book', 'tool', 'tools', 'platform', 'platforms', 'internal', 'footage', 'sensor', 'sensors']);

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

  /* Drag the 3D scene to turn it (the objects keep spinning on their own inside the rig). */
  let turn = null;
  addEventListener('pointerdown', e => {
    const sc = e.target.closest?.('.sc-cube');
    if (!sc || e.button || e.target.closest('.cg-bento, .m-thumb, .g-thumb, .sc-tile')) return;
    const rig = sc.querySelector('.cb-rig');
    if (!rig) return;
    turn = { rig, x: e.clientX, y: e.clientY, rx: parseFloat(rig.dataset.rx || -24), ry: parseFloat(rig.dataset.ry || 0) };
    sc.classList.add('turning');
  });
  addEventListener('pointermove', e => {
    if (!turn) return;
    const ry = turn.ry + (e.clientX - turn.x) * .5, rx = Math.max(-85, Math.min(85, turn.rx - (e.clientY - turn.y) * .4));
    turn.rig.dataset.rx = rx; turn.rig.dataset.ry = ry;
    turn.rig.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  const endTurn = () => { if (turn) { turn.rig.closest('.sc-cube')?.classList.remove('turning'); turn = null; } };
  addEventListener('pointerup', endTurn); addEventListener('pointercancel', endTurn);

  /* Scenes that are off screen stop animating, so a long proposal doesn't run a dozen animations at once. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('off', !en.isIntersecting)), { rootMargin: '120px' });
    const scan = () => document.querySelectorAll('.scene:not([data-io])').forEach(el => { el.dataset.io = 1; io.observe(el); });
    setInterval(scan, 1500); addEventListener('load', scan);
  }

  /* Low-power mode. If the page can't hold about 35 frames a second for three seconds running (an older
     laptop, no graphics card), switch the expensive effects off for the rest of the visit: film grain,
     big blurs, and animations inside collage tiles (they play on hover instead). See "html.lite" in proposal.css. */
  (function watch() {
    let last = 0, sum = 0, n = 0, slow = 0, t0 = 0;
    (function f(now) {
      if (document.documentElement.classList.contains('lite')) return;
      const dt = now - last; last = now;
      if (!document.hidden && dt > 0 && dt < 500) { sum += dt; n++; }
      if (now - t0 > 1500) {
        if (n > 4) slow = sum / n > 28 ? slow + 1 : 0;
        if (slow >= 2) { document.documentElement.classList.add('lite'); return; }
        t0 = now; sum = 0; n = 0;
      }
      requestAnimationFrame(f);
    })(0);
  })();

  return { LIST, IDS, NAME, html, match, seq };
})();
