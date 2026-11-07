import type { CheckRunner } from "./check-runner.ts";
import { executeCheck } from "./adapters.ts";
export const contractGuardian: CheckRunner = {
  id: "contract",
  run: (context) => executeCheck("contract", context),
};
