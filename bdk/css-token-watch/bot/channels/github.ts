import { defaultGitHubAuth, githubChannel } from "@cursor/bdk/channels/github";

// Watched repos come from the command line: bdk serve --repo org/plugin-a --repo org/plugin-b ...
export default githubChannel({
  botName: "css-token-watch",
  cursorAccount: true,
  // Wake the model only when CI fails on a pull request.
  onCheckSuite: (ctx, suite) => {
    if (suite.conclusion !== "failure") {
      return null;
    }
    return { auth: defaultGitHubAuth(ctx) };
  },
});
