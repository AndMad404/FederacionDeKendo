// Only built-in modules: publication never installs or executes dependencies.
// Load publication code before restoring a patch that could include formatting fixes.
import { publishChanges } from "./publish-changes.mjs";
import { captureWorkspaceFingerprint } from "./verify-site.mjs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EVIDENCE = ["verification.json", "quality-fix.json", "corrections.patch"];
const REPORTS = [
  "calendar-notifications.json",
  "calendar-historical-changes.json",
];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (file) => JSON.parse(readFileSync(file, "utf8"));

export function safeRelativePath(value) {
  if (
    typeof value !== "string" ||
    !value ||
    /[\\:]/.test(value) ||
    [...value].some((character) => character.charCodeAt(0) < 32) ||
    value
      .split("/")
      .some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          /[. ]$/.test(part) ||
          part.toLowerCase() === ".git",
      ) ||
    path.posix.isAbsolute(value)
  )
    throw new Error("Unsafe artifact path.");
  return value;
}

function contained(root, relative) {
  safeRelativePath(relative);
  const base = path.resolve(root);
  const target = path.resolve(base, relative);
  if (!target.startsWith(`${base}${path.sep}`))
    throw new Error("Artifact path escapes its root.");
  // Reject symlinks in every existing component, including the destination root.
  let current = base;
  for (const part of ["", ...relative.split("/")]) {
    if (part) current = path.join(current, part);
    if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink())
      throw new Error("Artifact symlinks are forbidden.");
  }
  return target;
}

function filesIn(root, prefix = "") {
  if (!existsSync(root)) return [];
  if (lstatSync(root).isSymbolicLink())
    throw new Error("Artifact symlinks are forbidden.");
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const relative = safeRelativePath(`${prefix}${entry.name}`);
    if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory()))
      throw new Error("Only regular artifact files are accepted.");
    return entry.isDirectory()
      ? filesIn(path.join(root, entry.name), `${relative}/`)
      : [relative];
  });
}

function context(env, kind) {
  const value = {
    repository: env.GITHUB_REPOSITORY,
    sha: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID,
    attempt: env.GITHUB_RUN_ATTEMPT,
    kind,
  };
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(value.repository ?? "") ||
    !/^[a-f0-9]{40}$/.test(value.sha ?? "") ||
    !/^[1-9]\d*$/.test(value.runId ?? "") ||
    !/^[1-9]\d*$/.test(value.attempt ?? "") ||
    !["calendar", "history", "decision"].includes(kind)
  )
    throw new Error("Missing or invalid handoff execution identity.");
  return value;
}

function put(directory, relative, bytes) {
  const target = contained(directory, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}

export function createHandoff({
  root = process.cwd(),
  directory,
  reports,
  temporary,
  kind,
  ready,
  env = process.env,
}) {
  const identity = context(env, kind);
  if (filesIn(directory).length)
    throw new Error("Handoff directory must be empty.");
  mkdirSync(directory, { recursive: true });
  for (const file of EVIDENCE) {
    const source = contained(reports, file);
    if (existsSync(source))
      put(directory, `evidence/${file}`, readFileSync(source));
  }
  for (const file of REPORTS) {
    const source = contained(temporary, file);
    if (existsSync(source))
      put(directory, `reports/${file}`, readFileSync(source));
  }
  if (ready) {
    for (const file of EVIDENCE)
      if (!existsSync(contained(directory, `evidence/${file}`)))
        throw new Error("Missing publication evidence.");
    const verification = json(
      path.join(directory, "evidence/verification.json"),
    );
    if (
      verification.status !== "passed" ||
      verification.sha !== identity.sha ||
      verification.fingerprint !== captureWorkspaceFingerprint(root)
    )
      throw new Error("Handoff is not the verified source tree.");
    if (!existsSync(path.join(root, "dist/index.html")))
      throw new Error("Missing verified build.");
    for (const file of filesIn(path.join(root, "dist")))
      put(
        directory,
        `build/${file}`,
        readFileSync(contained(path.join(root, "dist"), file)),
      );
  }
  const files = Object.fromEntries(
    filesIn(directory)
      .sort()
      .map((file) => [file, digest(readFileSync(contained(directory, file)))]),
  );
  put(
    directory,
    "handoff.json",
    Buffer.from(
      JSON.stringify(
        { schemaVersion: 1, ...identity, ready: ready === true, files },
        null,
        2,
      ) + "\n",
    ),
  );
}

export function validateHandoff({
  directory,
  kind,
  env = process.env,
  requireReady = false,
}) {
  const manifest = json(contained(directory, "handoff.json"));
  const identity = context(env, kind);
  if (
    manifest.schemaVersion !== 1 ||
    Object.entries(identity).some(([key, value]) => manifest[key] !== value) ||
    typeof manifest.ready !== "boolean" ||
    !manifest.files ||
    typeof manifest.files !== "object" ||
    Array.isArray(manifest.files)
  )
    throw new Error("Handoff origin does not match this execution.");
  const actual = filesIn(directory)
    .filter((file) => file !== "handoff.json")
    .sort();
  if (
    JSON.stringify(actual) !==
    JSON.stringify(Object.keys(manifest.files).sort())
  )
    throw new Error("Unexpected or missing handoff files.");
  for (const file of actual) {
    if (
      !/^evidence\/(verification\.json|quality-fix\.json|corrections\.patch)$/.test(
        file,
      ) &&
      !/^reports\/(calendar-notifications\.json|calendar-historical-changes\.json)$/.test(
        file,
      ) &&
      !file.startsWith("build/")
    )
      throw new Error("Unexpected handoff path.");
    if (
      digest(readFileSync(contained(directory, file))) !== manifest.files[file]
    )
      throw new Error("Handoff checksum mismatch.");
  }
  if (requireReady) {
    if (
      !manifest.ready ||
      !actual.includes("build/index.html") ||
      EVIDENCE.some((file) => !actual.includes(`evidence/${file}`))
    )
      throw new Error("Handoff is not ready for publication.");
    const verification = json(
      contained(directory, "evidence/verification.json"),
    );
    const quality = json(contained(directory, "evidence/quality-fix.json"));
    if (
      verification.schemaVersion !== 1 ||
      verification.status !== "passed" ||
      verification.sha !== identity.sha ||
      quality.schemaVersion !== 1 ||
      quality.sha !== identity.sha ||
      quality.mode !== "fix" ||
      !["clean", "corrected"].includes(quality.status)
    )
      throw new Error("Handoff verification did not pass.");
  }
  return manifest;
}

export function applyVerifiedPatch(root, patchPath, execute = execFileSync) {
  const patch = readFileSync(patchPath);
  if (!patch.length) return;
  // Never restore symlinks or submodules, even when the path itself is safe.
  if (
    /^(?:(?:new|deleted) file mode|old mode|new mode) (?:120000|160000)$/m.test(
      patch.toString("utf8"),
    )
  )
    throw new Error("Patch links and submodules are forbidden.");
  const stats = execute("git", ["apply", "--numstat", "-z", "--", patchPath], {
    cwd: root,
    encoding: "utf8",
  });
  for (const entry of stats.split("\0").filter(Boolean)) {
    const match = /^(?:\d+|-)\t(?:\d+|-)\t(.+)$/s.exec(entry);
    if (!match) throw new Error("Unsupported patch path or rename.");
    contained(root, match[1]);
  }
  execute("git", ["apply", "--check", "--", patchPath], { cwd: root });
  execute("git", ["apply", "--binary", "--", patchPath], { cwd: root });
}

export function restoreHandoff({
  root = process.cwd(),
  directory,
  temporary,
  reports,
  kind,
  env = process.env,
  publish = false,
}) {
  const manifest = validateHandoff({
    directory,
    kind,
    env,
    requireReady: publish,
  });
  if (manifest.ready) {
    applyVerifiedPatch(
      root,
      path.join(directory, "evidence/corrections.patch"),
    );
    if (
      captureWorkspaceFingerprint(root) !==
      json(path.join(directory, "evidence/verification.json")).fingerprint
    )
      throw new Error("Restored source differs from the verified source.");
  }
  for (const file of Object.keys(manifest.files)) {
    let destination;
    let relative;
    if (file.startsWith("evidence/")) {
      destination = reports;
      relative = file.slice(9);
    }
    if (!publish && file.startsWith("reports/")) {
      destination = temporary;
      relative = file.slice(8);
    }
    if (!publish && file.startsWith("build/")) {
      destination = path.join(root, "dist");
      relative = file.slice(6);
    }
    if (destination)
      put(destination, relative, readFileSync(contained(directory, file)));
  }
  return manifest;
}

export function publishHandoff(options) {
  // Capture the trusted configuration and modules before applying source fixes.
  const coverApproval = json(
    path.join(options.root, "src/app/config/eventCoverApproval.json"),
  );
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: options.root,
    encoding: "utf8",
  }).trim();
  if (
    head !== options.env.GITHUB_SHA ||
    options.env.GITHUB_REF !== "refs/heads/main"
  )
    throw new Error("Publication requires the exact main workflow revision.");
  restoreHandoff({ ...options, publish: true });
  return publishChanges({
    root: options.root,
    kind: options.kind,
    directory: options.reports,
    expectedSha: options.env.GITHUB_SHA,
    ref: options.env.GITHUB_REF,
    readCoverApproval: () => coverApproval,
    git: publicationGit(options.root, options.env),
  });
}

function publicationGit(root, env) {
  const gitEnv = { ...env };
  if (env.CALENDAR_PUBLICATION_TOKEN) {
    gitEnv.GIT_CONFIG_COUNT = "1";
    gitEnv.GIT_CONFIG_KEY_0 = "http.https://github.com/.extraheader";
    gitEnv.GIT_CONFIG_VALUE_0 = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${env.CALENDAR_PUBLICATION_TOKEN}`).toString("base64")}`;
    delete gitEnv.CALENDAR_PUBLICATION_TOKEN;
  }
  return (args) =>
    execFileSync(
      "git",
      ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args],
      {
        cwd: root,
        encoding: "utf8",
        env: gitEnv,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
}

export function publishSiteCorrections({ root, reports, env }) {
  const verification = json(path.join(reports, "verification.json"));
  const quality = json(path.join(reports, "quality-fix.json"));
  if (
    verification.sha !== env.GITHUB_SHA ||
    quality.sha !== env.GITHUB_SHA ||
    verification.runId !== env.GITHUB_RUN_ID ||
    verification.attempt !== env.GITHUB_RUN_ATTEMPT ||
    verification.status !== "passed" ||
    env.GITHUB_REF !== "refs/heads/main" ||
    env.GITHUB_EVENT_NAME !== "push"
  )
    throw new Error("Site evidence does not match this main push execution.");
  const coverApproval = json(
    path.join(root, "src/app/config/eventCoverApproval.json"),
  );
  applyVerifiedPatch(root, path.join(reports, "corrections.patch"));
  return publishChanges({
    root,
    directory: reports,
    expectedSha: env.GITHUB_SHA,
    ref: env.GITHUB_REF,
    readCoverApproval: () => coverApproval,
    git: publicationGit(root, env),
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const env = process.env;
  const options = {
    root: process.cwd(),
    directory: path.join(env.RUNNER_TEMP, "calendar-handoff"),
    reports: path.join(env.RUNNER_TEMP, "site-verification"),
    temporary: env.RUNNER_TEMP,
    kind: env.CALENDAR_OPERATION,
    env,
  };
  try {
    if (process.argv[2] === "pack")
      createHandoff({ ...options, ready: env.CALENDAR_PREPARED === "true" });
    else if (process.argv[2] === "publish") {
      const result = publishHandoff(options);
      if (env.GITHUB_OUTPUT)
        appendFileSync(env.GITHUB_OUTPUT, "git-saved=true\n");
      put(
        options.temporary,
        "calendar-publication/publication.json",
        Buffer.from(JSON.stringify(result, null, 2) + "\n"),
      );
    } else if (process.argv[2] === "restore") restoreHandoff(options);
    else if (process.argv[2] === "site")
      publishSiteCorrections({
        ...options,
        reports: env.VERIFY_SITE_REPORT_DIR ?? options.reports,
      });
    else throw new Error("Unknown handoff operation.");
  } catch (error) {
    if (process.argv[2] === "publish") {
      const report = {
        schemaVersion: 1,
        status: "failed",
        message: error.message,
        deployment: "not-confirmed",
      };
      put(
        options.temporary,
        "calendar-publication/publication.json",
        Buffer.from(JSON.stringify(report, null, 2) + "\n"),
      );
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}
