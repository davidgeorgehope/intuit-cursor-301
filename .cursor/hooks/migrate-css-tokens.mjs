#!/usr/bin/env node
// afterFileEdit: run the deterministic CSS token codemod on the .css file the agent just edited.
// Same map (migrations/css-tokens/map.json), same output every time. Logs to .cursor/hook-logs/migrate.log.
// Skips the codemod's own fixtures, so the golden tests keep their legacy input.
import { appendFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { isDirectRun, projectRoot, readStdinJson } from "./hook-io.mjs";
import { loadMap, migrateFile } from "../../migrations/css-tokens/codemod.mjs";

export function shouldMigrate(filePath, root) {
  if (!filePath.endsWith(".css")) return false;
  const rel = relative(root, filePath);
  if (rel.startsWith("..") || rel.includes("node_modules/") || rel.startsWith(".next/")) return false;
  if (rel.startsWith("migrations/css-tokens/fixtures/")) return false;
  return true;
}

function log(root, line) {
  const dir = join(root, ".cursor/hook-logs");
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "migrate.log"), `${new Date().toISOString()} ${line}\n`);
}

async function main() {
  const input = await readStdinJson();
  const root = projectRoot();
  const filePath = typeof input.file_path === "string" ? input.file_path : "";
  if (!filePath || !shouldMigrate(filePath, root)) return;
  try {
    const { changed, replacements } = migrateFile(filePath, loadMap());
    log(root, `${changed ? `migrated (${replacements})` : "clean"} ${relative(root, filePath)}`);
  } catch (error) {
    log(root, `skipped ${relative(root, filePath)}: ${error.message}`);
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
}
