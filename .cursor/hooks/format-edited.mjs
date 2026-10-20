#!/usr/bin/env node
// afterFileEdit: strip trailing whitespace on source the agent just wrote.
// Observe-only from Cursor's point of view; the script may rewrite the file.
// Skips generated trees and the hook log so the formatter cannot loop on itself.

import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { isDirectRun, projectRoot, readStdinJson } from "./hook-io.mjs";

const SOURCE = new Set([".ts", ".tsx", ".mjs", ".md", ".json", ".css"]);

export function stripTrailingWhitespace(text) {
  const normalized = text.replace(/[ \t]+$/gm, "");
  if (text.endsWith("\n") || normalized === "") return normalized;
  return normalized;
}

export function shouldFormat(filePath, root) {
  const rel = relative(root, filePath);
  if (rel.startsWith("..") || rel.includes("node_modules/") || rel.startsWith(".next/")) return false;
  if (rel.startsWith("artifacts/") || rel.startsWith(".cursor/hook-logs/")) return false;
  const dot = filePath.lastIndexOf(".");
  if (dot < 0) return false;
  return SOURCE.has(filePath.slice(dot));
}

export function formatFile(filePath) {
  const before = readFileSync(filePath, "utf8");
  const after = stripTrailingWhitespace(before);
  if (after !== before) writeFileSync(filePath, after.endsWith("\n") ? after : `${after}\n`);
  return after !== before;
}

function log(root, line) {
  const dir = join(root, ".cursor/hook-logs");
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "format.log"), `${line}\n`);
}

async function main() {
  const input = await readStdinJson();
  const root = projectRoot();
  const filePath = typeof input.file_path === "string" ? input.file_path : "";
  if (!filePath || !shouldFormat(filePath, root)) return;
  try {
    const changed = formatFile(filePath);
    log(root, `${changed ? "formatted" : "unchanged"} ${relative(root, filePath)}`);
  } catch {
    log(root, `skipped ${filePath}`);
  }
}

if (isDirectRun(import.meta.url)) {
  await main();
}
