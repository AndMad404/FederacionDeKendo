import {
  createCalendarFailureNotification,
  writeCalendarNotificationsReport,
  writeCalendarNotificationsSummary,
} from "./sync-calendar-events.mjs";
import { readFile } from "node:fs/promises";

const reportPath = process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH;
const failedStep = process.env.CALENDAR_FAILED_STEP ?? "unknown verification";
const failureReport = createCalendarFailureNotification(
  new Error(`Verification failed: ${failedStep}.`),
);
let report = failureReport;
if (reportPath) {
  try {
    const existing = JSON.parse(await readFile(reportPath, "utf8"));
    if (existing.version === 1 && Array.isArray(existing.notifications)) {
      const notifications = [
        ...existing.notifications,
        ...failureReport.notifications,
      ];
      report = {
        version: 1,
        notifications: [
          ...new Map(
            notifications.map((notification) => [
              notification.id,
              notification,
            ]),
          ).values(),
        ],
      };
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await writeCalendarNotificationsReport(report, reportPath);
await writeCalendarNotificationsSummary(failureReport);
