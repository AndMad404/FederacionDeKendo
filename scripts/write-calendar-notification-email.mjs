import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function singleLine(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
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
  ].join("\n");
}

export function formatCalendarNotificationEmail(report, from, recipient) {
  const notifications = report?.notifications ?? [];
  if (!notifications.length) return null;
  const sender = singleLine(from);
  const recipientAddress = singleLine(recipient);
  const isEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!isEmailAddress(sender) || !isEmailAddress(recipientAddress)) {
    throw new Error("Calendar notification sender and recipient must be valid email addresses.");
  }
  return [
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
}

async function main() {
  const reportPath = process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH;
  const outputPath = process.env.CALENDAR_NOTIFICATION_EMAIL_PATH;
  if (!reportPath || !outputPath) {
    throw new Error("Calendar notification email paths are required.");
  }
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  if (report.version !== 1 || !Array.isArray(report.notifications)) {
    throw new Error("Calendar notification report has an invalid schema.");
  }
  const email = formatCalendarNotificationEmail(
    report,
    process.env.CALENDAR_ALERT_SMTP_USERNAME,
    process.env.CALENDAR_ALERT_RECIPIENT,
  );
  if (!email) {
    await writeFile(process.env.GITHUB_OUTPUT, "send=false\n", "utf8");
    return;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, email, "utf8");
  await writeFile(process.env.GITHUB_OUTPUT, "send=true\n", "utf8");
}

const isDirectExecution = process.argv[1] && import.meta.url.endsWith(`/${path.basename(process.argv[1])}`);
if (isDirectExecution) main();
