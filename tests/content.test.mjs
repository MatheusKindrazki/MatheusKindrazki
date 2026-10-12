import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const content = await loadTypeScript('../src/lib/content.ts');
const { profile, projects, roleSignals, timeline, nowBuilding, skillCategories } = content;

test('Applause is identified as CTO without equity or partner claims', () => {
  assert.equal(profile.title, 'CTO at Applause.team');
  assert.equal(roleSignals.find((item) => item.organization === 'Applause.team').role, 'CTO');
  assert.equal(projects.find((item) => item.id === 'applause').role, 'cto');
  assert.doesNotMatch(JSON.stringify({ profile, projects, roleSignals, timeline }), /\b(partner|equity)\b/i);
  assert.equal(roleSignals.find((item) => item.organization === 'MokLabs').role, 'Co-founder');
});

test('project identifiers are unique and stable URL tokens', () => {
  assert.equal(projects.length, 16);
  assert.equal(new Set(projects.map((item) => item.id)).size, projects.length);
  for (const project of projects) assert.match(project.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('selected case notes separate approach and public evidence', () => {
  assert.deepEqual(projects.filter((item) => item.caseNote).map((item) => item.id), ['applause', 'jarvis', 'arco']);
  for (const project of projects.filter((item) => item.caseNote)) {
    for (const key of ['problem', 'approach', 'evidence']) assert.ok(project.caseNote[key].length > 20);
    for (const reference of project.caseNote.references ?? []) assert.equal(new URL(reference.url).protocol, 'https:');
  }
  const jarvis = projects.find((item) => item.id === 'jarvis');
  assert.match(jarvis.description, /private system, not a public chatbot/);
  assert.match(jarvis.nowNote, /Offline for site visitors/);
  assert.doesNotMatch(profile.description, /millions|every event|everything I touch/i);
});

test('Now derives its project stage notes without treating focus as deployment', async () => {
  const current = projects.filter((item) => item.status === 'current');
  assert.equal(nowBuilding.length, current.length);
  current.forEach((project, index) => {
    assert.equal(nowBuilding[index].description, project.nowNote ?? project.description);
    assert.equal(nowBuilding[index].status, project.nowStatus ?? 'building');
  });
  const source = await readFile(new URL('../src/app/projetos/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /current: "current work"/);
  assert.match(source, /past: "past work"/);
  const nowSource = await readFile(new URL('../src/app/now/page.tsx', import.meta.url), 'utf8');
  assert.match(nowSource, /not live deployment checks/);
  for (const route of ['now', 'skills', 'projetos']) {
    const metadata = await readFile(new URL(`../src/app/${route}/layout.tsx`, import.meta.url), 'utf8');
    assert.doesNotMatch(metadata, /live project data|works with daily|A live atlas/);
  }
});

test('skill categories explain their purpose, not an implied proficiency score', () => {
  assert.equal(skillCategories.length, 5);
  assert.ok(skillCategories.every((category) => category.focus.length > 20 && category.skills.length > 0));
});

test('visitor UI presents contact/case links rather than inviting an offline chat', async () => {
  const source = await readFile(new URL('../src/components/chat/JarvisChat.tsx', import.meta.url), 'utf8');
  assert.match(source, /const VISITOR_CHAT_AVAILABLE = false/);
  assert.match(source, /href="\/contato\/"/);
  assert.match(source, /href="\/projetos\/\?project=jarvis"/);
  assert.match(source, /!VISITOR_CHAT_AVAILABLE \|\| !trimmed/);
  const home = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
  const trigger = await readFile(new URL('../src/components/chat/JarvisTrigger.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(trigger, />online<|Open Jarvis chat|if \(open\) return null/);
  assert.match(trigger, /aria-haspopup="dialog"/);
  assert.match(home, /meet jarvis/);
  assert.doesNotMatch(home, /ask jarvis|CTO & PARTNER/);
});

test('public API stays offline when public mode is disabled, even with credentials present', async () => {
  // Test-only placeholders. No real backend or personal data is accessed.
  process.env.JARVIS_PUBLIC_MODE = 'disabled';
  process.env.JARVIS_API_URL = 'https://example.invalid';
  process.env.JARVIS_API_KEY = 'test-only';
  const { POST } = await loadTypeScript('../src/app/api/ask/route.ts');
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected upstream call'); };
  try {
    const response = await POST(new Request('http://localhost/api/ask', {
      method: 'POST', body: JSON.stringify({ message: 'test visitor request' }),
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.response, /offline for visitors/);
    assert.equal(body.conversation_id, null);
    assert.deepEqual(body.sources, []);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('public API rejects malformed and oversized input without calling an upstream', async () => {
  const { POST } = await loadTypeScript('../src/app/api/ask/route.ts');
  for (const body of ['{', 'null', '[]', 'true', '"text"', '{}', '{"message":42}', '{"message":"   "}', JSON.stringify({ message: 'x'.repeat(2001) })]) {
    const response = await POST(new Request('http://localhost/api/ask', { method: 'POST', body }));
    assert.equal(response.status, 400, `Expected 400 for input shape: ${body.slice(0, 40)}`);
  }
});
