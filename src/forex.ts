// Hardcoded forex rates: 1 unit of currency = X USD.
// TODO: replace with a live forex feed before going to production.
export const forexRates: Record<string, number> = {
  USD: 1.0,
  AUD: 0.63,
  GBP: 1.27,
  EUR: 1.05,
  JPY: 0.0066,
  CAD: 0.72,
  HKD: 0.13,
  NZD: 0.57,
  SGD: 0.74,
  CHF: 1.12,
};

export function toUsd(amount: number, currency: string): number {
  const rate = forexRates[currency.toUpperCase()];
  if (rate === undefined) throw new Error(`Unsupported currency: ${currency}`);
  return amount * rate;
}
