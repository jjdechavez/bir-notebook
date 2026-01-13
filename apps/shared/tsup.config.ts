import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/models/account.ts",
    "src/models/common.ts",
    "src/models/invite.ts",
    "src/models/transaction.ts",
    "src/helpers/currency.ts",
  ],
  format: ["esm", "cjs"],
  outDir: "dist",
  dts: true,
  clean: true,
});
