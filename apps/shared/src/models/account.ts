export const accountTypes = {
  asset: "asset",
  liability: "liability",
  equity: "equity",
  revenue: "revenue",
  expense: "expense",
} as const;

export type AccountType = (typeof accountTypes)[keyof typeof accountTypes];
