import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";

const HEADER = [
  "# Technical Review State",
  "",
  "This file contains current technical review state and a compact resolved",
  "provenance index. Full findings, sessions, stale coverage, and verification",
  "evidence remain in the history files and are loaded only when required.",
].join("\n");

const TOP_LEVEL_FIELDS = [
  "schemaVersion",
  "lastUpdated",
  "contract",
  "historyIndex",
  "historySnapshots",
  "stateRules",
  "coverage",
  "coverageNote",
  "idConflicts",
  "openFindings",
  "resolvedIndex",
  "pendingReviews",
  "hookFailures",
];
const MAX_GIT_NORMALIZED_BYTES = 32 * 1024;

const OPEN_LEVELS = new Set([
  "CRITICAL",
  "STRUCTURAL",
  "SMELL",
  "POLICY",
  "POLISH",
]);
const REVIEW_AXES = new Set([
  "TS",
  "REACT",
  "TAILWIND",
  "ARCH",
  "A11Y",
  "PERF",
  "SEO",
  "RESPONSIVE",
]);
const OPEN_STATUSES = new Set([
  "open",
  "open_owner_policy",
  "open_decision_required",
  "needs_reverification",
  "deferred_presidency_authority",
]);

function fail(message) {
  throw new Error(`Invalid review state: ${message}`);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, label) {
  if (!isObject(value)) fail(`${label} must be an object`);
}

function requireString(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !value.trim()) {
    fail(`${label} must be a non-empty string${nullable ? " or null" : ""}`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
}

function requireExactFields(value, fields, label, optional = []) {
  requireObject(value, label);
  const allowed = new Set([...fields, ...optional]);
  const missing = fields.filter((field) => !(field in value));
  const extra = Object.keys(value).filter((field) => !allowed.has(field));
  if (missing.length) fail(`${label} is missing: ${missing.join(", ")}`);
  if (extra.length)
    fail(`${label} has unsupported fields: ${extra.join(", ")}`);
  const expectedOrder = [
    ...fields,
    ...optional.filter((field) => field in value),
  ];
  if (Object.keys(value).join("\0") !== expectedOrder.join("\0")) {
    fail(`${label} fields are not in canonical order`);
  }
}

function requireStringArray(value, label) {
  requireArray(value, label);
  value.forEach((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireUnique(values, label) {
  const duplicates = [
    ...new Set(
      values.filter((value, index) => values.indexOf(value) !== index),
    ),
  ];
  if (duplicates.length)
    fail(`${label} contains duplicates: ${duplicates.join(", ")}`);
}

function conflictFor(state, id) {
  return state.idConflicts.find((entry) => entry.sourceId === id);
}

function validateSnapshot(snapshot, index) {
  const label = `historySnapshots[${index}]`;
  requireExactFields(snapshot, ["file", "captured", "sha256"], label);
  requireString(snapshot.file, `${label}.file`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.captured)) {
    fail(`${label}.captured must use YYYY-MM-DD`);
  }
  if (!/^[A-F0-9]{64}$/.test(snapshot.sha256)) {
    fail(`${label}.sha256 must be an uppercase SHA-256`);
  }
}

function validateCoverage(entry, index) {
  const label = `coverage[${index}]`;
  requireExactFields(
    entry,
    [
      "id",
      "target",
      "axes",
      "included",
      "excluded",
      "evidence",
      "baseline",
      "status",
    ],
    label,
  );
  requireString(entry.id, `${label}.id`);
  requireString(entry.target, `${label}.target`);
  requireStringArray(entry.axes, `${label}.axes`);
  entry.axes.forEach((axis) => {
    if (!REVIEW_AXES.has(axis))
      fail(`${label}.axes contains unsupported ${axis}`);
  });
  requireStringArray(entry.included, `${label}.included`);
  requireStringArray(entry.excluded, `${label}.excluded`);
  requireStringArray(entry.evidence, `${label}.evidence`);
  requireExactFields(
    entry.baseline,
    ["commit", "worktree"],
    `${label}.baseline`,
  );
  requireString(entry.baseline.commit, `${label}.baseline.commit`);
  requireString(entry.baseline.worktree, `${label}.baseline.worktree`);
  if (entry.status !== "current") fail(`${label}.status must be current`);
}

function validateConflict(entry, index) {
  const label = `idConflicts[${index}]`;
  requireExactFields(
    entry,
    ["sourceId", "status", "targets", "recordKeys", "rule"],
    label,
  );
  requireString(entry.sourceId, `${label}.sourceId`);
  requireString(entry.status, `${label}.status`);
  requireStringArray(entry.targets, `${label}.targets`);
  requireStringArray(entry.recordKeys, `${label}.recordKeys`);
  requireUnique(entry.recordKeys, `${label}.recordKeys`);
  requireString(entry.rule, `${label}.rule`);
}

function validateOpenFinding(entry, index) {
  const label = `openFindings[${index}]`;
  requireExactFields(
    entry,
    ["id", "level", "axis", "status", "target", "summary"],
    label,
    ["sourceId"],
  );
  requireString(entry.id, `${label}.id`);
  if (!OPEN_LEVELS.has(entry.level)) fail(`${label}.level is unsupported`);
  if (!REVIEW_AXES.has(entry.axis)) fail(`${label}.axis is unsupported`);
  if (!OPEN_STATUSES.has(entry.status)) fail(`${label}.status is unsupported`);
  requireString(entry.target, `${label}.target`);
  requireString(entry.summary, `${label}.summary`);
  if ("sourceId" in entry) requireString(entry.sourceId, `${label}.sourceId`);
}

function validateResolvedEntry(entry, index, state) {
  const label = `resolvedIndex[${index}]`;
  requireExactFields(
    entry,
    ["recordKey", "id", "target", "summary", "resolutionRef", "historyFile"],
    label,
  );
  requireString(entry.recordKey, `${label}.recordKey`);
  requireString(entry.id, `${label}.id`);
  requireString(entry.target, `${label}.target`, { nullable: true });
  requireString(entry.summary, `${label}.summary`);
  requireString(entry.resolutionRef, `${label}.resolutionRef`, {
    nullable: true,
  });
  requireString(entry.historyFile, `${label}.historyFile`);
  const historyFiles = new Set([
    state.historyIndex,
    ...state.historySnapshots.map((snapshot) => snapshot.file),
  ]);
  if (!historyFiles.has(entry.historyFile)) {
    fail(`${label}.historyFile is not registered`);
  }
}

function validatePendingReview(entry, index) {
  const label = `pendingReviews[${index}]`;
  requireExactFields(entry, ["id", "target", "dependency"], label);
  requireString(entry.id, `${label}.id`);
  requireString(entry.target, `${label}.target`);
  requireString(entry.dependency, `${label}.dependency`);
}

function validateHookFailure(entry, index) {
  const label = `hookFailures[${index}]`;
  requireExactFields(
    entry,
    ["id", "recordedAt", "sessionId", "event", "status", "problem", "evidence"],
    label,
  );
  for (const field of [
    "id",
    "recordedAt",
    "sessionId",
    "event",
    "problem",
    "evidence",
  ]) {
    requireString(entry[field], `${label}.${field}`);
  }
  if (entry.status !== "needs_human_review") {
    fail(`${label}.status must be needs_human_review`);
  }
}

export function validateReviewState(state) {
  requireObject(state, "root");
  const keys = Object.keys(state);
  const missing = TOP_LEVEL_FIELDS.filter((field) => !(field in state));
  const extra = keys.filter((field) => !TOP_LEVEL_FIELDS.includes(field));
  if (missing.length) fail(`root is missing: ${missing.join(", ")}`);
  if (extra.length) fail(`root has unsupported fields: ${extra.join(", ")}`);
  if (keys.join("\0") !== TOP_LEVEL_FIELDS.join("\0")) {
    fail("root fields are not in canonical order");
  }
  if (state.schemaVersion !== 4) fail("schemaVersion must be 4");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.lastUpdated)) {
    fail("lastUpdated must use YYYY-MM-DD");
  }
  requireString(state.contract, "contract");
  requireString(state.historyIndex, "historyIndex");
  requireArray(state.historySnapshots, "historySnapshots");
  state.historySnapshots.forEach(validateSnapshot);
  requireUnique(
    state.historySnapshots.map((snapshot) => snapshot.file),
    "historySnapshots.file",
  );
  requireStringArray(state.stateRules, "stateRules");
  requireArray(state.coverage, "coverage");
  state.coverage.forEach(validateCoverage);
  requireString(state.coverageNote, "coverageNote");
  requireArray(state.idConflicts, "idConflicts");
  state.idConflicts.forEach(validateConflict);
  requireUnique(
    state.idConflicts.map((entry) => entry.sourceId),
    "idConflicts.sourceId",
  );
  requireArray(state.openFindings, "openFindings");
  state.openFindings.forEach(validateOpenFinding);
  requireUnique(
    state.openFindings.map((entry) => entry.id),
    "openFindings.id",
  );
  requireArray(state.resolvedIndex, "resolvedIndex");
  state.resolvedIndex.forEach((entry, index) =>
    validateResolvedEntry(entry, index, state),
  );
  requireUnique(
    state.resolvedIndex.map((entry) => entry.recordKey),
    "resolvedIndex.recordKey",
  );
  requireArray(state.pendingReviews, "pendingReviews");
  state.pendingReviews.forEach(validatePendingReview);
  requireUnique(
    state.pendingReviews.map((entry) => entry.id),
    "pendingReviews.id",
  );
  requireArray(state.hookFailures, "hookFailures");
  state.hookFailures.forEach(validateHookFailure);
  requireUnique(
    state.hookFailures.map((entry) => entry.id),
    "hookFailures.id",
  );

  const resolvedById = new Map();
  for (const entry of state.resolvedIndex) {
    const records = resolvedById.get(entry.id) || [];
    records.push(entry.recordKey);
    resolvedById.set(entry.id, records);
  }
  for (const [id, recordKeys] of resolvedById) {
    if (recordKeys.length < 2) continue;
    const conflict = conflictFor(state, id);
    if (
      !conflict ||
      recordKeys.some((key) => !conflict.recordKeys.includes(key))
    ) {
      fail(`duplicate resolved id ${id} is not fully declared in idConflicts`);
    }
  }
  const resolvedIds = new Set(state.resolvedIndex.map((entry) => entry.id));
  for (const finding of state.openFindings) {
    if (resolvedIds.has(finding.id) && !conflictFor(state, finding.id)) {
      fail(`open and resolved id ${finding.id} lacks an idConflicts entry`);
    }
  }
  return state;
}

export function serializeReviewStateMarkdown(state) {
  validateReviewState(state);
  const lines = ["{"];
  TOP_LEVEL_FIELDS.forEach((field, fieldIndex) => {
    const value = state[field];
    const comma = fieldIndex === TOP_LEVEL_FIELDS.length - 1 ? "" : ",";
    if (!Array.isArray(value)) {
      lines.push(
        `  ${JSON.stringify(field)}: ${JSON.stringify(value)}${comma}`,
      );
      return;
    }
    if (value.length === 0) {
      lines.push(`  ${JSON.stringify(field)}: []${comma}`);
      return;
    }
    lines.push(`  ${JSON.stringify(field)}: [`);
    value.forEach((entry, entryIndex) => {
      const entryComma = entryIndex === value.length - 1 ? "" : ",";
      lines.push(`    ${JSON.stringify(entry)}${entryComma}`);
    });
    lines.push(`  ]${comma}`);
  });
  lines.push("}");
  const json = lines.join("\n");
  const document = `${HEADER}\n\n\`\`\`json\n${json}\n\`\`\`\n`;
  const normalizedBytes = Buffer.byteLength(document);
  if (normalizedBytes > MAX_GIT_NORMALIZED_BYTES) {
    fail(
      `canonical document is ${normalizedBytes} bytes; maximum is ${MAX_GIT_NORMALIZED_BYTES}`,
    );
  }
  return document;
}

export function parseReviewStateMarkdown(markdown, { canonical = true } = {}) {
  const matches = [...markdown.matchAll(/```json\r?\n([\s\S]*?)\r?\n```/g)];
  if (matches.length !== 1) {
    fail(`expected one fenced JSON block, found ${matches.length}`);
  }
  let state;
  try {
    state = JSON.parse(matches[0][1]);
  } catch (error) {
    fail(`JSON parse failed: ${error.message}`);
  }
  validateReviewState(state);
  if (canonical && markdown !== serializeReviewStateMarkdown(state)) {
    fail("document is not canonically serialized");
  }
  return state;
}

export function updateReviewStateAtomically(reviewStatePath, mutator) {
  const current = readFileSync(reviewStatePath, "utf8");
  const state = structuredClone(parseReviewStateMarkdown(current));
  const replacement = mutator(state) || state;
  replacement.lastUpdated = new Date().toISOString().slice(0, 10);
  const next = serializeReviewStateMarkdown(replacement);
  const temporaryPath = `${reviewStatePath}.${process.pid}.tmp`;
  try {
    writeFileSync(temporaryPath, next, "utf8");
    renameSync(temporaryPath, reviewStatePath);
  } catch (error) {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
  return replacement;
}

function yamlScalar(value) {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function compactSummary(value) {
  if (!value) return "Historical resolved record; load history for details.";
  if (value.length <= 64) return value;
  const prefix = value.slice(0, 61);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > 42 ? boundary : 61)}...`;
}

function fieldFromBlock(lines, name) {
  const pattern = new RegExp(`^\\s*(?:- )?${name}:\\s*(.*)$`);
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) return yamlScalar(match[1]);
  }
  return null;
}

export function extractResolvedIndexFromSnapshot(
  snapshot,
  historyFile,
  captured,
) {
  const lines = snapshot.split(/\r?\n/);
  const records = [];
  for (let statusIndex = 0; statusIndex < lines.length; statusIndex += 1) {
    const statusMatch = lines[statusIndex].match(
      /^(\s*)status:\s*(resolved(?:_[^\s]+)?)\s*$/,
    );
    if (!statusMatch) continue;
    const statusIndent = statusMatch[1].length;
    let idIndex = -1;
    let id = null;
    let idIndent = -1;
    for (let index = statusIndex - 1; index >= 0; index -= 1) {
      const idMatch = lines[index].match(/^(\s*)(?:- )?id:\s*(.+)$/);
      if (idMatch && idMatch[1].length < statusIndent) {
        idIndex = index;
        idIndent = idMatch[1].length;
        id = yamlScalar(idMatch[2]);
        break;
      }
    }
    if (idIndex < 0 || !id) {
      throw new Error(`Resolved status at line ${statusIndex + 1} has no id`);
    }
    let endIndex = lines.length;
    for (let index = idIndex + 1; index < lines.length; index += 1) {
      if (!lines[index].trim()) continue;
      const indentation = lines[index].match(/^\s*/)[0].length;
      if (indentation < idIndent) {
        endIndex = index;
        break;
      }
      if (
        index > statusIndex &&
        indentation === idIndent &&
        /^(\s*)(?:- )?id:\s*/.test(lines[index])
      ) {
        endIndex = index;
        break;
      }
    }
    const block = lines.slice(idIndex, endIndex);
    const inlineReference = block
      .join("\n")
      .match(/resolved_ref:\s*([^,}\n]+)/)?.[1];
    const summary =
      fieldFromBlock(block, "summary") || fieldFromBlock(block, "problem");
    const summaryPrefix =
      statusMatch[2] === "resolved_legacy_unverified"
        ? "Legacy unverified: "
        : "";
    records.push({
      recordKey: `RES-${captured.replaceAll("-", "")}-L${String(statusIndex + 1).padStart(4, "0")}`,
      id,
      target: fieldFromBlock(block, "target"),
      summary: compactSummary(`${summaryPrefix}${summary || ""}`),
      resolutionRef:
        fieldFromBlock(block, "resolved_ref") || yamlScalar(inlineReference),
      historyFile,
    });
  }
  return records;
}
