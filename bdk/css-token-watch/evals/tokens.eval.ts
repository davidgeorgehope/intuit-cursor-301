import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "legacy-token-found",
      description: "Uses the tool and names the replacement token.",
      async test(t) {
        await t.send(
          "Check src/button.css: .btn { color: var(--brand-blue); padding: var(--space-sm); }",
        );
        t.succeeded();
        t.calledTool("find_legacy_tokens");
        t.check(t.reply, includes(/--color-action-primary/));
      },
    },
    {
      id: "clean-css-no-invented-tokens",
      description: "Clean CSS: says clean and does not invent a migration.",
      async test(t) {
        await t.send("Check src/card.css: .card { color: var(--color-action-primary); }");
        t.succeeded();
        t.calledTool("find_legacy_tokens");
        t.check(t.reply, includes(/clean|no legacy/i));
      },
    },
  ],
});
