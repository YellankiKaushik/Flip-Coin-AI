import type { CheckRunner } from "./check-runner.ts";
import { executeCheck } from "./adapters.ts";
export const acceptanceRelay: CheckRunner = {
  id: "acceptance",
  run: (context) => executeCheck("acceptance", context),
};
