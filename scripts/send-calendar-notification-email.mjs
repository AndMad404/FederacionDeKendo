import { spawnSync } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function deliverCalendarNotification(env, execute = spawnSync) {
  const username = (env.CALENDAR_ALERT_SMTP_USERNAME ?? "").trim();
  // Gmail displays App Passwords in groups separated by spaces.
  const password = (env.CALENDAR_ALERT_SMTP_APP_PASSWORD ?? "").replace(
    /\s/g,
    "",
  );
  const recipient = (env.CALENDAR_ALERT_RECIPIENT ?? "").trim();
  let status = 1;
  if (
    username &&
    password &&
    recipient &&
    env.CALENDAR_NOTIFICATION_EMAIL_PATH
  ) {
    const result = execute(
      "curl",
      [
        "--fail",
        "--silent",
        "--show-error",
        "--url",
        "smtps://smtp.gmail.com:465",
        "--ssl-reqd",
        "--user",
        `${username}:${password}`,
        "--mail-from",
        username,
        "--mail-rcpt",
        recipient,
        "--upload-file",
        env.CALENDAR_NOTIFICATION_EMAIL_PATH,
      ],
      { encoding: "utf8", stdio: "pipe" },
    );
    status = result.status ?? 1;
  }
  if (status === 0) return { status, message: null };
  const cause =
    !username || !password || !recipient
      ? "Falta configurar el remitente, la contraseña de aplicación o el destinatario en los secretos de Actions."
      : status === 67
        ? "Gmail rechazó la autenticación SMTP. Revisar CALENDAR_ALERT_SMTP_USERNAME y renovar CALENDAR_ALERT_SMTP_APP_PASSWORD con una contraseña de aplicación de esa misma cuenta."
        : `El envío SMTP no se completó (código ${status}). Revisar la conexión y la configuración del correo.`;
  const publication =
    env.CALENDAR_GIT_SAVED === "true"
      ? "El commit y push finalizaron correctamente; el fallo del correo no los revierte."
      : "Esta ejecución no completó el commit y push; consultar el fallo anterior del workflow.";
  return {
    status,
    message: `${cause} ${publication} Consultar calendar-notification-reports para las alertas.`,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = deliverCalendarNotification(process.env);
  if (result.message) {
    console.error(
      `::error title=Calendario: envío de correo::${result.message}`,
    );
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `\n${result.message}\n`,
      );
    }
  }
  process.exitCode = result.status;
}
