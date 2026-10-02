import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

function singleLine(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function formatNotification(notification) {
  return [
    `Tipo: ${singleLine(notification.kind)}`,
    `Identidad: ${singleLine(notification.identity?.slug ?? "no aplica")}`,
    `Temporalidad: ${singleLine(notification.temporality)}`,
    `Causa: ${singleLine(notification.cause)}`,
    `Accion requerida: ${singleLine(notification.actionRequired)}`,
    `Ejecucion: ${singleLine(notification.execution?.origin ?? "desconocida")} / ${singleLine(notification.execution?.runId ?? "sin identificador")}`,
    `Antes (redactado): ${JSON.stringify(notification.before ?? null)}`,
    `Despues (redactado): ${JSON.stringify(notification.after ?? null)}`,
    `Huella de alerta: ${singleLine(notification.id)}`,
    ...(notification.after?.executionUrl
      ? [
          `Evidencia y capturas: ${singleLine(notification.after.executionUrl)} (artefacto calendar-design-review)`,
          notification.after.gitSaved
            ? "Cambios guardados en Git mediante commit y push."
            : "No se confirmó el commit y push.",
          "Despliegue de Cloudflare: no verificado.",
        ]
      : []),
  ].join("\n");
}

export function formatCalendarNotificationEmail(
  report,
  from,
  recipient,
  attachments = [],
) {
  const notifications = report?.notifications ?? [];
  if (!notifications.length) return null;
  const sender = singleLine(from);
  const recipientAddress = singleLine(recipient);
  const isEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!isEmailAddress(sender) || !isEmailAddress(recipientAddress)) {
    throw new Error(
      "Calendar notification sender and recipient must be valid email addresses.",
    );
  }
  const plain = [
    `From: ${sender}`,
    `To: ${recipientAddress}`,
    `Subject: [Federacion de Kendo] ${notifications.length} alerta(s) operativa(s) del calendario`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Alertas operativas del calendario. El contenido sensible fue redactado antes de generar este mensaje.",
    "",
    ...notifications.flatMap((notification, index) => [
      `--- Alerta ${index + 1} ---`,
      formatNotification(notification),
      "",
    ]),
  ].join("\n");
  if (!attachments.length) return plain;
  const boundary = `calendar-${createHash("sha256").update(plain).digest("hex").slice(0, 24)}`;
  const [headers, ...body] = plain.split("\n\n");
  return [
    headers.replace(
      "Content-Type: text/plain; charset=UTF-8",
      `MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="${boundary}"`,
    ),
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body.join("\n\n"),
    ...attachments.flatMap((attachment) => [
      `--${boundary}`,
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${singleLine(attachment.filename).replace(/[^A-Za-z0-9_.-]/g, "_")}"`,
      "",
      attachment.contentBase64.match(/.{1,76}/g).join("\n"),
      "",
    ]),
    `--${boundary}--`,
    "",
  ].join("\n");
}

export async function calendarScreenshotAttachments(report, directory) {
  const screenshots = [
    ...new Set(
      report.notifications
        .filter((notification) => notification.kind === "diseno_roto")
        .map((notification) => notification.after?.screenshot)
        .filter(Boolean),
    ),
  ];
  if (!screenshots.length) return [];
  if (!directory)
    throw new Error("Calendar screenshot artifact directory is required.");
  return Promise.all(
    screenshots.map(async (screenshot, index) => {
      const absolute = path.resolve(screenshot);
      const relative = path.relative(path.resolve(directory), absolute);
      if (
        !relative ||
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        path.extname(absolute) !== ".png"
      )
        throw new Error(
          "Calendar screenshot must belong to the review artifact directory.",
        );
      return {
        filename: `calendar-layout-${index + 1}.png`,
        contentBase64: (await readFile(absolute)).toString("base64"),
      };
    }),
  );
}

async function main() {
  const reportPath = process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH;
  const outputPath = process.env.CALENDAR_NOTIFICATION_EMAIL_PATH;
  if (!reportPath || !outputPath) {
    throw new Error("Calendar notification email paths are required.");
  }
  let report;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    report = { version: 1, notifications: [] };
  }
  if (report.version !== 1 || !Array.isArray(report.notifications)) {
    throw new Error("Calendar notification report has an invalid schema.");
  }
  const email = formatCalendarNotificationEmail(
    report,
    process.env.CALENDAR_ALERT_SMTP_USERNAME,
    process.env.CALENDAR_ALERT_RECIPIENT,
    await calendarScreenshotAttachments(
      report,
      process.env.CALENDAR_LAYOUT_REPORT_DIR,
    ),
  );
  if (!email) {
    await writeFile(process.env.GITHUB_OUTPUT, "send=false\n", "utf8");
    return;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, email, "utf8");
  await writeFile(process.env.GITHUB_OUTPUT, "send=true\n", "utf8");
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url.endsWith(`/${path.basename(process.argv[1])}`);
if (isDirectExecution) main();
