import { parseDocument } from "yaml";
import { invariant } from "../../core/src/public/domain.ts";
import { utf8 } from "../../core/src/public/infrastructure.ts";
export function validateLocalSpec(bytes: Uint8Array): unknown {
  const doc = parseDocument(utf8(bytes), {
    uniqueKeys: true,
    maxAliasCount: 0,
  } as any);
  invariant(
    doc.errors.length === 0,
    "INVALID_INPUT",
    "Malformed OpenAPI YAML/JSON",
  );
  const spec = doc.toJS({ maxAliasCount: 0 });
  function visit(value: unknown) {
    if (!value || typeof value !== "object") return;
    for (const [key, v] of Object.entries(value)) {
      if (key === "$ref")
        invariant(
          typeof v === "string" && v.startsWith("#/"),
          "INVALID_INPUT",
          "External references denied",
        );
      visit(v);
    }
  }
  visit(spec);
  invariant(
    spec &&
      typeof spec === "object" &&
      typeof spec.openapi === "string" &&
      spec.openapi.startsWith("3."),
    "INVALID_INPUT",
    "OpenAPI 3.x required",
  );
  return spec;
}
