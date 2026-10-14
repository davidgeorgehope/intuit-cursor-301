import type { MissionSpec } from "@/lib/missions";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
};

export type DryRunEvent = {
  type: string;
  subtype?: string;
  mission?: string;
  model?: string;
  is_error?: boolean;
  costUsd?: number;
  usage?: TokenUsage;
  message?: { content: { type: string; text: string }[] };
  note?: string;
};

const ZERO_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: 0,
};

/** Local stand-in for `agent -p --output-format stream-json`. Not a byte match for the CLI. */
export function buildDryRunStream(input: {
  mission: MissionSpec & { id: string };
  exitCode: number;
  summary: string;
}): DryRunEvent[] {
  const passed = input.exitCode === 0;
  return [
    {
      type: "system",
      subtype: "init",
      model: "dry-run",
      mission: input.mission.id,
      note: "Dry-run does not call a model. costUsd is 0.",
    },
    {
      type: "assistant",
      message: {
        content: [
          {
            type: "text",
            text: `${input.mission.title}: ran \`${input.mission.doneWhen}\`. Exit ${input.exitCode}. ${input.summary}`,
          },
        ],
      },
    },
    {
      type: "result",
      subtype: passed ? "success" : "error",
      is_error: !passed,
      usage: ZERO_USAGE,
      costUsd: 0,
      note: input.mission.budget.note,
    },
  ];
}

export function compareChecks(input: { weakExit: number; strongExit: number }): string {
  const weak = input.weakExit === 0 ? "PASS" : "FAIL";
  const strong = input.strongExit === 0 ? "PASS" : "FAIL";
  return [
    "mission: extension-pace",
    `  before (node --experimental-strip-types --check): ${weak}`,
    `  after (npm test -- tests/extension-pace.test.ts): ${strong}`,
    "  costUsd: 0",
    "  A syntax check can pass while the off-by-one is planted. The unit test cannot.",
  ].join("\n");
}
