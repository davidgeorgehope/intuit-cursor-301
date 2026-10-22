// Golden-file tests for the CSS token codemod. No model, no tokens.
// Run: npm run migrate:golden
import assert from "node:assert/strict";
import { test } from "node:test";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findLegacy, listCssFiles, loadMap, migrateCss, migrateFiles } from "./codemod.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT = join(HERE, "fixtures/input");
const GOLDEN = join(HERE, "fixtures/golden");
const ROOT = join(HERE, "../..");
const map = loadMap();

function freshCopy() {
  const dir = mkdtempSync(join(tmpdir(), "css-tokens-"));
  cpSync(INPUT, dir, { recursive: true });
  return dir;
}

function snapshot(dir) {
  return Object.fromEntries(readdirSync(dir).sort().map((f) => [f, readFileSync(join(dir, f))]));
}

test("bytes match the golden files", () => {
  const dir = freshCopy();
  try {
    migrateFiles(listCssFiles([dir]), map);
    const got = snapshot(dir);
    const want = snapshot(GOLDEN);
    assert.deepEqual(Object.keys(got), Object.keys(want));
    for (const f of Object.keys(want)) assert.ok(got[f].equals(want[f]), `${f} differs from golden`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("second run makes zero changes (idempotent)", () => {
  const dir = freshCopy();
  try {
    const files = listCssFiles([dir]);
    const first = migrateFiles(files, map);
    assert.ok(first.some((r) => r.changed));
    const second = migrateFiles(files, map);
    assert.equal(second.filter((r) => r.changed).length, 0);
    assert.equal(second.reduce((n, r) => n + r.replacements, 0), 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("shuffled file order gives the same result", () => {
  const a = freshCopy();
  const b = freshCopy();
  try {
    migrateFiles(listCssFiles([a]), map);
    const files = listCssFiles([b]).reverse();
    [files[0], files[files.length - 1]] = [files[files.length - 1], files[0]];
    migrateFiles([...files].reverse(), map);
    const sa = snapshot(a);
    const sb = snapshot(b);
    for (const f of Object.keys(sa)) assert.ok(sa[f].equals(sb[f]), `${f} depends on order`);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test("map order does not matter", () => {
  const reversed = Object.fromEntries(Object.entries(map).reverse());
  const css = readFileSync(join(INPUT, "button.css"), "utf8");
  assert.equal(migrateCss(css, reversed).css, migrateCss(css, map).css);
});

test("--check exits 1 on the input and 0 on the golden files", () => {
  const cli = join(HERE, "codemod.mjs");
  const bad = spawnSync("node", [cli, "--check", INPUT], { encoding: "utf8" });
  assert.equal(bad.status, 1, bad.stdout);
  assert.match(bad.stdout, /legacy tokens/);
  const good = spawnSync("node", [cli, "--check", GOLDEN], { encoding: "utf8" });
  assert.equal(good.status, 0, good.stdout);
  assert.equal(findLegacy(readFileSync(join(GOLDEN, "card.css"), "utf8"), map).length, 0);
});

test("BDK token-map.ts has the same entries as map.json", () => {
  const src = readFileSync(join(ROOT, "bdk/css-token-watch/bot/lib/token-map.ts"), "utf8");
  const body = src.slice(src.indexOf("TOKEN_MAP"), src.indexOf("};"));
  const bdk = Object.fromEntries([...body.matchAll(/"(--[^"]+)":\s*"(--[^"]+)"/g)].map((m) => [m[1], m[2]]));
  assert.deepEqual(bdk, map, `update ${basename("token-map.ts")} or map.json so they match`);
});
