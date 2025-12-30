export function toCents(price: number = 0) {
  return Math.round(price * 100);
}

export function fromCentsToPrice(cents: number = 0) {
  return cents / 100;
}

/**
 * Formats a number of cents into a user-friendly currency string (e.g., "$4.50").
 * This is great for displaying prices in your front-end or logs.
 * @param cents The price as an integer number of cents.
 * @param locale The locale to use for formatting (e.g., 'en-US').
 * @param currency The currency code (e.g., 'USD').
 * @returns A formatted currency string.
 **/
export function format(
  cents: number,
  locale: string = "en-PH",
  currency: string = "PHP",
) {
  const price = fromCentsToPrice(cents);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(price);
}
