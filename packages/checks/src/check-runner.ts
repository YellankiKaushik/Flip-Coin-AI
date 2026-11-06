import type {
  CheckId,
  CheckResult,
  Snapshot,
} from "../../core/src/domain/models.ts";
import type { ArtifactStore } from "../../evidence/src/artifact-store.ts";
export interface CheckContext {
  root: string;
  snapshot: Snapshot;
  runId: string;
  store: ArtifactStore;
  deadlineEpochMs: number;
  criteriaReviewed: boolean;
  abortSignal?: AbortSignal;
}
export interface CheckRunner {
  readonly id: CheckId;
  run(context: CheckContext): Promise<CheckResult>;
}
