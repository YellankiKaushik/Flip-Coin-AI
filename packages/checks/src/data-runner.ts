import type { CheckRunner } from "./check-runner.ts";
import { executeCheck } from "./adapters.ts";
export const dataRescue: CheckRunner = {
  id: "data",
  run: (context) => executeCheck("data", context),
};
