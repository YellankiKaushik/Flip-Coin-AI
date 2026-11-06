import type {
  ArtifactRef,
  Assessment,
  CheckId,
  CheckResult,
  Run,
  Snapshot,
} from "../domain/models.ts";

export interface SnapshotRegistry {
  putSnapshot(snapshot: Snapshot): void;
}
export interface CoordinatorLedger {
  getSnapshot(id: string): Snapshot;
  findRun(candidate: string, key: string): Run | undefined;
  listRuns(): Run[];
  getRun(id: string): Run;
  results(id: string): CheckResult[];
  insertRun(run: Run): void;
  updateRun(run: Run): void;
  putResult(result: CheckResult): void;
  transaction<T>(fn: () => T): T;
  audit(type: string, runId: string | null, details?: unknown): unknown;
  auditJsonLines(runId: string): string;
  artifactRows(runId: string): { path: string; data: string }[];
}
export interface ArtifactSink {
  put(
    runId: string,
    relativePath: string,
    bytes: string | Uint8Array,
    mediaType?: string,
  ): ArtifactRef;
}
export interface CheckContext {
  root: string;
  snapshot: Snapshot;
  runId: string;
  store: ArtifactSink;
  deadlineEpochMs: number;
  criteriaReviewed: boolean;
  abortSignal?: AbortSignal;
}
export interface CheckRunner {
  readonly id: CheckId;
  run(context: CheckContext): Promise<CheckResult>;
}
export interface CoordinatorServices {
  checks: Record<CheckId, CheckRunner>;
  assess(runId: string): Promise<Assessment>;
  assessBeforeFinalization(runId: string): Promise<Assessment>;
  currentImplementationMatches(root: string, snapshot: Snapshot): boolean;
  hasCriteriaReview(snapshot: Snapshot): boolean;
}
