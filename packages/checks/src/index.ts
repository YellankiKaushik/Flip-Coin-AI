import { acceptanceRelay } from "./acceptance.ts";
import { a11yRelay } from "./accessibility.ts";
import { contractGuardian } from "./contract.ts";
import { dataRescue } from "./data-runner.ts";
import type { CheckRunner } from "./check-runner.ts";
import type { CheckId } from "../../core/src/public/domain.ts";
export const registeredChecks: Record<CheckId, CheckRunner> = {
  acceptance: acceptanceRelay,
  accessibility: a11yRelay,
  contract: contractGuardian,
  data: dataRescue,
};
