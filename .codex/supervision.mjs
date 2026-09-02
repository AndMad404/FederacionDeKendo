import {
  recordHookFailure,
  runCompletionChecks as runFederacionChecks,
} from "./hooks/shared.mjs";

export function runCompletionChecks(root) {
  return runFederacionChecks(root);
}

export function recordFailure(root, failure) {
  return recordHookFailure(root, failure);
}
