import { defineTool } from "@cursor/bdk/tools";
import * as z from "zod/v4";
import { findLegacyTokens } from "../lib/token-map.js";

export default defineTool({
  description:
    "Find legacy CSS variables in a CSS snippet and return the new design token for each. Deterministic. Use it before you name any token.",
  inputSchema: z.object({
    path: z.string().describe("File path, for the report."),
    css: z.string().describe("The CSS text to check."),
  }),
  async execute({ path, css }) {
    const hits = findLegacyTokens(css);
    return { path, clean: hits.length === 0, hits };
  },
});
