import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["apps/checkout-demo/tests/checkout.spec.ts"],
    fileParallelism: false,
    maxWorkers: 1,
  },
});
