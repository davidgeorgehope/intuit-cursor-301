#!/usr/bin/env node
// Deterministic CSS token codemod. Reads map.json and rewrites var(--old) to var(--new).
// - One regex pass with a map lookup: no model, no randomness, no dependence on map or file order.
// - Idempotent: a new token is never an old token (checked at load), so a second run changes nothing.
// Usage:
//   node migrations/css-tokens/codemod.mjs <file-or-dir>...          rewrite in place
//   node migrations/css-tokens/codemod.mjs --check <file-or-dir>...  exit 1 if legacy tokens remain
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const MAP_PATH = join(HERE, "map.json");

export function loadMap(path = MAP_PATH) {
  const { tokens } = JSON.parse(readFileSync(path, "utf8"));
  for (const [legacy, next] of Object.entries(tokens)) {
    if (next in tokens) throw new Error(`map.json: ${legacy} -> ${next}, but ${next} is also a legacy token`);
  }
  return tokens;
}

// var( --name ) or var(--name, fallback). Only the custom property name changes.
const VAR_RE = /var\(\s*(--[A-Za-z0-9_-]+)(?=\s*[,)])/g;

export function migrateCss(css, map) {
  let replacements = 0;
  const out = css.replace(VAR_RE, (match, name) => {
    const next = map[name];
    if (!next) return match;
    replacements += 1;
    return match.replace(name, next);
  });
  return { css: out, replacements };
}

export function findLegacy(css, map) {
  const hits = [];
  css.split("\n").forEach((text, index) => {
    for (const m of text.matchAll(VAR_RE)) {
      if (map[m[1]]) hits.push({ line: index + 1, legacy: m[1], replacement: map[m[1]] });
    }
  });
  return hits;
}

export function listCssFiles(paths) {
  const files = [];
  const walk = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        walk(join(p, name));
      }
    } else if (p.endsWith(".css")) {
      files.push(resolve(p));
    }
  };
  paths.forEach(walk);
  return [...new Set(files)].sort();
}

export function migrateFile(file, map) {
  const before = readFileSync(file, "utf8");
  const { css, replacements } = migrateCss(before, map);
  if (css !== before) writeFileSync(file, css);
  return { file, changed: css !== before, replacements };
}

export function migrateFiles(files, map) {
  return files.map((f) => migrateFile(f, map));
}

function main(argv) {
  const check = argv.includes("--check");
  const paths = argv.filter((a) => !a.startsWith("--"));
  if (paths.length === 0) {
    console.error("usage: codemod.mjs [--check] <file-or-dir>...");
    return 2;
  }
  const map = loadMap();
  const files = listCssFiles(paths);
  const cwd = process.cwd();
  if (check) {
    let total = 0;
    for (const file of files) {
      for (const hit of findLegacy(readFileSync(file, "utf8"), map)) {
        total += 1;
        console.log(`${relative(cwd, file)}:${hit.line} ${hit.legacy} -> ${hit.replacement}`);
      }
    }
    console.log(total === 0 ? `check: clean (${files.length} files)` : `check: ${total} legacy tokens in ${files.length} files`);
    return total === 0 ? 0 : 1;
  }
  const results = migrateFiles(files, map);
  for (const r of results) if (r.changed) console.log(`migrated ${relative(cwd, r.file)} (${r.replacements} replacements)`);
  const changed = results.filter((r) => r.changed).length;
  const reps = results.reduce((n, r) => n + r.replacements, 0);
  console.log(`codemod: ${changed} of ${files.length} files changed, ${reps} replacements`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main(process.argv.slice(2)));
}
