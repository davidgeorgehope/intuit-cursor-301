import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function projectRoot() {
  const file = fileURLToPath(import.meta.url);
  return process.env.CURSOR_PROJECT_DIR || dirname(dirname(dirname(file)));
}

export async function readStdinJson() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { __invalidJson: true };
  }
}

export function writeJson(value) {
  process.stdout.write(JSON.stringify(value));
}

export function isDirectRun(importMetaUrl) {
  return importMetaUrl === pathToFileURL(process.argv[1] ?? "").href;
}
