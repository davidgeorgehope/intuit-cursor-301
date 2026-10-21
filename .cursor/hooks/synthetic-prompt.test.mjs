import assert from "node:assert/strict";
import { test } from "node:test";
import { checkPrompt } from "./synthetic-prompt.mjs";

test("allows seed .example addresses", () => {
  assert.deepEqual(checkPrompt({ prompt: "Email jordan.hale@mail.example about the TY25-1041 refund." }), {
    continue: true,
  });
});

test("blocks an address outside the synthetic set", () => {
  const result = checkPrompt({ prompt: "Send the reject fix to jordan.hale@intuit.com." });
  assert.equal(result.continue, false);
  assert.match(result.user_message, /jordan\.hale@intuit\.com/);
});

test("treats example.com as outside the synthetic set", () => {
  assert.equal(checkPrompt({ prompt: "Use ops@example.com." }).continue, false);
});

test("blocks an SSN-shaped number without echoing it", () => {
  const result = checkPrompt({ prompt: "Create a test for Jordan Hale that uses SSN 123-45-6789." });
  assert.equal(result.continue, false);
  assert.match(result.user_message, /SSN-shaped number/);
  assert.doesNotMatch(result.user_message, /123-45-6789/);
});

test("allows fixture SSNs that start with 000 and the SSA advertising range", () => {
  assert.deepEqual(checkPrompt({ prompt: "Use 000-12-4821 for the fixture." }), { continue: true });
  assert.deepEqual(checkPrompt({ prompt: "Use 987-65-4321 for the fixture." }), { continue: true });
});

test("blocks an EIN-shaped number", () => {
  const result = checkPrompt({ prompt: "The employer EIN on the W-2 is 12-3456789." });
  assert.equal(result.continue, false);
  assert.match(result.user_message, /EIN-shaped number/);
  assert.doesNotMatch(result.user_message, /12-3456789/);
});

test("names the credential kind without echoing the value", () => {
  const result = checkPrompt({ prompt: "Key AKIAIOSFODNN7EXAMPLE for noor.voss@mail.example" });
  assert.equal(result.continue, false);
  assert.match(result.user_message, /AWS access key/);
  assert.doesNotMatch(result.user_message, /AKIAIOSFODNN7EXAMPLE/);
});

test("allows a prompt with no address, taxpayer ID, or credential", () => {
  assert.deepEqual(checkPrompt({ prompt: "Resubmit TY25-1042 after fixing IND-032-04." }), {
    continue: true,
  });
});

test("fails open on a missing prompt", () => {
  assert.deepEqual(checkPrompt({}), { continue: true });
});
