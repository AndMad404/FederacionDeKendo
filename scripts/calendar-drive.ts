import type {
  CalendarError,
  DriveFile,
  RegistryEvent,
} from "./calendar-sync-types.ts";

const filesUrl = "https://www.googleapis.com/drive/v3/files";
const activityUrl = "https://driveactivity.googleapis.com/v2/activity:query";
const folderMime = "application/vnd.google-apps.folder";
const budgetKey = "calendarDownloadBudget";
export const MAX_DRIVE_IMAGE_BYTES = 20 * 1024 * 1024;

// OAuth error codes from RFC 6749 section 5.2 plus Google-specific ones. Only
// these values may reach logs and notifications; error_description never does.
const oauthErrorCodes = new Set([
  "invalid_request",
  "invalid_client",
  "invalid_grant",
  "unauthorized_client",
  "unsupported_grant_type",
  "invalid_scope",
  "access_denied",
  "disabled_client",
  "admin_policy_enforced",
]);

class DriveAuthorizationError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super("No se pudo autorizar Drive: " + reason + ".");
    this.name = "DriveAuthorizationError";
    this.reason = reason;
  }
}

export class DriveQuotaError extends Error implements CalendarError {
  readonly calendarNotification: NonNullable<
    CalendarError["calendarNotification"]
  >;

  constructor(message: string, after: Record<string, unknown>) {
    super(message);
    this.name = "DriveQuotaError";
    this.calendarNotification = {
      kind: "cuota_drive_bloqueada",
      identity: { service: "Drive" },
      before: null,
      after,
    };
  }
}

interface DriveItem extends DriveFile {
  mimeType: string;
  trashed?: boolean;
  driveId?: string;
  appProperties?: { calendarEvent?: string; calendarDownloadBudget?: string };
}
interface Target {
  driveItem?: { name: string };
}
interface Activity {
  targets?: Target[];
  timestamp?: string;
  actions?: {
    target?: Target;
    timestamp?: string;
    detail?: {
      create?: { upload?: object };
      move?: { addedParents?: Target[]; removedParents?: Target[] };
    };
  }[];
}
interface QuotaConfiguration {
  userUnitsPerMinute: number;
  projectUnitsPerMinute: number;
  projectBytesPerDay: number;
  timeZone: string;
  units: { metadata: number; list: number; write: number; download: number };
}

interface Configuration {
  rootId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  quota: QuotaConfiguration;
  existingFolders?: Record<string, string>;
}

export interface CalendarDrive {
  existingFolders?: Record<string, string>;
  prepareFolder(
    sourceId: string,
    category: string,
    name: string,
    existingId?: string,
  ): Promise<{ folder: DriveFile; linked: boolean }>;
  findFolder(sourceId: string): Promise<DriveFile | undefined>;
  listImages(folderId: string): Promise<DriveFile[]>;
  fetchMedia: typeof fetch;
}

export function getEventFolderDetails(event: RegistryEvent) {
  const category = {
    examen: "Examenes",
    torneo: "Torneos",
    seminario: "Seminarios",
    evento: "Seminarios",
  }[event.eventType ?? "evento"];
  return { category, name: event.date + " - " + event.title };
}

function quoted(value: string) {
  return "'" + value.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'";
}

export function createCalendarDrive(
  config: Configuration,
  fetchImpl = fetch,
): CalendarDrive {
  const limits = config?.quota;
  const units = limits?.units;
  const validNumber = (value: unknown) =>
    typeof value === "number" && Number.isSafeInteger(value) && value > 0;
  if (
    !limits ||
    !units ||
    ![
      limits.userUnitsPerMinute,
      limits.projectUnitsPerMinute,
      limits.projectBytesPerDay,
      units.metadata,
      units.list,
      units.write,
      units.download,
    ].every(validNumber) ||
    typeof limits.timeZone !== "string" ||
    !limits.timeZone.trim()
  ) {
    throw new DriveQuotaError(
      "Falta la configuración de cuotas de Drive o contiene valores inválidos.",
      { configuracion: "CALENDAR_DRIVE_CONFIG.quota" },
    );
  }
  let quotaDate: Intl.DateTimeFormat;
  try {
    quotaDate = new Intl.DateTimeFormat("en-CA", { timeZone: limits.timeZone });
  } catch {
    throw new DriveQuotaError(
      "La zona horaria de la cuota diaria de Drive es inválida.",
      {
        configuracion: "CALENDAR_DRIVE_CONFIG.quota.timeZone",
      },
    );
  }
  const recent: { at: number; units: number }[] = [];
  let recentUnits = 0;
  function charge(cost: number) {
    const at = performance.now();
    let expired = 0;
    while (expired < recent.length && recent[expired].at <= at - 60_000) {
      recentUnits -= recent[expired++].units;
    }
    if (expired) recent.splice(0, expired);
    const projected = recentUnits + cost;
    if (
      projected > limits.userUnitsPerMinute ||
      projected > limits.projectUnitsPerMinute
    ) {
      const user = projected > limits.userUnitsPerMinute;
      const limit = user
        ? limits.userUnitsPerMinute
        : limits.projectUnitsPerMinute;
      throw new DriveQuotaError(
        `La siguiente solicitud de Drive superaría la cuota por minuto ${user ? "del usuario" : "del proyecto"} (${projected} de ${limit} unidades).`,
        { numeroUnidades: projected, limite: limit, ventana: "60 segundos" },
      );
    }
    recent.push({ at, units: cost });
    recentUnits = projected;
  }
  let authorization: Promise<string> | undefined;
  async function authorize() {
    const missing = (
      ["rootId", "clientId", "clientSecret", "refreshToken"] as const
    ).filter((field) => !config[field]);
    if (missing.length)
      throw new DriveAuthorizationError(
        "falta " + missing.join(", ") + " en CALENDAR_DRIVE_CONFIG",
      );
    let response: Response;
    try {
      response = await fetchImpl("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: config.refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new DriveAuthorizationError("el servicio OAuth no respondió");
    }
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      const code =
        typeof payload?.error === "string" && oauthErrorCodes.has(payload.error)
          ? payload.error
          : "error_desconocido";
      throw new DriveAuthorizationError("HTTP " + response.status + " " + code);
    }
    const token = payload?.access_token;
    if (typeof token !== "string" || !token)
      throw new DriveAuthorizationError("respuesta OAuth inválida");
    return token;
  }

  async function request(url: string, units: number, init?: RequestInit) {
    let token: string;
    try {
      token = await (authorization ??= authorize());
    } catch (error) {
      throw new Error(
        "No se pudo autorizar el acceso a Drive" +
          (error instanceof DriveAuthorizationError
            ? " (" + error.reason + ")"
            : "") +
          ".",
      );
    }
    if (units) charge(units);
    const headers = new Headers(init?.headers);
    headers.set("Authorization", "Bearer " + token);
    headers.set("Content-Type", "application/json");
    let response: Response;
    try {
      response = await fetchImpl(url, {
        ...init,
        headers,
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error("Drive no respondió o no se pudo autorizar el acceso.");
    }
    if (response.status === 429 || response.status === 403) {
      const payload = await response.json().catch(() => undefined);
      const reasons: string[] = Array.isArray(payload?.error?.errors)
        ? payload.error.errors.map((entry: { reason: string }) => entry.reason)
        : [];
      const quotaReasons = new Set([
        "dailyLimitExceeded",
        "downloadQuotaExceeded",
        "quotaExceeded",
        "rateLimitExceeded",
        "sharingRateLimitExceeded",
        "userRateLimitExceeded",
      ]);
      if (
        response.status === 429 ||
        payload?.error?.status === "RESOURCE_EXHAUSTED" ||
        reasons.some((reason) => quotaReasons.has(reason))
      ) {
        const service = url === activityUrl ? "Drive Activity" : "Drive";
        throw new DriveQuotaError(
          `${service} rechazó una solicitud por cuota (HTTP ${response.status}).`,
          { servicio: service, codigoHttp: response.status },
        );
      }
    }
    if (!response.ok)
      throw new Error("Solicitud a Drive rechazada (" + response.status + ").");
    return response;
  }

  const fields = "id,name,mimeType,trashed,driveId,appProperties";
  const fileUrl = (id: string) =>
    filesUrl +
    "/" +
    encodeURIComponent(id) +
    "?supportsAllDrives=true&fields=" +
    fields;
  const getItem = async (id: string): Promise<DriveItem> =>
    (await request(fileUrl(id), units.metadata)).json();
  const folderQuery = "mimeType = " + quoted(folderMime);
  let root: Promise<DriveItem> | undefined;

  async function reserveDownload(bytes: number) {
    let day = quotaDate.format(Date.now());
    try {
      const folder = await getItem(config.rootId);
      const now = Date.now();
      day = quotaDate.format(now);
      // The metadata update and media request each have a 30-second timeout.
      const days = new Set([day, quotaDate.format(now + 60_000)]);
      const previous: Record<string, number> = JSON.parse(
        folder.appProperties?.[budgetKey] ?? "{}",
      );
      if (
        !previous ||
        typeof previous !== "object" ||
        Array.isArray(previous) ||
        Object.entries(previous).some(
          ([date, used]) =>
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isSafeInteger(used) ||
            used < 0,
        )
      )
        throw new Error("Registro de descargas inválido.");
      const reserved: Record<string, number> = {};
      for (const date of days) {
        const projected = (previous[date] ?? 0) + bytes;
        if (projected > limits.projectBytesPerDay) {
          throw new DriveQuotaError(
            `La siguiente descarga superaría el límite diario de Drive (${projected} de ${limits.projectBytesPerDay} bytes reservados).`,
            {
              bytesProyectados: projected,
              limiteBytes: limits.projectBytesPerDay,
              fechaCuota: date,
            },
          );
        }
        reserved[date] = projected;
      }
      const budget = JSON.stringify(reserved);
      const updated: DriveItem = await (
        await request(fileUrl(config.rootId), units.write, {
          method: "PATCH",
          body: JSON.stringify({ appProperties: { [budgetKey]: budget } }),
        })
      ).json();
      if (updated.appProperties?.[budgetKey] !== budget)
        throw new Error("Drive no confirmó la reserva de descarga.");
    } catch (error) {
      if (error instanceof DriveQuotaError) throw error;
      throw new DriveQuotaError(
        "No se pudo comprobar o guardar el presupuesto diario de descargas. Se detuvo la sincronización.",
        { fechaCuota: day },
      );
    }
  }

  async function list(query: string, driveId?: string) {
    const files: DriveItem[] = [];
    const tokens = new Set<string>();
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: "trashed = false and (" + query + ")",
        fields: "nextPageToken,incompleteSearch,files(" + fields + ")",
        pageSize: "100",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        ...(driveId ? { corpora: "drive", driveId } : {}),
        ...(pageToken ? { pageToken } : {}),
      });
      const page = await (
        await request(filesUrl + "?" + params, units.list)
      ).json();
      if (page.incompleteSearch || !Array.isArray(page.files))
        throw new Error("Inventario de Drive incompleto.");
      files.push(...page.files);
      pageToken = page.nextPageToken;
      if (pageToken && tokens.has(pageToken))
        throw new Error("Paginación de Drive inválida.");
      if (pageToken) tokens.add(pageToken);
    } while (pageToken);
    return files;
  }

  async function entryTime(file: DriveFile, folderId: string) {
    const name = "items/" + file.id;
    const parent = "items/" + folderId;
    const tokens = new Set<string>();
    const changes: { time: number; left: boolean }[] = [];
    let pageToken: string | undefined;
    do {
      const page: { activities?: Activity[]; nextPageToken?: string } = await (
        await request(activityUrl, 0, {
          method: "POST",
          body: JSON.stringify({
            itemName: name,
            filter: "detail.action_detail_case:(CREATE MOVE)",
            consolidationStrategy: { none: {} },
            pageToken,
          }),
        })
      ).json();
      for (const activity of page.activities ?? []) {
        for (const action of activity.actions ?? []) {
          const target =
            action.target ??
            (activity.targets?.length === 1 ? activity.targets[0] : undefined);
          if (target?.driveItem?.name !== name) continue;
          const time = Date.parse(action.timestamp ?? activity.timestamp ?? "");
          if (!Number.isFinite(time)) continue;
          const move = action.detail?.move;
          if (
            move?.addedParents?.some(
              (entry) => entry.driveItem?.name === parent,
            ) ||
            action.detail?.create?.upload
          ) {
            changes.push({ time, left: false });
          } else if (
            move?.removedParents?.some(
              (entry) => entry.driveItem?.name === parent,
            )
          ) {
            changes.push({ time, left: true });
          }
        }
      }
      pageToken = page.nextPageToken;
      if (pageToken && tokens.has(pageToken))
        throw new Error("Paginación de actividad inválida.");
      if (pageToken) tokens.add(pageToken);
    } while (pageToken);
    const latest = changes.sort(
      (a, b) => b.time - a.time || Number(b.left) - Number(a.left),
    )[0];
    if (!latest || latest.left)
      throw new Error(
        "Drive Activity no acredita el orden de incorporación. Se requiere revisión editorial.",
      );
    return latest.time;
  }

  async function findFolder(sourceId: string) {
    const { driveId } = await (root ??= getItem(config.rootId));
    const bound = await list(
      folderQuery +
        " and appProperties has { key='calendarEvent' and value=" +
        quoted(sourceId) +
        " }",
      driveId,
    );
    if (bound.length > 1)
      throw new Error("Hay varias carpetas vinculadas al evento.");
    if (bound[0]) return bound[0];
    const existingId = config.existingFolders?.[sourceId];
    if (!existingId) return undefined;
    const existing = await getItem(existingId);
    return !existing.trashed &&
      existing.appProperties?.calendarEvent === sourceId
      ? existing
      : undefined;
  }

  return {
    findFolder,
    existingFolders: config.existingFolders,
    async prepareFolder(sourceId, category, name, existingId) {
      const { driveId } = await (root ??= getItem(config.rootId));
      const appProperties = { calendarEvent: sourceId };
      const bound = await findFolder(sourceId);
      if (bound) return { folder: bound, linked: false };
      if (existingId) {
        const existing = await getItem(existingId);
        if (
          existing.appProperties?.calendarEvent === sourceId &&
          !existing.trashed
        )
          return { folder: existing, linked: false };
        if (
          existing.trashed ||
          existing.mimeType !== folderMime ||
          existing.appProperties?.calendarEvent
        )
          throw new Error(
            "La carpeta existente no está disponible para este evento.",
          );
      }
      let parent: string | undefined;
      if (!existingId) {
        const categories = await list(
          folderQuery +
            " and " +
            quoted(config.rootId) +
            " in parents and name = " +
            quoted(category),
          driveId,
        );
        if (categories.length !== 1)
          throw new Error(
            "Se requiere una carpeta de categoría " + category + ".",
          );
        parent = categories[0].id;
        const matching = await list(
          folderQuery +
            " and " +
            quoted(parent) +
            " in parents and name = " +
            quoted(name),
          driveId,
        );
        if (matching.length > 1 || matching[0]?.appProperties?.calendarEvent)
          throw new Error(
            "El nombre previsto de la carpeta requiere revisión.",
          );
        existingId = matching[0]?.id;
      }
      const response = existingId
        ? await request(fileUrl(existingId), units.write, {
            method: "PATCH",
            body: JSON.stringify({ appProperties }),
          })
        : await request(
            filesUrl + "?supportsAllDrives=true&fields=" + fields,
            units.write,
            {
              method: "POST",
              body: JSON.stringify({
                name,
                mimeType: folderMime,
                parents: [parent],
                appProperties,
              }),
            },
          );
      return { folder: await response.json(), linked: true };
    },
    async listImages(folderId) {
      const { driveId, mimeType, trashed } = await getItem(folderId);
      if (trashed || mimeType !== folderMime)
        throw new Error("Carpeta de Drive inaccesible.");
      const files = await list(
        quoted(folderId) + " in parents and mimeType contains 'image/'",
        driveId,
      );
      const ordered = [];
      for (const file of files)
        ordered.push({ file, time: await entryTime(file, folderId) });
      return ordered
        .sort(
          (a, b) =>
            a.time - b.time ||
            (a.file.id < b.file.id ? -1 : Number(a.file.id !== b.file.id)),
        )
        .map(({ file }) => file);
    },
    async fetchMedia(input) {
      // Include one extra byte so the importer can reject an oversized image.
      await reserveDownload(MAX_DRIVE_IMAGE_BYTES + 1);
      return request(String(input), units.download, {
        headers: { Range: "bytes=0-" + MAX_DRIVE_IMAGE_BYTES },
      });
    },
  };
}
