import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseVEvents } from "./sync-calendar-events.ts";

const MAX_BYTES = 20 * 1024 * 1024;
const RETENTION_SECONDS = 30 * 24 * 60 * 60;
const KEY = /^calendar\/\d{4}-\d{2}-\d{2}\/\d{13}-([a-f0-9]{64})\.ics$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function limitedBody(response) {
  if (!response.ok || !response.body) throw new Error("Download failed");
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body.cancel();
    throw new Error("Calendar exceeds 20 MB");
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Calendar exceeds 20 MB");
      chunks.push(value);
    }
    return Buffer.concat(chunks, size);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function validateCalendar(bytes) {
  if (!parseVEvents(bytes.toString("utf8")).length)
    throw new Error("Calendar contains no events");
}

function storage(env, fetchImpl) {
  const account = env.CALENDAR_BACKUP_CF_ACCOUNT_ID;
  const bucket = env.CALENDAR_BACKUP_R2_BUCKET;
  const token = env.CALENDAR_BACKUP_CF_API_TOKEN;
  if (
    !/^[a-f0-9]{32}$/.test(account ?? "") ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket ?? "") ||
    !token
  )
    throw new Error("Missing or invalid backup configuration");
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}`;
  const request = async (suffix, options = {}) => {
    const response = await fetchImpl(base + suffix, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
      headers: { authorization: `Bearer ${token}`, ...options.headers },
    });
    if (!response.ok) throw new Error(`R2 request failed (${response.status})`);
    return response;
  };
  const json = async (suffix, options) => {
    const result = await (await request(suffix, options)).json();
    if (result.success !== true) throw new Error("R2 operation failed");
    return result.result;
  };
  return { request, json };
}

async function verifyPolicy(client) {
  const [managed, custom, lifecycle] = await Promise.all([
    client.json("/domains/managed"),
    client.json("/domains/custom"),
    client.json("/lifecycle"),
  ]);
  if (
    managed.enabled !== false ||
    !Array.isArray(custom.domains) ||
    custom.domains.some((domain) => domain.enabled !== false)
  )
    throw new Error("Backup bucket must be private");
  const applicable = (lifecycle.rules ?? []).filter(
    (rule) =>
      rule.enabled &&
      rule.deleteObjectsTransition &&
      ("calendar/".startsWith(rule.conditions.prefix) ||
        rule.conditions.prefix.startsWith("calendar/")),
  );
  if (
    !applicable.some(
      (rule) =>
        "calendar/".startsWith(rule.conditions.prefix) &&
        rule.deleteObjectsTransition.condition.type === "Age" &&
        rule.deleteObjectsTransition.condition.maxAge === RETENTION_SECONDS,
    ) ||
    applicable.some(
      (rule) =>
        rule.deleteObjectsTransition.condition.type !== "Age" ||
        rule.deleteObjectsTransition.condition.maxAge < RETENTION_SECONDS,
    )
  )
    throw new Error("Backup bucket requires 30-day retention for calendar/");
}

async function readSnapshot(client, key) {
  const match = KEY.exec(key);
  if (!match) throw new Error("Invalid backup object key");
  const bytes = await limitedBody(await client.request(`/objects/${key}`));
  if (sha256(bytes) !== match[1]) throw new Error("Backup checksum mismatch");
  validateCalendar(bytes);
  return bytes;
}

export async function backupCalendar({
  env = process.env,
  fetchImpl = fetch,
  now = new Date(),
} = {}) {
  const client = storage(env, fetchImpl);
  await verifyPolicy(client);
  const source = new URL(env.CALENDAR_ICS_URL);
  if (source.protocol !== "https:" || source.username || source.password)
    throw new Error("Calendar source must use HTTPS");
  const bytes = await limitedBody(
    await fetchImpl(source, {
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
    }),
  );
  validateCalendar(bytes);
  const checksum = sha256(bytes);
  const key = `calendar/${now.toISOString().slice(0, 10)}/${now.getTime()}-${checksum}.ics`;
  await client.json(`/objects/${key}`, {
    method: "PUT",
    body: bytes,
    headers: { "content-type": "text/calendar; charset=utf-8" },
  });
  const restored = await readSnapshot(client, key);
  if (!restored.equals(bytes))
    throw new Error("Restored bytes differ from source");
  return {
    key,
    sha256: checksum,
    bytes: bytes.length,
    restorationVerified: true,
  };
}

export async function restoreCalendar({
  key,
  outputPath,
  env = process.env,
  fetchImpl = fetch,
}) {
  const client = storage(env, fetchImpl);
  await verifyPolicy(client);
  const bytes = await readSnapshot(client, key);
  await writeFile(outputPath, bytes, { flag: "wx", mode: 0o600 });
  return { key, sha256: sha256(bytes), bytes: bytes.length };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [operation, key, outputPath] = process.argv.slice(2);
    let result;
    if (operation === "backup") result = await backupCalendar();
    else if (operation === "restore" && key && outputPath)
      result = await restoreCalendar({ key, outputPath });
    else throw new Error("Invalid operation");
    console.log(JSON.stringify(result));
  } catch {
    // Network errors can contain the private Calendar URL. Keep logs value-free.
    console.error(
      "Calendar backup/restore failed. Check configuration, private bucket policy, source availability and checksum.",
    );
    process.exitCode = 1;
  }
}
