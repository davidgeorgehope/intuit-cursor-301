export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Refunds read as an amount; a balance due reads as "… due", never as a negative refund. */
export function formatRefund(cents: number): string {
  return cents < 0 ? `${formatUsd(-cents)} due` : formatUsd(cents);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
