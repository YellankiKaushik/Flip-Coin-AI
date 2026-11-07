import { z } from "zod";
import { digestSchema, ids } from "./models.ts";

const relativePath = z
  .string()
  .min(1)
  .refine(
    (p) =>
      !/[\\:\x00]/.test(p) &&
      !p.startsWith("/") &&
      p
        .split("/")
        .every((part) => part !== "" && part !== "." && part !== ".."),
    "Expected a normalized relative path",
  );
export const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.literal("checkout-demo"),
    candidateId: z.string().min(1),
    files: z
      .array(
        z
          .object({
            path: relativePath,
            sizeBytes: z.number().int().nonnegative().safe(),
            sha256: digestSchema,
          })
          .strict(),
      )
      .min(1),
    criteriaRevision: z.string().min(1),
    criteriaDigest: digestSchema,
    testDigest: digestSchema,
    policyDigest: digestSchema,
    checksConfigDigest: digestSchema,
    toolchain: z
      .array(
        z
          .object({
            name: z.string().min(1),
            version: z.string().min(1),
            sha256: digestSchema.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((m, ctx) => {
    const paths = m.files.map((f) => f.path);
    if (
      new Set(paths.map((p) => p.toLowerCase())).size !== paths.length ||
      paths.some(
        (p, i) =>
          i > 0 &&
          Buffer.compare(Buffer.from(paths[i - 1]), Buffer.from(p)) >= 0,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Manifest files must be unique and byte sorted",
      });
    if (new Set(m.toolchain.map((t) => t.name)).size !== m.toolchain.length)
      ctx.addIssue({ code: "custom", message: "Duplicate tool identity" });
  });
export const snapshotSchema = z
  .object({
    configOverrides: z.record(z.string(), z.unknown()).optional(),
    snapshotId: z.uuid(),
    candidateId: z.string().min(1),
    candidateDigest: digestSchema,
    root: z.string().min(1),
    manifest: manifestSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();
const optionalDigest = z.union([digestSchema, z.literal("")]);
export const proposalSchema = z
  .object({
    proposalId: z.uuid(),
    actionType: z.enum([
      "CRITERIA_REVIEW",
      "PATCH_REVIEW",
      "RELEASE_READINESS",
    ]),
    candidateDigest: optionalDigest,
    assessmentDigest: optionalDigest,
    policyDigest: optionalDigest,
    resourceDigest: digestSchema,
    requesterRef: z.string().min(1),
    humanActorRef: z.string().min(1).optional(),
    actorVerificationLevel: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    consumedAt: z.iso.datetime().optional(),
    nonceDigest: digestSchema,
    decision: z.enum([
      "REQUESTED",
      "REJECTED",
      "EXPIRED",
      "SUPERSEDED",
      "HUMAN_ATTESTED_FOR_DEMO",
      "APPROVED_FOR_DEMO",
    ]),
    evidenceRefs: z.array(z.string()),
  })
  .strict()
  .superRefine((p, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Date.parse(p.expiresAt) <= Date.parse(p.createdAt))
      fail("Invalid proposal lifetime");
    if (p.consumedAt && Date.parse(p.consumedAt) < Date.parse(p.createdAt))
      fail("Invalid consumption timestamp");
    if (
      ["HUMAN_ATTESTED_FOR_DEMO", "APPROVED_FOR_DEMO"].includes(p.decision) &&
      (!p.humanActorRef || !p.consumedAt || p.actorVerificationLevel === 0)
    )
      fail("Human decision lacks actor binding");
    if (
      p.decision === "REQUESTED" &&
      (p.actorVerificationLevel !== 0 || p.consumedAt || p.humanActorRef)
    )
      fail("Pending proposal cannot claim human authority");
    if (
      p.actionType === "RELEASE_READINESS" &&
      (!p.candidateDigest ||
        !p.assessmentDigest ||
        !p.policyDigest ||
        p.resourceDigest !== p.assessmentDigest)
    )
      fail("Release proposal lacks digest binding");
  });
export const assessmentSchema = z
  .object({
    schemaVersion: z.literal(1),
    assessmentId: z.uuid(),
    runId: z.uuid(),
    candidateDigest: digestSchema,
    requiredChecks: z.tuple([
      z.literal(ids[0]),
      z.literal(ids[1]),
      z.literal(ids[2]),
      z.literal(ids[3]),
    ]),
    policyVersion: z.string().min(1),
    policyDigest: digestSchema,
    readiness: z.enum(["BLOCKED", "READY_FOR_HUMAN_APPROVAL"]),
    blockers: z.array(z.string().min(1)),
    resultDigests: z.array(digestSchema),
    assessmentDigest: digestSchema,
    computedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((a, ctx) => {
    if ((a.readiness === "BLOCKED") !== a.blockers.length > 0)
      ctx.addIssue({
        code: "custom",
        message: "Readiness contradicts blockers",
      });
  });
