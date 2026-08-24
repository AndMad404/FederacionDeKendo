import {
  captureRelevantFingerprint,
  findRepositoryRoot,
  getWorktreeSummary,
  isDirectExecution,
  readHookInput,
  saveSessionState,
  writeHookJson,
} from "./shared.mjs";

export async function handleSessionStart(input) {
  const root = findRepositoryRoot(input.cwd || process.cwd());
  const head = (await import("node:child_process"))
    .execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    })
    .trim();
  const worktree = getWorktreeSummary(root);

  await saveSessionState(input.session_id, {
    capturedAt: new Date().toISOString(),
    fingerprint: captureRelevantFingerprint(root),
    head,
    root,
    worktree,
  });

  const changedFiles = worktree
    ? worktree.split(/\r?\n/).slice(0, 5).join("; ")
    : "none";
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `Baseline HEAD ${head}; existing changes: ${changedFiles}. ` +
        "Preserve them; owner decisions remain human.",
    },
  };
}

if (isDirectExecution(import.meta.url)) {
  try {
    writeHookJson(await handleSessionStart(await readHookInput()));
  } catch (error) {
    writeHookJson({
      continue: true,
      systemMessage: `SessionStart hook could not record its baseline: ${error.message}`,
    });
  }
}
