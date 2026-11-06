import { parse } from "csv-parse/sync";
import { sha256 } from "../../evidence/src/index.ts";
import { utf8 } from "../../core/src/public/infrastructure.ts";
import { invariant } from "../../core/src/public/domain.ts";
export interface DataFinding {
  code: string;
  severity: "ERROR";
  location: string;
  message: string;
  issueId: string;
}
export function reconcile(
  orderBytes: Uint8Array,
  ledgerBytes: Uint8Array,
  maxBytes = 2097152,
  maxRows = 5000,
) {
  const findings: DataFinding[] = [];
  const add = (code: string, id: string, message: string) =>
    findings.push({
      code,
      severity: "ERROR",
      location: id,
      message,
      issueId: sha256(
        code +
          "|" +
          id +
          "|" +
          message +
          "|" +
          sha256(orderBytes) +
          "|" +
          sha256(ledgerBytes),
      ),
    });
  const counts: Record<string, number> = {};
  function rows(bytes: Uint8Array, headers: string[], kind: string) {
    invariant(
      bytes.byteLength <= maxBytes,
      "INVALID_INPUT",
      "CSV byte cap exceeded",
    );
    const data = parse(utf8(bytes), {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }) as string[][];
    invariant(
      data.length > 1 && data.length - 1 <= maxRows,
      "INVALID_INPUT",
      "CSV must have nonempty bounded coverage",
    );
    invariant(
      JSON.stringify(data[0]) === JSON.stringify(headers),
      "INVALID_INPUT",
      "CSV headers must match exact declared order",
    );
    const result = new Map<string, { amount: number; state: string }>();
    counts[kind] = data.length - 1;
    for (const [i, row] of data.slice(1).entries()) {
      invariant(row.length === 3, "INVALID_INPUT", "Invalid field count");
      const id = row[0].trim();
      invariant(id.length > 0, "INVALID_INPUT", "Empty order ID");
      invariant(
        /^\d+$/.test(row[1]),
        "INVALID_INPUT",
        "Cents must be decimal ASCII integer",
      );
      const amount = Number(row[1]);
      invariant(
        Number.isSafeInteger(amount) && amount >= 0,
        "INVALID_INPUT",
        "Unsafe cents",
      );
      invariant(
        (kind === "orders" ? ["PAID", "UNPAID"] : ["true", "false"]).includes(
          row[2],
        ),
        "INVALID_INPUT",
        "Invalid settlement/status value",
      );
      if (result.has(id))
        add("DUPLICATE_ID", id, kind + " duplicate at row " + (i + 2));
      else result.set(id, { amount, state: row[2] });
    }
    return result;
  }
  const orders = rows(
    orderBytes,
    ["order_id", "total_cents", "status"],
    "orders",
  );
  const ledger = rows(
    ledgerBytes,
    ["order_id", "charged_cents", "settled"],
    "ledger",
  );
  for (const id of new Set([...orders.keys(), ...ledger.keys()])) {
    const o = orders.get(id),
      l = ledger.get(id);
    if (!o || !l) {
      add("MISSING_COUNTERPART", id, "ID must exist in both files");
      continue;
    }
    if (o.state === "PAID") {
      if (l.state !== "true")
        add("SETTLEMENT_MISMATCH", id, "Paid order must be settled");
      if (o.amount !== l.amount)
        add(
          "AMOUNT_MISMATCH",
          id,
          "Expected " +
            o.amount +
            " cents; observed " +
            l.amount +
            "; difference " +
            (o.amount - l.amount),
        );
    } else if (l.state !== "false" || l.amount !== 0)
      add("UNPAID_CHARGE", id, "Unpaid order requires unsettled zero charge");
  }
  findings.sort((a, b) =>
    Buffer.compare(
      Buffer.from(a.severity + "|" + a.code + "|" + a.location),
      Buffer.from(b.severity + "|" + b.code + "|" + b.location),
    ),
  );
  const corrections = [
    ["order_id", "charged_cents", "settled"],
    ...[...orders]
      .sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
      .map(([id, o]) => [
        id,
        String(o.state === "PAID" ? o.amount : 0),
        String(o.state === "PAID"),
      ]),
  ]
    .map((row) =>
      row
        .map(
          (cell) =>
            '"' +
            (/^[=+@\-\t\r]/.test(cell) ? "'" : "") +
            cell.replaceAll('"', '""') +
            '"',
        )
        .join(","),
    )
    .join("\r\n");
  return {
    schemaVersion: 1,
    status: findings.length ? "FAIL" : "PASS",
    coverage: counts.orders + counts.ledger,
    findings,
    counts: {
      orders: counts.orders,
      ledger: counts.ledger,
      issues: findings.length,
    },
    proposedCorrections: corrections,
    warning:
      "Proposed corrections assume orders are authoritative for this synthetic fixture; human review required.",
  };
}
