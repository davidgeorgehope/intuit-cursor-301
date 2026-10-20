export type ConsoleCheck = {
  id: string;
  pass: boolean;
  detail: string;
};

export function visibleText(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, " ").replace(/\s+/g, " ");
}

export function checkReturnsApi(status: number, body: unknown): ConsoleCheck {
  if (status !== 200) {
    return { id: "returns-api", pass: false, detail: `HTTP ${status}` };
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as { returns?: unknown }).returns)) {
    return { id: "returns-api", pass: false, detail: "body has no returns array" };
  }
  const returns = (body as { returns: unknown[] }).returns;
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(JSON.stringify(body))) {
    return { id: "returns-api", pass: false, detail: "response contains an SSN-shaped number" };
  }
  if (returns.length < 1) {
    return { id: "returns-api", pass: false, detail: "returns array is empty" };
  }
  return {
    id: "returns-api",
    pass: true,
    detail: `HTTP 200, ${returns.length} returns, no SSN-shaped number`,
  };
}

export function checkRejectsPage(status: number, html: string): ConsoleCheck {
  if (status !== 200) {
    return { id: "rejects", pass: false, detail: `HTTP ${status}` };
  }
  const text = visibleText(html);
  if (!text.includes("Rejected returns")) {
    return { id: "rejects", pass: false, detail: "page is missing the Rejected returns heading" };
  }
  if (!text.includes("7 days left")) {
    return { id: "rejects", pass: false, detail: "page does not show 7 days left" };
  }
  return { id: "rejects", pass: true, detail: "HTTP 200, heading present, 7 days left" };
}

export function checkCreditReview(status: number, html: string): ConsoleCheck {
  if (status !== 200) {
    return { id: "credit-review", pass: false, detail: `HTTP ${status}` };
  }
  const text = visibleText(html);
  if (!text.includes("Allowed credit") || !text.includes("$2,500.00")) {
    return { id: "credit-review", pass: false, detail: "allowed credit is not $2,500.00" };
  }
  if (!text.includes("$4,000.00")) {
    return { id: "credit-review", pass: false, detail: "the $4,000.00 claim is missing" };
  }
  return {
    id: "credit-review",
    pass: true,
    detail: "HTTP 200, allowed credit $2,500.00 under a $4,000.00 claim",
  };
}
