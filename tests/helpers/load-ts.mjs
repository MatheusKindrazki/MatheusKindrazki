import { rmSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// Temp output lives inside the repo so bare npm imports (e.g. the Anthropic
// SDK) resolve from the repo's node_modules. Removed when the process exits.
const cacheRoot = path.join(repoRoot, 'node_modules', '.cache');
const created = [];
process.on('exit', () => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

const RELATIVE_IMPORT = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.\.?\/[^'"]+)\2/g;

/**
 * Transpiles a TypeScript file and the relative `./x` TypeScript files it
 * imports (recursively) into a fresh temp directory as `.mjs`, then imports
 * the entry. Supports relative `.ts` imports only (no `@/` alias); bare npm
 * imports resolve from the repo's node_modules.
 */
export async function loadTsModules(entryRelativeToRepoRoot) {
  await mkdir(cacheRoot, { recursive: true });
  const outDir = await mkdtemp(path.join(cacheRoot, 'load-ts-'));
  created.push(outDir);
  const done = new Map();

  async function emit(sourcePath) {
    if (done.has(sourcePath)) return done.get(sourcePath);
    const relative = path.relative(repoRoot, sourcePath).replace(/\.ts$/, '.mjs');
    const target = path.join(outDir, relative);
    done.set(sourcePath, target);

    const source = await readFile(sourcePath, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
    });

    const deps = [];
    const rewritten = outputText.replace(RELATIVE_IMPORT, (_match, lead, quote, specifier) => {
      const resolved = path.resolve(path.dirname(sourcePath), specifier.replace(/\.(ts|js|mjs)$/, ''));
      deps.push(`${resolved}.ts`);
      return `${lead}${quote}${specifier.replace(/\.(ts|js|mjs)$/, '')}.mjs${quote}`;
    });

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, rewritten);
    for (const dep of deps) await emit(dep);
    return target;
  }

  const entry = await emit(path.resolve(repoRoot, entryRelativeToRepoRoot));
  return import(pathToFileURL(entry).href);
}
