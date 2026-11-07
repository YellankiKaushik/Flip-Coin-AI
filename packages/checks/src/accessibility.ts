import type { CheckRunner } from "./check-runner.ts";
import { executeCheck } from "./adapters.ts";
export const a11yRelay: CheckRunner = {
  id: "accessibility",
  run: (context) => executeCheck("accessibility", context),
};
