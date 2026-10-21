// Offline unit test for the deterministic step. No model, no API key, no tokens.
// Run: npm test (node --test, Node 22.13+ strips the types).
import assert from "node:assert/strict";
import { test } from "node:test";
import { findLegacyTokens, TOKEN_MAP } from "../bot/lib/token-map.ts";

test("finds each legacy token with its line and replacement", () => {
  const css = ".btn {\n  color: var(--brand-blue);\n  padding: var(--space-sm);\n}";
  assert.deepEqual(findLegacyTokens(css), [
    { line: 2, legacy: "--brand-blue", replacement: "--color-action-primary" },
    { line: 3, legacy: "--space-sm", replacement: "--spacing-200" },
  ]);
});

test("clean CSS returns no hits", () => {
  assert.deepEqual(findLegacyTokens(".card { color: var(--color-action-primary); }"), []);
});

test("same input, same output (deterministic)", () => {
  const css = ".x { background: var(--brand-gray-100); }";
  assert.deepEqual(findLegacyTokens(css), findLegacyTokens(css));
});

test("every replacement is a new token, never another legacy name", () => {
  for (const replacement of Object.values(TOKEN_MAP)) {
    assert.equal(replacement in TOKEN_MAP, false, replacement);
  }
});
