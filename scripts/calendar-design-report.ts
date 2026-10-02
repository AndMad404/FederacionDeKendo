import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { BlockMeasurements } from "../tests/helpers/calendar-block-measurements.ts";

export interface DesignFinding {
  kind: "diseno_roto" | "revision_diseno_no_completada";
  event: string;
  route: string;
  viewport: { width: number; height: number } | null;
  rule: string;
  component: string;
  measures: Record<string, unknown>;
  state?: string;
  screenshot?: string;
}
interface Attachment {
  name: string;
  path?: string;
  body?: string;
}
interface TestResult {
  status: string;
  attachments: Attachment[];
}
interface ReportSuite {
  suites?: ReportSuite[];
  specs?: { title: string; tests: { results: TestResult[] }[] }[];
}
interface BrowserReport extends ReportSuite {
  errors?: unknown[];
}
export function incomplete(
  rule: string,
  measures: Record<string, unknown>,
  event = "ejecucion",
  route = "",
  viewport: DesignFinding["viewport"] = null,
): DesignFinding {
  return {
    kind: "revision_diseno_no_completada",
    event,
    route,
    viewport,
    rule,
    component: "review",
    measures,
  };
}
export async function browserFindings(
  report: BrowserReport,
): Promise<DesignFinding[]> {
  const findings: DesignFinding[] = [];
  let count = 0;
  async function visit(suite: ReportSuite) {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests) {
        count++;
        const result = test.results.at(-1);
        if (!result) {
          findings.push(incomplete("sin_resultado", { test: spec.title }));
          continue;
        }
        const attachments = result.attachments ?? [];
        const records = attachments.filter(
          (attachment) => attachment.name === "calendar-layout-findings",
        );
        for (const [index, attachment] of records.entries()) {
          const raw = attachment.path
            ? await readFile(attachment.path, "utf8")
            : Buffer.from(attachment.body ?? "", "base64").toString();
          const record = JSON.parse(raw) as {
            event: string;
            route: string;
            viewport: DesignFinding["viewport"];
            state: string;
            findings: {
              event?: string;
              rule: string;
              component: string;
              measures: Record<string, unknown>;
            }[];
          };
          const screenshot = attachments.filter(
            (item) => item.name === "calendar-layout-breakage",
          )[index]?.path;
          findings.push(
            ...record.findings.map((finding) => ({
              ...finding,
              kind: "diseno_roto" as const,
              event: finding.event ?? record.event,
              route: record.route,
              viewport: record.viewport,
              state: record.state,
              screenshot,
            })),
          );
        }
        if (
          ["skipped", "interrupted", "timedOut"].includes(result.status) ||
          (result.status !== "passed" && !records.length)
        )
          findings.push(
            incomplete("prueba_no_completada", {
              test: spec.title,
              status: result.status,
            }),
          );
      }
    for (const child of suite.suites ?? []) await visit(child);
  }
  await visit(report);
  if (!count || report.errors?.length)
    findings.push(
      incomplete("suite_no_completada", {
        count,
        errors: report.errors?.length ?? 0,
      }),
    );
  return findings;
}
export async function browserMeasurements(
  report: BrowserReport,
): Promise<BlockMeasurements[]> {
  const rows: BlockMeasurements[] = [];
  async function visit(suite: ReportSuite) {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests) {
        for (const attachment of test.results.at(-1)?.attachments ?? []) {
          if (attachment.name !== "calendar-layout-measurements") continue;
          const raw = attachment.path
            ? await readFile(attachment.path, "utf8")
            : Buffer.from(attachment.body ?? "", "base64").toString();
          rows.push(JSON.parse(raw) as BlockMeasurements);
        }
      }
    for (const child of suite.suites ?? []) await visit(child);
  }
  await visit(report);
  return rows;
}
export function measurementSummary(rows: BlockMeasurements[]) {
  const groups = new Map<
    string,
    {
      source: string;
      viewport: string;
      count: number;
      descriptionHeight: number;
      articleHeight: number;
    }
  >();
  for (const row of rows) {
    const viewport = row.viewport
      ? `${row.viewport.width}×${row.viewport.height}`
      : "—";
    const key = `${row.source}:${viewport}`;
    const group = groups.get(key) ?? {
      source: row.source,
      viewport,
      count: 0,
      descriptionHeight: 0,
      articleHeight: 0,
    };
    group.count++;
    group.descriptionHeight = Math.max(
      group.descriptionHeight,
      row.blocks.description?.height ?? 0,
    );
    group.articleHeight = Math.max(
      group.articleHeight,
      row.blocks.article?.height ?? 0,
    );
    groups.set(key, group);
  }
  return [...groups.values()];
}
export function designNotifications(
  findings: DesignFinding[],
  executionUrl: string,
  gitSaved: boolean,
) {
  return findings.map((finding) => ({
    id: createHash("sha256").update(JSON.stringify(finding)).digest("hex"),
    kind: finding.kind,
    identity: { slug: finding.event },
    temporality: "ejecucion_actual",
    cause: `${finding.route} ${finding.viewport ? `${finding.viewport.width}x${finding.viewport.height}` : "referencia"}: ${finding.rule} (${finding.component}) ${JSON.stringify(finding.measures)}`,
    actionRequired:
      finding.kind === "diseno_roto"
        ? "Corregir el diseño usando las capturas y medidas del artefacto."
        : "Completar la revisión de diseño; el contenido guardado en Git permanece.",
    before: null,
    after: { ...finding, gitSaved, deployment: "no_verificado", executionUrl },
    execution: {
      origin: "github_actions",
      runId: process.env.GITHUB_RUN_ID ?? null,
      url: executionUrl,
    },
  }));
}
