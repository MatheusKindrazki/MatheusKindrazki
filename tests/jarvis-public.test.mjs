import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { loadTsModules } from './helpers/load-ts.mjs';

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const content = await loadTypeScript('../src/lib/content.ts');
const { buildDossier, dossierEmails } = await loadTsModules('src/lib/jarvis-public/dossier.ts');
const prompt = await loadTsModules('src/lib/jarvis-public/prompt.ts');
const guard = await loadTsModules('src/lib/jarvis-public/guard.ts');
const { createAskHandler } = await loadTsModules('src/lib/jarvis-public/handler.ts');
const { publicLinkTargets, splitLinks } = await loadTsModules('src/lib/jarvis-public/links.ts');
const siteLinks = await loadTsModules('src/lib/jarvis-public/site-links.ts');
const { createGenerate } = await loadTsModules('src/lib/jarvis-public/anthropic.ts');

function dossierInput(interviewNotes = []) {
  const { profile, roleSignals, projects, skillCategories, philosophy, timeline, writing,
    nowLearning, nowReading, nowThinking, nowNotDoing, site } = content;
  return { profile, roleSignals, projects, skillCategories, philosophy, timeline, writing,
    nowLearning, nowReading, nowThinking, nowNotDoing, site, interviewNotes };
}

/* ── dossier + prompt ─────────────────────────────────────────────── */

test('dossier carries the public facts and nothing about partnership or equity', () => {
  const dossier = buildDossier(dossierInput());
  assert.ok(dossier.includes(content.profile.name));
  for (const project of content.projects) assert.ok(dossier.includes(project.title), project.title);
  for (const item of content.philosophy) assert.ok(dossier.includes(item.title), item.title);
  assert.ok(dossier.includes(content.profile.email));
  assert.doesNotMatch(dossier, /\b(partner\w*|equity)\b/i);
  assert.equal(buildDossier(dossierInput()), dossier);
  assert.deepEqual(dossierEmails(dossierInput()), [content.profile.email.toLowerCase()]);
});

test('dossier is a pure function of its input', () => {
  const fixture = {
    profile: {
      name: 'SENTINEL_NAME', nickname: 'SENTINEL_NICK', title: 'SENTINEL_TITLE', location: 'SENTINEL_CITY',
      headline: 'SENTINEL_HEADLINE', description: 'SENTINEL_DESCRIPTION', email: 'sentinel@example.test',
      calLink: 'https://cal.example.test/sentinel', social: { github: 'https://github.example.test/sentinel' },
    },
    roleSignals: [{ role: 'SENTINEL_ROLE', organization: 'SENTINEL_ORG', note: 'SENTINEL_NOTE' }],
    projects: [{ id: 'sentinel', title: 'SENTINEL_PROJECT', description: 'SENTINEL_PROJECT_DESC', tags: ['SENTINEL_TAG'],
      year: '2000', status: 'current', role: 'SENTINEL_PROJECT_ROLE' }],
    skillCategories: [{ title: 'SENTINEL_SKILLS', focus: 'SENTINEL_FOCUS', skills: ['SENTINEL_SKILL'] }],
    philosophy: [{ title: 'SENTINEL_PRINCIPLE', description: 'SENTINEL_PRINCIPLE_DESC' }],
    timeline: [{ year: '1999', title: 'SENTINEL_TIMELINE', description: 'SENTINEL_TIMELINE_DESC' }],
    writing: [{ title: 'SENTINEL_ARTICLE', blurb: 'SENTINEL_BLURB', year: '2001', topic: 'SENTINEL_TOPIC', link: 'https://blog.example.test/s' }],
    nowLearning: [{ name: 'SENTINEL_LEARNING', description: 'x' }],
    nowReading: [{ name: 'SENTINEL_READING', description: 'x' }],
    nowThinking: ['SENTINEL_THINKING'],
    nowNotDoing: [{ name: 'SENTINEL_NOT_DOING', status: 'archived' }],
    site: { lastUpdated: 'SENTINEL_DATE' },
    interviewNotes: [],
  };
  const dossier = buildDossier(fixture);
  for (const sentinel of ['SENTINEL_NAME', 'SENTINEL_PROJECT', 'SENTINEL_PRINCIPLE', 'SENTINEL_ARTICLE', 'sentinel@example.test', 'SENTINEL_DATE']) {
    assert.ok(dossier.includes(sentinel), sentinel);
  }
  assert.ok(!dossier.includes(content.profile.name));
});

test('dossier carries the Now page note and stage for current work only', () => {
  const dossier = buildDossier(dossierInput());
  const lugui = content.projects.find((project) => project.id === 'lugui');
  assert.equal(lugui.nowStatus, 'alpha');
  assert.match(dossier, /- Stage on the Now page: alpha \(his own note, not a deployment check\)/);
  assert.ok(dossier.includes(`- Now page note: ${lugui.nowNote}`));

  const project = (fields) => ({ id: 'p', title: 'P', description: 'd', tags: [], year: '2000', role: 'r', ...fields });
  const fixture = {
    ...dossierInput(),
    projects: [
      project({ id: 'cur', title: 'CURRENT_NO_STATUS', status: 'current' }),
      project({ id: 'old', title: 'PAST_WITH_FIELDS', status: 'past', nowNote: 'PAST_NOTE', nowStatus: 'beta' }),
      project({ id: 'side', title: 'SIDE_WITH_FIELDS', status: 'side', nowNote: 'SIDE_NOTE', nowStatus: 'alpha' }),
    ],
  };
  const built = buildDossier(fixture);
  const block = (title) => built.slice(built.indexOf(`### ${title}`)).split('\n### ')[0].split('\n## ')[0];
  assert.match(block('CURRENT_NO_STATUS'), /- Stage on the Now page: building \(/);
  assert.doesNotMatch(block('CURRENT_NO_STATUS'), /Now page note/);
  for (const title of ['PAST_WITH_FIELDS', 'SIDE_WITH_FIELDS']) {
    assert.doesNotMatch(block(title), /Now page note|Stage on the Now page/, title);
  }
  assert.ok(!built.includes('PAST_NOTE') && !built.includes('SIDE_NOTE'));
});

test('dossier interview section appears only when notes exist', () => {
  assert.doesNotMatch(buildDossier(dossierInput()), /Interview notes/);
  const withNote = buildDossier(dossierInput([{ question: 'Why MCP?', answer: 'Because tools should be portable.' }]));
  assert.match(withNote, /Interview notes/);
  assert.ok(withNote.includes('Why MCP?'));
  assert.ok(withNote.includes('Because tools should be portable.'));
});

test('shipped interview notes are well formed, carry no numbers or contacts, and reach the dossier', async () => {
  const { interviewNotes } = await loadTsModules('src/lib/jarvis-public/interview.ts');
  assert.ok(Array.isArray(interviewNotes) && interviewNotes.length > 0);
  assert.equal(new Set(interviewNotes.map((note) => note.question)).size, interviewNotes.length);
  const dossier = buildDossier(dossierInput(interviewNotes));
  assert.match(dossier, /Interview notes — answers Matheus approved/);
  for (const note of interviewNotes) {
    assert.ok(note.question.trim().endsWith('?'), note.question);
    assert.ok(note.answer.trim().length >= 40, note.question);
    const text = `${note.question} ${note.answer}`;
    // This file is public: no contacts, links, money or figures in an answer.
    assert.doesNotMatch(text, /@|https?:\/\/|www\./i, note.question);
    assert.doesNotMatch(text, /R\$|US\$|\$\s?\d|€|\d/, note.question);
    assert.doesNotMatch(text, /\b(partner\w*|equity|sócio\w*|salário\w*|faturamento)\b/i, note.question);
    assert.ok(dossier.includes(note.question) && dossier.includes(note.answer), note.question);
  }
});

test('system prompt embeds the dossier and is deterministic', () => {
  const dossier = buildDossier(dossierInput());
  const system = prompt.buildSystemPrompt(dossier);
  assert.ok(system.includes(dossier));
  assert.match(system, /third person/);
  assert.equal(prompt.buildSystemPrompt(dossier), system);
});

/* ── env ──────────────────────────────────────────────────────────── */

test('isPublicEnabled requires the exact mode and a non-empty key', () => {
  const { isPublicEnabled } = guard;
  assert.equal(isPublicEnabled({ JARVIS_PUBLIC_MODE: 'enabled', ANTHROPIC_API_KEY: 'k' }), true);
  assert.equal(isPublicEnabled({ JARVIS_PUBLIC_MODE: 'disabled', ANTHROPIC_API_KEY: 'k' }), false);
  assert.equal(isPublicEnabled({ JARVIS_PUBLIC_MODE: 'Enabled', ANTHROPIC_API_KEY: 'k' }), false);
  assert.equal(isPublicEnabled({ ANTHROPIC_API_KEY: 'k' }), false);
  assert.equal(isPublicEnabled({ JARVIS_PUBLIC_MODE: 'enabled' }), false);
  assert.equal(isPublicEnabled({ JARVIS_PUBLIC_MODE: 'enabled', ANTHROPIC_API_KEY: '' }), false);
});

test('dailyCap accepts integers 1..5000 and defaults to 200', () => {
  const { dailyCap } = guard;
  assert.equal(dailyCap({}), 200);
  for (const bad of ['0', 'abc', '9999', '1.5', '', '-3']) assert.equal(dailyCap({ JARVIS_PUBLIC_DAILY_CAP: bad }), 200, bad);
  assert.equal(dailyCap({ JARVIS_PUBLIC_DAILY_CAP: '250' }), 250);
  assert.equal(dailyCap({ JARVIS_PUBLIC_DAILY_CAP: '1' }), 1);
  assert.equal(dailyCap({ JARVIS_PUBLIC_DAILY_CAP: '5000' }), 5000);
});

/* ── parseAskRequest ──────────────────────────────────────────────── */

test('parseAskRequest rejects malformed bodies with stable errors', () => {
  const { parseAskRequest } = guard;
  for (const raw of [null, [], 'text', 42, true, undefined]) {
    assert.deepEqual(parseAskRequest(raw), { ok: false, error: 'invalid request body' });
  }
  for (const raw of [{}, { message: 42 }, { message: '   ' }]) {
    assert.deepEqual(parseAskRequest(raw), { ok: false, error: 'message is required' });
  }
  assert.deepEqual(parseAskRequest({ message: 'x'.repeat(801) }), { ok: false, error: 'message too long (max 800 chars)' });
  assert.equal(parseAskRequest({ message: 'x'.repeat(800) }).ok, true);
  const badHistories = [
    'nope',
    [null],
    [{ role: 'system', content: 'hi' }],
    [{ role: 'user', content: 42 }],
    [{ role: 'user', content: '  ' }],
    [{ role: 'assistant', content: 'x'.repeat(2501) }],
  ];
  for (const history of badHistories) {
    assert.deepEqual(parseAskRequest({ message: 'hi', history }), { ok: false, error: 'invalid history' });
  }
});

test('parseAskRequest trims, ignores legacy fields and normalizes history', () => {
  const { parseAskRequest } = guard;
  assert.deepEqual(parseAskRequest({ message: '  hello  ', conversation_id: 'abc' }), { ok: true, message: 'hello', history: [] });

  const long = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: ` m${i} `, extra: 'x' }));
  const parsed = parseAskRequest({ message: 'next', history: long });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.history.length, 12);
  assert.deepEqual(parsed.history[0], { role: 'user', content: 'm8' });
  assert.deepEqual(parsed.history.at(-1), { role: 'assistant', content: 'm19' });
  for (const turn of parsed.history) assert.deepEqual(Object.keys(turn), ['role', 'content']);

  const leadingAssistant = parseAskRequest({
    message: 'q',
    history: [
      { role: 'assistant', content: 'intro' },
      { role: 'assistant', content: 'again' },
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'answer' },
    ],
  });
  assert.deepEqual(leadingAssistant.history, [
    { role: 'user', content: 'first' },
    { role: 'assistant', content: 'answer' },
  ]);

  const odd = Array.from({ length: 13 }, (_, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content: `m${i}` }));
  const oddParsed = parseAskRequest({ message: 'q', history: odd });
  assert.equal(oddParsed.history[0].role, 'user');
  assert.equal(oddParsed.history.length, 11);
});

test('parseAskRequest rejects oversized history arrays and per-role overlong turns', () => {
  const { parseAskRequest } = guard;
  const many = Array.from({ length: 61 }, () => ({ role: 'user', content: 'x' }));
  assert.deepEqual(parseAskRequest({ message: 'q', history: many }), { ok: false, error: 'invalid history' });
  assert.equal(parseAskRequest({ message: 'q', history: many.slice(0, 60) }).ok, true);
  assert.deepEqual(parseAskRequest({ message: 'q', history: [{ role: 'user', content: 'x'.repeat(801) }] }), { ok: false, error: 'invalid history' });
  assert.equal(parseAskRequest({ message: 'q', history: [{ role: 'user', content: 'x'.repeat(800) }] }).ok, true);
  assert.equal(parseAskRequest({ message: 'q', history: [{ role: 'user', content: 'u' }, { role: 'assistant', content: 'x'.repeat(2500) }] }).ok, true);
  assert.deepEqual(parseAskRequest({ message: 'q', history: [{ role: 'user', content: 'u' }, { role: 'assistant', content: 'x'.repeat(2501) }] }), { ok: false, error: 'invalid history' });
});

test('parseAskRequest caps total history size and still starts with a user turn', () => {
  const { parseAskRequest, MAX_HISTORY_TOTAL_CHARS } = guard;
  assert.equal(MAX_HISTORY_TOTAL_CHARS, 8000);
  const history = Array.from({ length: 12 }, (_, i) => (
    i % 2 === 0
      ? { role: 'user', content: `${i}`.padEnd(800, 'u') }
      : { role: 'assistant', content: `${i}`.padEnd(2500, 'a') }
  ));
  const parsed = parseAskRequest({ message: 'q', history });
  assert.equal(parsed.ok, true);
  const total = parsed.history.reduce((sum, turn) => sum + turn.content.length, 0);
  assert.ok(total <= 8000, `total ${total}`);
  assert.ok(parsed.history.length > 0);
  assert.equal(parsed.history[0].role, 'user');
  // the newest turn is always kept
  assert.equal(parsed.history.at(-1).content, history.at(-1).content);
});

/* ── headers ──────────────────────────────────────────────────────── */

test('clientKey prefers platform headers and falls back to unknown', () => {
  const { clientKey } = guard;
  assert.equal(clientKey(new Headers({ 'x-vercel-forwarded-for': ' 1.1.1.1 ', 'x-real-ip': '2.2.2.2' })), '1.1.1.1');
  assert.equal(clientKey(new Headers({ 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3' })), '2.2.2.2');
  assert.equal(clientKey(new Headers({ 'x-forwarded-for': ' 3.3.3.3 , 4.4.4.4' })), '3.3.3.3');
  assert.equal(clientKey(new Headers({ 'x-vercel-forwarded-for': '  ', 'x-forwarded-for': '5.5.5.5' })), '5.5.5.5');
  assert.equal(clientKey(new Headers({ 'x-real-ip': ' not-an-ip ' })), 'not-an-ip');
  assert.equal(clientKey(new Headers()), 'unknown');
});

test('clientKey groups an IPv6 /64 into one visitor and unwraps IPv4-mapped addresses', () => {
  const { clientKey } = guard;
  const key = (ip) => clientKey(new Headers({ 'x-real-ip': ip }));
  assert.equal(key('2001:db8:1:2::1'), key('2001:0DB8:0001:0002:ffff:ffff:ffff:fffe'));
  assert.equal(key('2001:db8:1:2:aaaa::'), key('2001:db8:1:2::'));
  assert.notEqual(key('2001:db8:1:2::1'), key('2001:db8:1:3::1'));
  assert.equal(key('::ffff:1.2.3.4'), '1.2.3.4');
  assert.equal(key('::FFFF:0102:0304'), '1.2.3.4');
  assert.equal(key('9.8.7.6'), '9.8.7.6');
  assert.equal(key('2001:db8::1::2'), '2001:db8::1::2');
});

test('isCrossSite flags foreign origins and fetch metadata', () => {
  const { isCrossSite } = guard;
  assert.equal(isCrossSite(new Headers()), false);
  assert.equal(isCrossSite(new Headers({ 'sec-fetch-site': 'same-origin' })), false);
  assert.equal(isCrossSite(new Headers({ 'sec-fetch-site': 'cross-site' })), true);
  assert.equal(isCrossSite(new Headers({ origin: 'https://Example.com', host: 'example.com' })), false);
  assert.equal(isCrossSite(new Headers({ origin: 'https://evil.test', host: 'example.com' })), true);
  assert.equal(isCrossSite(new Headers({ origin: 'not a url', host: 'example.com' })), true);
  assert.equal(isCrossSite(new Headers({ origin: 'http://localhost:3000', host: 'localhost:3000' })), false);
});

/* ── rate limiter ─────────────────────────────────────────────────── */

test('limiter enforces per-minute windows and recovers', () => {
  let t = 1_000_000;
  const limiter = guard.createRateLimiter({ perMinute: 2, perHour: 100, perDay: 1000, now: () => t });
  assert.deepEqual(limiter.check('a'), { allowed: true });
  t += 10_000;
  assert.deepEqual(limiter.check('a'), { allowed: true });
  t += 10_000;
  const denied = limiter.check('a');
  assert.equal(denied.allowed, false);
  assert.equal(denied.scope, 'visitor');
  assert.equal(denied.retryAfterSeconds, 40);
  assert.deepEqual(limiter.check('b'), { allowed: true });
  t += 41_000;
  assert.deepEqual(limiter.check('a'), { allowed: true });
});

test('limiter enforces per-hour windows and does not count denials', () => {
  let t = 0;
  const limiter = guard.createRateLimiter({ perMinute: 100, perHour: 3, perDay: 1000, now: () => t });
  for (let i = 0; i < 3; i++) { assert.equal(limiter.check('a').allowed, true); t += 60_000; }
  for (let i = 0; i < 5; i++) {
    const denied = limiter.check('a');
    assert.equal(denied.allowed, false);
    assert.equal(denied.scope, 'visitor');
    assert.ok(denied.retryAfterSeconds >= 1);
  }
  t = 3_600_001;
  assert.equal(limiter.check('a').allowed, true);
});

test('limiter enforces the global daily cap across visitors', () => {
  let t = 0;
  const limiter = guard.createRateLimiter({ perMinute: 100, perHour: 100, perDay: 2, now: () => t });
  assert.equal(limiter.check('a').allowed, true);
  assert.equal(limiter.check('b').allowed, true);
  const denied = limiter.check('c');
  assert.equal(denied.allowed, false);
  assert.equal(denied.scope, 'global');
  assert.equal(denied.retryAfterSeconds, 86_400);
  t = 86_400_001;
  assert.equal(limiter.check('c').allowed, true);
});

test('a denied visitor request does not consume the global cap', () => {
  const t = 0;
  const limiter = guard.createRateLimiter({ perMinute: 1, perHour: 100, perDay: 3, now: () => t });
  assert.equal(limiter.check('a').allowed, true);
  for (let i = 0; i < 5; i++) assert.equal(limiter.check('a').scope, 'visitor');
  assert.equal(limiter.check('b').allowed, true);
  assert.equal(limiter.check('c').allowed, true);
  assert.equal(limiter.check('d').scope, 'global');
});

test('limiter sweeps stale visitor keys once the map grows past 500', () => {
  let t = 0;
  const limiter = guard.createRateLimiter({ perMinute: 10, perHour: 10, perDay: 100_000, now: () => t });
  for (let i = 0; i < 501; i++) limiter.check(`old-${i}`);
  assert.equal(limiter.size(), 501);
  t = 3_600_001;
  limiter.check('fresh');
  assert.equal(limiter.size(), 1);
});

test('limiter sweep keeps keys with hits inside the hour', () => {
  let t = 0;
  const limiter = guard.createRateLimiter({ perMinute: 10, perHour: 10, perDay: 100_000, now: () => t });
  for (let i = 0; i < 501; i++) limiter.check(`k-${i}`);
  t = 60_000;
  limiter.check('fresh');
  assert.equal(limiter.size(), 502);
});

/* ── screenReply ──────────────────────────────────────────────────── */

test('screenReply allows known emails, rejects others and caps length', () => {
  const { screenReply, MAX_REPLY_CHARS } = guard;
  assert.deepEqual(screenReply('  Write to Matheus@Kindrazki.dev  ', ['matheus@kindrazki.dev']), { ok: true, text: 'Write to Matheus@Kindrazki.dev' });
  assert.deepEqual(screenReply('Try someone@else.com', ['matheus@kindrazki.dev']), { ok: false });
  assert.deepEqual(screenReply('   ', []), { ok: false });
  const long = screenReply('x'.repeat(MAX_REPLY_CHARS + 100), []);
  assert.equal(long.ok, true);
  assert.equal(long.text.length, MAX_REPLY_CHARS);
});

/* ── handler ──────────────────────────────────────────────────────── */

function makeHandler(overrides = {}) {
  const calls = { generate: [], limiterKeys: [], log: [] };
  const inner = overrides.limiter ?? { check: () => ({ allowed: true }) };
  const generate = overrides.generate ?? (async () => ({ text: 'A reply.', refused: false }));
  const deps = {
    isEnabled: overrides.isEnabled ?? (() => true),
    systemPrompt: 'SYSTEM',
    allowedEmails: ['matheus@kindrazki.dev'],
    limiter: { check: (key) => { calls.limiterKeys.push(key); return inner.check(key); } },
    generate: async (input) => { calls.generate.push(input); return generate(input); },
    log: (event) => calls.log.push(event),
  };
  return { handler: createAskHandler(deps), calls };
}

function post(body, headers = {}) {
  return new Request('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('handler stays offline when disabled and never calls the model', async () => {
  const { handler, calls } = makeHandler({ isEnabled: () => false });
  const res = await handler.POST(post({ message: 'hello' }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { response: prompt.UNAVAILABLE_MESSAGE, available: false, error: 'unavailable' });
  assert.match(body.response, /offline for visitors/);
  assert.equal(calls.generate.length, 0);
  assert.equal(calls.limiterKeys.length, 0);
});

test('handler rejects malformed bodies before any model call, enabled or not', async () => {
  const bodies = ['{', 'null', '[]', 'true', '"text"', '{}', '{"message":42}', '{"message":"   "}', JSON.stringify({ message: 'x'.repeat(801) })];
  for (const enabled of [true, false]) {
    const { handler, calls } = makeHandler({ isEnabled: () => enabled });
    for (const body of bodies) {
      const res = await handler.POST(post(body));
      assert.equal(res.status, 400, `enabled=${enabled} body=${body.slice(0, 30)}`);
    }
    assert.equal(calls.generate.length, 0);
    assert.equal(calls.limiterKeys.length, 0);
  }
});

test('handler rejects oversized bodies with 413 before parsing', async () => {
  const { MAX_BODY_BYTES } = guard;
  assert.equal(MAX_BODY_BYTES, 32_000);
  const { handler, calls } = makeHandler();
  const res = await handler.POST(post(JSON.stringify({ message: 'hi', pad: 'x'.repeat(32_000) })));
  assert.equal(res.status, 413);
  assert.equal((await res.json()).error, 'payload too large');
  assert.equal(calls.generate.length, 0);
  assert.equal(calls.limiterKeys.length, 0);
});

test('handler answers from the model on the happy path', async () => {
  const { handler, calls } = makeHandler();
  const history = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }];
  const res = await handler.POST(post({ message: '  what does he build? ', history }, { 'x-real-ip': '7.7.7.7' }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { response: 'A reply.', available: true });
  assert.deepEqual(calls.limiterKeys, ['7.7.7.7']);
  assert.equal(calls.generate.length, 1);
  assert.equal(calls.generate[0].system, 'SYSTEM');
  assert.deepEqual(calls.generate[0].messages, [...history, { role: 'user', content: 'what does he build?' }]);
  for (const event of calls.log) {
    assert.doesNotMatch(JSON.stringify(event), /what does he build/);
    assert.equal(event.anonymous, undefined);
  }
});

test('handler marks anonymous callers in the log', async () => {
  const { handler, calls } = makeHandler();
  await handler.POST(post({ message: 'hi' }));
  assert.deepEqual(calls.limiterKeys, ['unknown']);
  assert.ok(calls.log.length > 0);
  for (const event of calls.log) assert.equal(event.anonymous, true);
});

test('handler forbids cross-site requests', async () => {
  const { handler, calls } = makeHandler();
  const res = await handler.POST(post({ message: 'hi' }, { origin: 'https://evil.test', host: 'localhost' }));
  assert.equal(res.status, 403);
  assert.equal((await res.json()).error, 'forbidden');
  assert.equal(calls.generate.length, 0);
});

test('handler maps visitor and global limits to distinct 429 messages', async () => {
  const visitor = makeHandler({ limiter: { check: () => ({ allowed: false, scope: 'visitor', retryAfterSeconds: 42 }) } });
  const res = await visitor.handler.POST(post({ message: 'hi' }));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '42');
  assert.deepEqual(await res.json(), { response: prompt.RATE_LIMITED_MESSAGE, available: true, error: 'rate_limited', retry_after: 42 });
  assert.equal(visitor.calls.generate.length, 0);

  const global = makeHandler({ limiter: { check: () => ({ allowed: false, scope: 'global', retryAfterSeconds: 9 }) } });
  const globalRes = await global.handler.POST(post({ message: 'hi' }));
  assert.equal(globalRes.status, 429);
  assert.equal((await globalRes.json()).response, prompt.DAILY_LIMIT_MESSAGE);
});

test('handler with the real limiter: 7th request in a minute is 429, global cap gives the daily message', async () => {
  const limited = createAskHandler({
    isEnabled: () => true,
    systemPrompt: 'S',
    allowedEmails: [],
    limiter: guard.createRateLimiter({ perMinute: 6, perHour: 30, perDay: 100 }),
    generate: async () => ({ text: 'ok', refused: false }),
  });
  for (let i = 0; i < 6; i++) {
    assert.equal((await limited.POST(post({ message: 'hi' }, { 'x-real-ip': '1.2.3.4' }))).status, 200);
  }
  const seventh = await limited.POST(post({ message: 'hi' }, { 'x-real-ip': '1.2.3.4' }));
  assert.equal(seventh.status, 429);
  assert.ok(Number(seventh.headers.get('Retry-After')) >= 1);
  assert.equal((await seventh.json()).response, prompt.RATE_LIMITED_MESSAGE);

  const capped = createAskHandler({
    isEnabled: () => true,
    systemPrompt: 'S',
    allowedEmails: [],
    limiter: guard.createRateLimiter({ perMinute: 6, perHour: 30, perDay: 1 }),
    generate: async () => ({ text: 'ok', refused: false }),
  });
  assert.equal((await capped.POST(post({ message: 'hi' }, { 'x-real-ip': '1.1.1.1' }))).status, 200);
  const daily = await capped.POST(post({ message: 'hi' }, { 'x-real-ip': '2.2.2.2' }));
  assert.equal(daily.status, 429);
  assert.equal((await daily.json()).response, prompt.DAILY_LIMIT_MESSAGE);
});

test('handler maps upstream failures, refusals and unsafe replies', async () => {
  const failing = makeHandler({
    generate: async () => {
      const error = new Error('secret upstream detail about what does he build');
      error.name = 'APIConnectionError';
      error.status = 529;
      throw error;
    },
  });
  const failed = await failing.handler.POST(post({ message: 'what does he build', history: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] }, { 'x-real-ip': '1.1.1.1' }));
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { response: prompt.UPSTREAM_ERROR_MESSAGE, available: true, error: 'upstream' });
  assert.deepEqual(failing.calls.log, [{ status: 503, turns: 3, cause: 'APIConnectionError', upstream_status: 529 }]);

  const plainThrow = makeHandler({ generate: async () => { throw 'nope'; } });
  await plainThrow.handler.POST(post({ message: 'hi' }, { 'x-real-ip': '1.1.1.1' }));
  assert.deepEqual(plainThrow.calls.log, [{ status: 503, turns: 1, cause: 'Error' }]);

  const refusing = makeHandler({ generate: async () => ({ text: '', refused: true }) });
  const refused = await refusing.handler.POST(post({ message: 'hi' }));
  assert.equal(refused.status, 200);
  assert.deepEqual(await refused.json(), { response: prompt.DECLINED_MESSAGE, available: true, error: 'declined' });

  const leaking = makeHandler({ generate: async () => ({ text: 'Mail stranger@private.io', refused: false }) });
  const leaked = await leaking.handler.POST(post({ message: 'hi' }));
  assert.equal(leaked.status, 200);
  assert.deepEqual(await leaked.json(), { response: prompt.UPSTREAM_ERROR_MESSAGE, available: true, error: 'screened' });

  const empty = makeHandler({ generate: async () => ({ text: '   ', refused: false }) });
  const emptied = await empty.handler.POST(post({ message: 'hi' }));
  assert.equal(emptied.status, 200);
  assert.deepEqual(await emptied.json(), { response: prompt.UPSTREAM_ERROR_MESSAGE, available: true, error: 'empty' });
});

test('GET reports availability without caching', async () => {
  for (const enabled of [true, false]) {
    const { handler } = makeHandler({ isEnabled: () => enabled });
    const res = await handler.GET(new Request('http://localhost/api/ask'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await res.json(), { available: enabled });
  }
});

/* ── body limit in bytes, read with a cap ─────────────────────────── */

/** JSON body of exactly `bytes` UTF-8 bytes, padded with `é` (2 bytes each). */
function jsonOfBytes(bytes) {
  const shell = JSON.stringify({ message: 'hi', pad: '' });
  const room = bytes - Buffer.byteLength(shell);
  const pad = 'é'.repeat(Math.floor(room / 2)) + 'x'.repeat(room % 2);
  const body = JSON.stringify({ message: 'hi', pad });
  assert.equal(Buffer.byteLength(body), bytes);
  return body;
}

function countingStream(chunks) {
  const state = { pulls: 0 };
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      state.pulls++;
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
  }, { highWaterMark: 0 });
  return { stream, state };
}

test('handler counts the body limit in bytes, not characters', async () => {
  const { handler, calls } = makeHandler();
  const accented = JSON.stringify({ message: 'hi', pad: 'é'.repeat(20_000) });
  assert.ok(accented.length < guard.MAX_BODY_BYTES);
  const res = await handler.POST(post(accented));
  assert.equal(res.status, 413);
  assert.equal(calls.generate.length, 0);

  const atLimit = await handler.POST(post(jsonOfBytes(guard.MAX_BODY_BYTES)));
  assert.equal(atLimit.status, 200);
  const overLimit = await handler.POST(post(jsonOfBytes(guard.MAX_BODY_BYTES + 1)));
  assert.equal(overLimit.status, 413);
});

test('readCappedBody decodes UTF-8 and accepts a body exactly at the limit', async () => {
  const text = jsonOfBytes(1000);
  assert.deepEqual(await guard.readCappedBody(new Request('http://x/', { method: 'POST', body: text }), 1000), { ok: true, text });
  assert.deepEqual(await guard.readCappedBody(new Request('http://x/', { method: 'POST', body: text }), 999), { ok: false });
  assert.deepEqual(await guard.readCappedBody(new Request('http://x/', { method: 'POST' }), 1000), { ok: true, text: '' });
});

test('readCappedBody rejects an oversized content-length without reading', async () => {
  const { stream, state } = countingStream([new Uint8Array(10)]);
  const result = await guard.readCappedBody({ headers: new Headers({ 'content-length': '40000' }), body: stream }, 32_000);
  assert.deepEqual(result, { ok: false });
  assert.equal(state.pulls, 0);
});

test('readCappedBody stops a growing stream as soon as it passes the limit', async () => {
  const chunks = Array.from({ length: 10 }, () => new Uint8Array(10_000));
  const { stream, state } = countingStream(chunks);
  const result = await guard.readCappedBody({ headers: new Headers(), body: stream }, 32_000);
  assert.deepEqual(result, { ok: false });
  assert.ok(state.pulls <= 5, `pulled ${state.pulls} of 10 chunks`);
});

/* ── reply classification (client) ────────────────────────────────── */

test('classifyReply keeps only real model output as conversation', () => {
  const { classifyReply } = guard;
  assert.deepEqual(classifyReply(200, { response: 'A reply.', available: true }), { content: 'A reply.', local: false });
  for (const error of ['declined', 'screened', 'empty']) {
    assert.deepEqual(classifyReply(200, { response: 'notice', available: true, error }), { content: 'notice', local: true }, error);
  }
  assert.deepEqual(classifyReply(200, { response: 'offline', available: false, error: 'unavailable' }), { content: 'offline', local: true });
  assert.deepEqual(classifyReply(200, { response: 'offline', available: false }), { content: 'offline', local: true });
  assert.deepEqual(classifyReply(429, { response: 'slow down', available: true, error: 'rate_limited' }), { content: 'slow down', local: true });
  assert.deepEqual(classifyReply(503, { response: 'oops', available: true }), { content: 'oops', local: true });
  assert.deepEqual(classifyReply(200, { available: true }), { content: null, local: true });
  assert.deepEqual(classifyReply(200, { response: '', available: true }), { content: null, local: true });
  for (const body of [null, 'text', 42, ['a']]) assert.deepEqual(classifyReply(200, body), { content: null, local: true });
});

test('every handler body carries an error code exactly when it is not model output', async () => {
  const cases = [
    [makeHandler(), true],
    [makeHandler({ isEnabled: () => false }), false],
    [makeHandler({ generate: async () => ({ text: '', refused: true }) }), false],
    [makeHandler({ generate: async () => ({ text: 'x@evil.test', refused: false }) }), false],
    [makeHandler({ generate: async () => ({ text: ' ', refused: false }) }), false],
    [makeHandler({ generate: async () => { throw new Error('x'); } }), false],
    [makeHandler({ limiter: { check: () => ({ allowed: false, scope: 'visitor', retryAfterSeconds: 1 }) } }), false],
  ];
  for (const [{ handler }, isModelOutput] of cases) {
    const res = await handler.POST(post({ message: 'hi' }));
    const body = await res.json();
    assert.equal(typeof body.error === 'string', !isModelOutput, JSON.stringify(body));
    assert.equal(guard.classifyReply(res.status, body).local, !isModelOutput);
  }
});

/* ── anthropic (through a stub fetch) ─────────────────────────────── */

function stubFetch(message) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(JSON.stringify({
      id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
      stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 }, ...message,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetch, requests };
}

const fallbackBlock = {
  type: 'fallback',
  from: { model: 'claude-opus-5-5' },
  to: { model: 'claude-opus-5' },
  trigger: { type: 'refusal' },
};

async function runGenerate(message) {
  const stub = stubFetch(message);
  const generate = createGenerate({ apiKey: 'test-only', model: 'claude-opus-5-5', fetch: stub.fetch });
  const result = await generate({ system: 'SYS', messages: [{ role: 'user', content: 'hi' }] });
  return { result, requests: stub.requests };
}

test('createGenerate sends one tool-free cached request to the Messages API', async () => {
  const { result, requests } = await runGenerate({ content: [{ type: 'text', text: 'Hello there.' }], stop_reason: 'end_turn' });
  assert.deepEqual(result, { text: 'Hello there.', refused: false });
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url);
  assert.equal(url.host, 'api.anthropic.com');
  assert.match(url.pathname, /\/v1\/messages$/);
  const body = requests[0].body;
  assert.equal('tools' in body, false);
  assert.equal(body.max_tokens, 1000);
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' });
  assert.equal(body.system[0].text, 'SYS');
});

test('createGenerate keeps only the text after the last fallback block', async () => {
  const { result } = await runGenerate({
    content: [
      { type: 'text', text: 'abandoned partial' },
      fallbackBlock,
      { type: 'text', text: 'Real answer.' },
      { type: 'text', text: 'Second part.' },
    ],
    stop_reason: 'end_turn',
  });
  assert.deepEqual(result, { text: 'Real answer.\nSecond part.', refused: false });
});

test('createGenerate reports refusals and trims truncated replies to a sentence end', async () => {
  const refused = await runGenerate({ content: [{ type: 'text', text: 'partial' }], stop_reason: 'refusal' });
  assert.deepEqual(refused.result, { text: '', refused: true });

  const cut = await runGenerate({ content: [{ type: 'text', text: 'One. Two! Three? Four is cut mid' }], stop_reason: 'max_tokens' });
  assert.deepEqual(cut.result, { text: 'One. Two! Three?', refused: false });

  const noEnd = await runGenerate({ content: [{ type: 'text', text: 'v1.2 has no sentence end' }], stop_reason: 'max_tokens' });
  assert.deepEqual(noEnd.result, { text: '', refused: false });
});

/* ── links ────────────────────────────────────────────────────────── */

test('publicLinkTargets lists the site host and normalised published URLs', () => {
  const targets = publicLinkTargets({
    profile: { ...content.profile, calLink: 'https://Cal.com/x/', social: { github: 'https://github.com/a', bad: 'not a url' } },
    projects: [
      { link: 'https://www.applause.team/', caseNote: { references: [{ label: 'r', url: 'https://ref.example/x' }] } },
      { link: 'https://github.com/a' },
      {},
    ],
    writing: [{ link: 'https://medium.example/p' }],
  });
  assert.equal(targets.siteHost, 'matheuskindrazki.dev');
  assert.deepEqual([...targets.urls].sort(), [
    'https://cal.com/x', 'https://github.com/a', 'https://medium.example/p', 'https://ref.example/x', 'https://www.applause.team',
  ].sort());
});

test('splitLinks links only published URLs, the site host and allowed emails', () => {
  const targets = { siteHost: 'matheuskindrazki.dev', urls: ['https://cal.com/matheuskindrazki', 'https://github.com/matheuskindrazki'] };
  const emails = ['matheus@kindrazki.dev'];
  const join = (segments) => segments.map((s) => s.value).join('');
  const isLink = (url) => splitLinks(url, targets, emails)[0].type === 'link';

  assert.deepEqual(splitLinks('no links here', targets, emails), [{ type: 'text', value: 'no links here' }]);

  const text = 'See https://matheuskindrazki.dev/contato/. Or book https://cal.com/matheuskindrazki, or mail Matheus@Kindrazki.dev!';
  const segments = splitLinks(text, targets, emails);
  assert.equal(join(segments), text);
  assert.deepEqual(segments.filter((s) => s.type === 'link'), [
    { type: 'link', value: 'https://matheuskindrazki.dev/contato/', href: 'https://matheuskindrazki.dev/contato/' },
    { type: 'link', value: 'https://cal.com/matheuskindrazki', href: 'https://cal.com/matheuskindrazki' },
    { type: 'link', value: 'Matheus@Kindrazki.dev', href: 'mailto:Matheus@Kindrazki.dev' },
  ]);
  assert.deepEqual(segments.at(-1), { type: 'text', value: '!' });

  assert.deepEqual(splitLinks('(https://cal.com/matheuskindrazki);:?', targets, emails), [
    { type: 'text', value: '(' },
    { type: 'link', value: 'https://cal.com/matheuskindrazki', href: 'https://cal.com/matheuskindrazki' },
    { type: 'text', value: ');:?' },
  ]);

  assert.ok(isLink('https://cal.com/matheuskindrazki/30min'));
  assert.ok(isLink('https://cal.com/matheuskindrazki/'));
  assert.ok(isLink('https://CAL.COM/matheuskindrazki'));
  assert.ok(isLink('https://www.matheuskindrazki.dev/now/'));
  assert.ok(isLink('https://matheuskindrazki.dev/anything/at/all?x=1'));
  assert.ok(!isLink('https://cal.com/attacker'));
  assert.ok(!isLink('https://cal.com/matheuskindrazkiX'));
  assert.ok(!isLink('https://cal.com@evil.test/'));
  assert.ok(!isLink('https://user:pw@matheuskindrazki.dev/'));
  assert.ok(!isLink('https://matheuskindrazki.dev:8443/'));
  assert.ok(!isLink('https://cal.com:443/matheuskindrazki'));
  assert.ok(!isLink('https://blog.matheuskindrazki.dev/'));
  assert.ok(!isLink('https://gist.github.com/matheuskindrazki'));

  const hostile = 'http://cal.com/matheuskindrazki javascript:alert(1) https://evil.test/x https://matheuskindrazki.dev.evil.test/ stranger@private.io';
  assert.deepEqual(splitLinks(hostile, targets, emails), [{ type: 'text', value: hostile }]);
});

test('site-links exports targets and emails derived from the real content', () => {
  assert.deepEqual(siteLinks.LINK_TARGETS, publicLinkTargets(content));
  assert.deepEqual(siteLinks.LINK_EMAILS, [content.profile.email.toLowerCase()]);
  assert.ok(siteLinks.LINK_TARGETS.urls.includes(content.profile.calLink.replace(/\/$/, '').toLowerCase()));
});

/* ── source guards ────────────────────────────────────────────────── */

test('public edition sources never reference the private backend', async () => {
  const dir = new URL('../src/lib/jarvis-public/', import.meta.url);
  const files = (await readdir(dir)).map((name) => new URL(name, dir));
  files.push(new URL('../src/app/api/ask/route.ts', import.meta.url));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /JARVIS_API_URL|JARVIS_API_KEY|jarvis\.kindrazki\.dev/, file.pathname);
  }
  const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  assert.doesNotMatch(env, /JARVIS_API_KEY/);
  const anthropic = await readFile(new URL('../src/lib/jarvis-public/anthropic.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(anthropic, /tools:/);
});

test('JarvisChat renders links without raw HTML injection and keeps focus while loading', async () => {
  const source = await readFile(new URL('../src/components/chat/JarvisChat.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
  assert.match(source, /splitLinks\(/);
  assert.match(source, /LINK_TARGETS/);
  assert.match(source, /readOnly=\{loading\}/);
  assert.doesNotMatch(source, /grounded on|suggestedButtons/);
});
