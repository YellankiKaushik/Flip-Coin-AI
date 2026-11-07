import { z } from "zod";
export const ids = ["acceptance", "accessibility", "contract", "data"] as const;
export type CheckId = (typeof ids)[number];
export const engineTools: Record<CheckId, string> = {
  acceptance: "vitest",
  accessibility: "axe-core",
  contract: "oasdiff",
  data: "csv-parse",
};
export const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const artifactSchema = z
  .object({
    relativePath: z.string().min(1),
    sha256: digestSchema,
    sizeBytes: z.number().int().nonnegative().safe(),
    mediaType: z.string(),
  })
  .strict();
export const resultSchema = z
  .object({
    schemaVersion: z.literal(1),
    runId: z.uuid(),
    checkId: z.enum(ids),
    attempt: z.number().int().positive(),
    candidateDigest: digestSchema,
    tool: z
      .object({ name: z.string().min(1), version: z.string().min(1) })
      .strict(),
    status: z.enum(["PASS", "FAIL", "ERROR", "SKIPPED"]),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
    durationMs: z.number().nonnegative(),
    summary: z.string(),
    findings: z.array(
      z
        .object({
          code: z.string(),
          severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]),
          location: z.string().optional(),
          message: z.string(),
        })
        .strict(),
    ),
    evidence: z.array(artifactSchema),
    errors: z.array(
      z.object({ code: z.string(), message: z.string() }).strict(),
    ),
    coverage: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const invalid = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (r.tool.name !== engineTools[r.checkId])
      invalid("Tool identity does not match check");
    if (Date.parse(r.finishedAt) < Date.parse(r.startedAt))
      invalid("Check timestamps are reversed");
    if (
      r.status === "PASS" &&
      (r.errors.length > 0 ||
        r.findings.some((f) => ["ERROR", "CRITICAL"].includes(f.severity)) ||
        r.coverage <= 0 ||
        r.evidence.length === 0 ||
        r.tool.version === "UNKNOWN")
    )
      invalid("PASS contradicts errors, findings, coverage or tool identity");
    if (
      r.status === "FAIL" &&
      (r.findings.length === 0 || r.coverage <= 0 || r.errors.length > 0)
    )
      invalid("FAIL requires completed evidence of a finding");
    if (r.status === "ERROR" && r.errors.length === 0)
      invalid("ERROR requires an explicit execution error");
  });
export type CheckResult = z.infer<typeof resultSchema>;
export type ArtifactRef = z.infer<typeof artifactSchema>;
export const criteriaSchema = z
  .object({
    schemaVersion: z.literal(1),
    criteriaId: z.string(),
    revision: z.number().int().positive(),
    status: z.enum(["DRAFT", "PENDING", "APPROVED"]),
    cases: z
      .array(z.object({ id: z.string(), description: z.string() }).strict())
      .min(1),
  })
  .strict();
export type Criteria = z.infer<typeof criteriaSchema>;
export const checksSchema = z
  .object({
    schemaVersion: z.literal(1),
    requiredChecks: z.tuple([
      z.literal("acceptance"),
      z.literal("accessibility"),
      z.literal("contract"),
      z.literal("data"),
    ]),
    timeoutMs: z.number().int().min(1000).max(120000),
    browserTimeoutMs: z.number().int().min(1000).max(120000),
    overallTimeoutMs: z.number().int().positive(),
    maxOutputBytes: z.number().int().positive().max(1048576),
    maxCsvBytes: z.number().int().positive().max(2097152),
    maxCsvRows: z.number().int().positive().max(5000),
    axeRules: z.array(z.string()).min(1),
    sampleUrl: z.string().refine((value) => {
      try {
        const u = new URL(value);
        return (
          u.protocol === "http:" &&
          u.hostname === "127.0.0.1" &&
          /^\d+$/.test(u.port) &&
          u.pathname === "/" &&
          !u.search &&
          !u.hash &&
          !u.username &&
          !u.password
        );
      } catch {
        return false;
      }
    }, "Only an exact loopback HTTP URL with a port is allowed"),
  })
  .strict();
export const policySchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.string(),
    requiredChecks: z.tuple([
      z.literal("acceptance"),
      z.literal("accessibility"),
      z.literal("contract"),
      z.literal("data"),
    ]),
    allowWaivers: z.literal(false),
    requireVerifiedArtifacts: z.literal(true),
  })
  .strict();
export type FileEntry = { path: string; sizeBytes: number; sha256: string };
export type ToolchainEntry = { name: string; version: string; sha256?: string };
export interface CandidateManifest {
  schemaVersion: 1;
  projectId: "checkout-demo";
  candidateId: string;
  files: FileEntry[];
  criteriaRevision: string;
  criteriaDigest: string;
  testDigest: string;
  policyDigest: string;
  checksConfigDigest: string;
  toolchain: ToolchainEntry[];
}
export interface Snapshot {
  configOverrides?: Record<string, unknown>;
  snapshotId: string;
  candidateId: string;
  candidateDigest: string;
  root: string;
  manifest: CandidateManifest;
  createdAt: string;
}
export type RunState =
  "CREATED" | "VALIDATING" | "RUNNING" | "COMPLETED" | "INTERRUPTED";
export interface Run {
  runId: string;
  snapshotId: string;
  candidateId: string;
  candidateDigest: string;
  key: string;
  requestDigest: string;
  status: RunState;
  createdAt: string;
  finishedAt?: string;
  supersedesRunId?: string;
  gitSha: string | null;
  criteriaRevision?: string;
  policyDigest?: string;
  toolchainDigest?: string;
}
export const runSchema = z
  .object({
    runId: z.uuid(),
    snapshotId: z.uuid(),
    candidateId: z.string().min(1),
    candidateDigest: digestSchema,
    key: z.string().min(1),
    requestDigest: digestSchema,
    status: z.enum([
      "CREATED",
      "VALIDATING",
      "RUNNING",
      "COMPLETED",
      "INTERRUPTED",
    ]),
    createdAt: z.iso.datetime(),
    finishedAt: z.iso.datetime().optional(),
    supersedesRunId: z.uuid().optional(),
    gitSha: z
      .string()
      .regex(/^[a-f0-9]{40}$/)
      .nullable(),
    criteriaRevision: z.string().min(1).optional(),
    policyDigest: digestSchema.optional(),
    toolchainDigest: digestSchema.optional(),
  })
  .strict();
export interface Assessment {
  schemaVersion: 1;
  assessmentId: string;
  runId: string;
  candidateDigest: string;
  requiredChecks: CheckId[];
  policyVersion: string;
  policyDigest: string;
  readiness: "BLOCKED" | "READY_FOR_HUMAN_APPROVAL";
  blockers: string[];
  resultDigests: string[];
  assessmentDigest: string;
  computedAt: string;
}
export type Action = "CRITERIA_REVIEW" | "PATCH_REVIEW" | "RELEASE_READINESS";
export interface Proposal {
  proposalId: string;
  actionType: Action;
  candidateDigest: string;
  assessmentDigest: string;
  policyDigest: string;
  resourceDigest: string;
  requesterRef: string;
  humanActorRef?: string;
  actorVerificationLevel: 0 | 1 | 2;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
  nonceDigest: string;
  decision:
    | "REQUESTED"
    | "REJECTED"
    | "EXPIRED"
    | "SUPERSEDED"
    | "HUMAN_ATTESTED_FOR_DEMO"
    | "APPROVED_FOR_DEMO";
  evidenceRefs: string[];
}
export class SfError extends Error {
  constructor(
    public code: string,
    message: string,
    public exitCode = 2,
    public details: unknown[] = [],
  ) {
    super(message);
  }
}
export function invariant(
  condition: unknown,
  code: string,
  message: string,
  exit = 2,
): asserts condition {
  if (!condition) throw new SfError(code, message, exit);
}
export const now = () => new Date().toISOString();
