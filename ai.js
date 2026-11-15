/* Slip AI: bring your own AI.
   - "chatbot": no key. Slip builds the prompt, you paste it into ChatGPT / Claude / Gemini / Copilot
     with your normal account, then paste the reply back.
   - "claude" / "openai" / "gemini" / "compat": your own API key, called straight from this browser.
     Keys are stored only in this browser's localStorage and never go into share links. */
window.SlipAI = (() => {
  'use strict';

  const PROVIDERS = {
    chatbot: { name: 'Any chatbot', short: 'No key' },
    claude:  { name: 'Claude', short: 'Anthropic API', model: 'claude-opus-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…' },
    openai:  { name: 'ChatGPT', short: 'OpenAI API', model: 'gpt-5', keyUrl: 'https://platform.openai.com/api-keys', keyHint: 'sk-…' },
    gemini:  { name: 'Gemini', short: 'Google AI', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'AIza…' },
    compat:  { name: 'Other', short: 'OpenAI-compatible', model: '', keyHint: 'API key (blank for local models)' },
  };
  const COMPAT_PRESETS = [
    { id: 'github', name: 'GitHub Models (Copilot)', base: 'https://models.github.ai/inference', hint: 'GitHub token with models:read' },
    { id: 'openrouter', name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', hint: 'OpenRouter key' },
    { id: 'ollama', name: 'Ollama (local)', base: 'http://localhost:11434/v1', hint: 'No key needed' },
    { id: 'custom', name: 'Custom', base: '', hint: '' },
  ];
  const CHATBOTS = [
    { name: 'ChatGPT', url: 'https://chatgpt.com/' },
    { name: 'Claude', url: 'https://claude.ai/new' },
    { name: 'Gemini', url: 'https://gemini.google.com/app' },
    { name: 'Copilot', url: 'https://copilot.microsoft.com/' },
  ];

  /* ---------- schemas ---------- */
  function draftSchema(sceneIds) {
    return {
      type: 'object', additionalProperties: false, required: ['intro', 'sections', 'terms'],
      properties: {
        intro: { type: 'string' },
        terms: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['title', 'timeline', 'details', 'quantity', 'rate', 'visual'],
            properties: {
              title: { type: 'string' }, timeline: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
              quantity: { type: 'number' }, rate: { type: 'number' },
              visual: { type: 'string', enum: sceneIds },
            },
          },
        },
      },
    };
  }
  const SECTION_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['timeline', 'details', 'rate'],
    properties: { timeline: { type: 'string' }, details: { type: 'array', items: { type: 'string' } }, rate: { type: 'number' } },
  };

  /* ---------- prompts ---------- */
  const SYSTEM = 'You help freelancers and small studios write clear, persuasive client proposals. ' +
    'Write in plain, confident, client-facing language, the way a person would type it. Never invent facts about the client beyond what the brief says. ' +
    'Do not use em dashes or en dashes; use commas, full stops or colons instead, and a plain hyphen for ranges like 3-4 days. ' +
    'Respond with JSON only.';

  function context(d) {
    return [
      `Freelancer / studio: ${d.from.name || 'unnamed'}${d.from.tagline ? `: “${d.from.tagline}”` : ''}`,
      `Client: ${[d.to.name, d.to.contact].filter(Boolean).join(', ') || 'not given'}`,
      `Currency: ${d.currency}`,
      `Document: ${d.type === 'invoice' ? 'invoice' : 'quote / proposal'}`,
    ].join('\n');
  }

  function draftPrompt(d, opts, scenes) {
    const current = opts.mode === 'polish'
      ? `\n\nCurrent draft to improve (keep the same scope, section order and prices unless something is clearly wrong; tighten titles, timelines and details):\n${JSON.stringify({
        intro: d.intro, terms: d.notes,
        sections: d.items.filter(i => i.d || i.x).map(i => ({ title: i.d, timeline: i.t, details: i.x.split('\n').filter(Boolean), quantity: i.q, rate: i.r })),
      }, null, 1)}`
      : '';
    return `${context(d)}
Tone: ${opts.tone}

Brief from the freelancer:
${opts.brief.trim() || '(no brief: use the current draft)'}${current}

Write the proposal content:
- 2-6 sections, each a distinct deliverable the client pays for. Titles of 2-5 words.
- details: 3-6 short points per section (under ~14 words each) saying what's included. No prices in details.
- timeline: short, e.g. "2 weeks", "3-4 days", "Monthly".
- quantity is usually 1; use more only for per-unit work (pages, posts, renders). rate is the price per unit in ${d.currency} as a plain number.${opts.prices ? ' If the brief mentions a budget, make the total land close to it; otherwise use realistic rates for an independent freelancer or small studio.' : ' Set every rate to 0: the freelancer will add prices.'}
- visual: the best fit from ${scenes.map(s => `"${s.id}" (${s.name})`).join(', ')}.
- intro: 2-3 sentences to the client about the outcome they'll get. No greeting line.
- terms: 2-4 sentences on payment schedule, revisions and what's out of scope.`;
  }

  function sectionPrompt(d, i, opts) {
    const it = d.items[i];
    const others = d.items.filter((_, j) => j !== i && d.items[j].d).map(x => `- ${x.d}`).join('\n') || '(none)';
    return `${context(d)}
Tone: ${opts.tone}

Write one section of the proposal.
Section title: ${it.d || 'Untitled'}
${it.x.trim() ? `Existing notes to improve:\n${it.x}\n` : ''}${opts.brief.trim() ? `Extra context from the freelancer: ${opts.brief.trim()}\n` : ''}Other sections in this proposal (don't repeat their scope):
${others}

Return:
- timeline: short, e.g. "2 weeks".
- details: 3-6 short client-facing points (under ~14 words each) on what's included.
- rate: a realistic price for this section in ${d.currency} as a plain number for an independent freelancer or small studio.`;
  }

  const shape = kind => (kind === 'section'
    ? '{"timeline": string, "details": [string], "rate": number}'
    : '{"intro": string, "terms": string, "sections": [{"title": string, "timeline": string, "details": [string], "quantity": number, "rate": number, "visual": string}]}');

  /* For chatbots and JSON-mode providers we spell out the shape in the prompt. */
  function withShape(prompt, kind) {
    return `${prompt}\n\nReply with only valid JSON in exactly this shape, no commentary and no code fences:\n${shape(kind)}`;
  }

  /* ---------- reply parsing ---------- */
  function extractJSON(text) {
    if (!text) throw new Error('The AI returned an empty reply.');
    const t = text.replace(/```(?:json)?/gi, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('Couldn’t find JSON in that reply. Ask the chatbot to “reply with only the JSON”.');
    try { return JSON.parse(t.slice(a, b + 1)); }
    catch { throw new Error('That reply isn’t valid JSON. Try copying the whole reply again.'); }
  }
  /* In case the AI ignores the instruction: ranges get a hyphen, other dashes become commas */
  const undash = t => t.replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2').replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',');
  const s = (v, n) => undash((typeof v === 'string' ? v : v == null ? '' : String(v)).trim()).slice(0, n);
  const n = (v, max) => { const x = Number(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(x) ? Math.min(max, Math.max(0, x)) : 0; };
  const lines = v => (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map(x => s(x, 200).replace(/^[-•*]\s*/, '')).filter(Boolean).slice(0, 10);

  function cleanDraft(o, sceneIds) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.sections)) throw new Error('The reply is missing a “sections” list.');
    const sections = o.sections.slice(0, 12).map(x => ({
      title: s(x && x.title, 120), timeline: s(x && x.timeline, 40), details: lines(x && x.details),
      quantity: n(x && x.quantity, 1e6) || 1, rate: n(x && x.rate, 1e10),
      visual: sceneIds.includes(x && x.visual) ? x.visual : null,
    })).filter(x => x.title || x.details.length);
    if (!sections.length) throw new Error('The reply had no usable sections.');
    return { intro: s(o.intro, 1200), terms: s(o.terms, 1500), sections };
  }
  function cleanSection(o) {
    if (!o || typeof o !== 'object') throw new Error('Unexpected reply.');
    return { timeline: s(o.timeline, 40), details: lines(o.details), rate: n(o.rate, 1e10) };
  }

  /* ---------- providers ---------- */
  const ANTHROPIC_SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
  let anthropicMod;

  async function callClaude(cfg, prompt, schema) {
    anthropicMod ||= await import(ANTHROPIC_SDK);
    const Anthropic = anthropicMod.default;
    const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true });
    let res;
    try {
      res = await client.beta.messages.create({
        model: cfg.model || PROVIDERS.claude.model,
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt }],
        output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
        // If a safety classifier declines, the API retries on a fallback model in the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new Error('Claude rejected that API key.');
      if (e instanceof Anthropic.PermissionDeniedError) throw new Error('This API key can’t use that model.');
      if (e instanceof Anthropic.NotFoundError) throw new Error(`Model “${cfg.model}” wasn’t found.`);
      if (e instanceof Anthropic.RateLimitError) throw new Error('Rate limited by Claude: wait a moment and try again.');
      if (e instanceof Anthropic.BadRequestError) throw new Error(`Claude couldn’t process the request: ${e.message}`);
      if (e instanceof Anthropic.APIConnectionError) throw new Error('Couldn’t reach Claude. Check your connection.');
      if (e instanceof Anthropic.APIError) throw new Error(`Claude error ${e.status ?? ''}: ${e.message}`);
      throw e;
    }
    if (res.stop_reason === 'refusal') throw new Error('Claude declined this request. Try rewording the brief.');
    if (res.stop_reason === 'max_tokens') throw new Error('The reply was cut off. Try a shorter brief.');
    return res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  }

  async function httpError(r, who) {
    let msg = '';
    try { const j = await r.json(); msg = j.error?.message || j.message || ''; } catch { /* ignore */ }
    if (r.status === 401 || r.status === 403) return new Error(`${who} rejected that API key.${msg ? ` (${msg})` : ''}`);
    if (r.status === 404) return new Error(`${who}: model not found. Check the model name.`);
    if (r.status === 429) return new Error(`${who} rate limit or quota reached.${msg ? ` (${msg})` : ''}`);
    return new Error(`${who} error ${r.status}${msg ? `: ${msg}` : ''}`);
  }
  async function post(url, headers, body, who) {
    let r;
    try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
    catch { throw new Error(`Couldn’t reach ${who}. Check the address and your connection${who === 'Other' ? ' (the service must allow browser requests)' : ''}.`); }
    if (!r.ok) throw await httpError(r, who);
    return r.json();
  }

  async function callOpenAI(cfg, prompt, schema) {
    const j = await post('https://api.openai.com/v1/chat/completions', { Authorization: `Bearer ${cfg.key}` }, {
      model: cfg.model || PROVIDERS.openai.model,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
      response_format: { type: 'json_schema', json_schema: { name: 'proposal', strict: true, schema } },
    }, 'OpenAI');
    const c = j.choices?.[0];
    if (c?.message?.refusal) throw new Error('ChatGPT declined this request.');
    return c?.message?.content || '';
  }

  async function callGemini(cfg, prompt, kind) {
    const model = encodeURIComponent(cfg.model || PROVIDERS.gemini.model);
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { 'x-goog-api-key': cfg.key }, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: withShape(prompt, kind) }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }, 'Gemini');
    const parts = j.candidates?.[0]?.content?.parts || [];
    if (!parts.length) throw new Error(`Gemini returned no answer${j.promptFeedback?.blockReason ? ` (${j.promptFeedback.blockReason})` : ''}.`);
    return parts.map(p => p.text || '').join('');
  }

  async function callCompat(cfg, prompt, kind) {
    if (!cfg.base) throw new Error('Add the provider’s base URL first.');
    if (!cfg.model) throw new Error('Add a model name first.');
    const url = cfg.base.replace(/\/+$/, '') + '/chat/completions';
    const headers = cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {};
    const body = { model: cfg.model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: withShape(prompt, kind) }] };
    let j;
    try { j = await post(url, headers, { ...body, response_format: { type: 'json_object' } }, 'Other'); }
    catch (e) { if (!/error 400/.test(e.message)) throw e; j = await post(url, headers, body, 'Other'); }   // provider without JSON mode
    return j.choices?.[0]?.message?.content || '';
  }

  /* kind: 'draft' | 'section'. Returns cleaned data. */
  async function run(provider, cfg, kind, prompt, sceneIds) {
    const schema = kind === 'section' ? SECTION_SCHEMA : draftSchema(sceneIds);
    let text;
    if (provider === 'claude') text = await callClaude(cfg, prompt, schema);
    else if (provider === 'openai') text = await callOpenAI(cfg, prompt, schema);
    else if (provider === 'gemini') text = await callGemini(cfg, prompt, kind);
    else if (provider === 'compat') text = await callCompat(cfg, prompt, kind);
    else throw new Error('Pick a provider first.');
    return parse(text, kind, sceneIds);
  }
  function parse(text, kind, sceneIds) {
    const o = extractJSON(text);
    return kind === 'section' ? cleanSection(o) : cleanDraft(o, sceneIds);
  }

  return {
    PROVIDERS, COMPAT_PRESETS, CHATBOTS, SYSTEM,
    draftPrompt, sectionPrompt, withShape, run, parse,
    chatPrompt: (prompt, kind) => `${SYSTEM}\n\n${withShape(prompt, kind)}`,
  };
})();
