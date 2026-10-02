import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  appendFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  browserFindings,
  browserMeasurements,
  measurementSummary,
  designNotifications,
  incomplete,
  type DesignFinding,
} from "./calendar-design-report.ts";
export {
  browserFindings,
  browserMeasurements,
  measurementSummary,
  designNotifications,
} from "./calendar-design-report.ts";
import type { BlockMeasurements } from "../tests/helpers/calendar-block-measurements.ts";

async function generatedFingerprint() {
  const hash = createHash("sha256");
  for (const file of (await readdir("dist", { recursive: true })).sort()) {
    if (!/\.(html|js|css|json)$/.test(file)) continue;
    hash.update(file).update(await readFile(path.join("dist", file)));
  }
  return hash.digest("hex");
}
export async function runDesignReview({
  directory,
  gitSaved,
  summaryPath,
  notificationsPath = path.join(directory, "calendar-notifications.json"),
  emitWorkflowWarnings = false,
  captureFingerprint = generatedFingerprint,
  execute = (output: string) =>
    spawnSync(
      process.execPath,
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config=playwright.calendar-layout.config.ts",
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          CALENDAR_LAYOUT_REPORT_DIR: output,
          PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(output, "playwright.json"),
        },
      },
    ).status,
}: {
  directory: string;
  gitSaved: boolean;
  summaryPath?: string;
  notificationsPath?: string;
  emitWorkflowWarnings?: boolean;
  execute?: (directory: string) => number | null;
  captureFingerprint?: () => Promise<string>;
}) {
  await mkdir(directory, { recursive: true });
  const warnings: DesignFinding[] = [];
  const measurements: BlockMeasurements[] = [];
  let fingerprint: string | undefined;
  let exitCode: number | null = null;
  try {
    fingerprint = await captureFingerprint();
    if (process.env.CALENDAR_LAYOUT_FORCE_INCOMPLETE)
      throw new Error(
        "La revisión de diseño no pudo ejecutarse; consultar el paso anterior.",
      );
    // Discard a previous report so a browser startup failure cannot reuse it.
    await writeFile(path.join(directory, "playwright.json"), "");
    exitCode = execute(directory);
    const browserReport = JSON.parse(
      await readFile(path.join(directory, "playwright.json"), "utf8"),
    );
    warnings.push(...(await browserFindings(browserReport)));
    measurements.push(...(await browserMeasurements(browserReport)));
    if (fingerprint !== (await captureFingerprint()))
      warnings.push(incomplete("contenido_generado_modificado", {}));
    if (exitCode !== 0 && !warnings.length)
      warnings.push(incomplete("runner_fallido", { exitCode }));
  } catch (error) {
    warnings.push(
      incomplete("runner_no_completado", {
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
  const executionUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "local";
  // Group by event, route, viewport and rule while retaining component measures.
  const findings = [
    ...new Map(
      warnings.map((finding) => [
        JSON.stringify([
          finding.event,
          finding.route,
          finding.viewport,
          finding.rule,
          finding.component,
          finding.state,
        ]),
        finding,
      ]),
    ).values(),
  ];
  const report = {
    version: 1,
    gitSaved,
    deployment: "no_verificado",
    executionUrl,
    generatedFingerprint: fingerprint,
    exitCode,
    findings,
    measurements,
  };
  await writeFile(
    path.join(directory, "calendar-design.json"),
    JSON.stringify(report, null, 2),
  );
  let notifications: { version: number; notifications: unknown[] } = {
    version: 1,
    notifications: [],
  };
  try {
    notifications = JSON.parse(await readFile(notificationsPath, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  notifications.notifications.push(
    ...designNotifications(findings, executionUrl, gitSaved),
  );
  await writeFile(notificationsPath, JSON.stringify(notifications, null, 2));
  const escape = (value: unknown) => String(value).replace(/[<>&|`\r\n]/g, " ");
  const summary = [
    `## Revisión de diseño del calendario`,
    "",
    gitSaved
      ? "Cambios guardados en Git mediante commit y push."
      : "No se confirmó el commit y push de los cambios.",
    "Despliegue de Cloudflare: no verificado.",
    `Ejecución: ${executionUrl}`,
    "",
    "| Resultado | Evento / ruta | Viewport | Regla / componente | Medidas |",
    "| --- | --- | --- | --- | --- |",
    ...findings.map(
      (item) =>
        `| ${item.kind} | ${escape(item.event)} / ${escape(item.route)} | ${item.viewport ? `${item.viewport.width}×${item.viewport.height}` : "—"} | ${escape(item.rule)} / ${escape(item.component)} | ${escape(JSON.stringify(item.measures))} |`,
    ),
    ...(findings.length ? [] : ["Revisión completada sin hallazgos."]),
    "",
    "### Alturas observadas por presentación",
    "Máximos medidos, no límites de contenido. Los detalles incluyen carga, bloques y márgenes.",
    "| Origen | Viewport | Observaciones | Descripción máxima | Artículo máximo |",
    "| --- | --- | --- | --- | --- |",
    ...measurementSummary(measurements).map(
      (row) =>
        `| ${row.source} | ${row.viewport} | ${row.count} | ${row.descriptionHeight.toFixed(1)} px | ${row.articleHeight.toFixed(1)} px |`,
    ),
    "",
    "Capturas y detalles: artefacto calendar-design-review.",
    "",
  ].join("\n");
  await writeFile(path.join(directory, "summary.md"), summary);
  if (summaryPath) await appendFile(summaryPath, summary);
  if (emitWorkflowWarnings)
    for (const kind of new Set(findings.map((item) => item.kind)))
      console.log(
        `::warning title=Calendario::${kind}: consultar el informe y las capturas de calendar-design-review.`,
      );
  return report;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runDesignReview({
    directory: path.resolve(
      process.env.CALENDAR_LAYOUT_REPORT_DIR ?? "test-results/calendar-design",
    ),
    gitSaved: process.env.CALENDAR_GIT_SAVED === "true",
    summaryPath: process.env.GITHUB_STEP_SUMMARY,
    notificationsPath: process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH,
    emitWorkflowWarnings: true,
  });
}
