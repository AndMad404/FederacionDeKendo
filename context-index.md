# Context index

Purpose: route a request to the smallest canonical source without scanning the
repository or preloading sibling contracts. This file describes where to look;
it does not prove product behavior or replace the selected owner.

## Repository governance

- **Canonical entry:** `AGENTS.md`
- **Read when:** The request needs standing product rules, responsibility
  selection, or completion requirements.
- **Do not read when:** A known specialized contract already governs the task.
- **Next route:** Use only the contract selected by its task router.

## Unknown technical scope

- **Canonical entry:** `.agents/project-map.md`
- **Read when:** The request describes behavior, routes, files, or checks
  without a known technical path.
- **Do not read when:** The target file, route, or owning contract is already
  known.
- **Next route:** Read only the primary files and directed checks selected by
  the matching route.

## Implementation

- **Canonical entry:** `.agents/implementation-contract.md`
- **Read when:** Product code or configuration will be changed.
- **Do not read when:** The task is read-only review, documentation, or
  verification selection.
- **Next route:** Follow dependencies explicitly required by that contract.

## Review

- **Canonical entry:** `.agents/review-contract.md`
- **Read when:** The user asks for a technical review or findings.
- **Do not read when:** The task already authorizes a known implementation.
- **Next route:** Read review state only as directed by the contract.

## Verification

- **Canonical entry:** `.agents/verification.md`
- **Read when:** Checks must be selected or visual evidence must be validated.
- **Do not read when:** A narrower directed check is already known and
  sufficient.
- **Next route:** Expand only when the selected gate requires it.

## Optional private context

- **Canonical entry:** `.agents/private-context.md`, if present locally.
- **Read when:** The owner requests internal planning, review history or prompts.
- **Do not read when:** Working on public build, tests, runtime or deployment.
- **Next route:** Select only the linked private owner. Its absence does not
  prevent public repository work.

## Mechanical exploration

- **Canonical entry:** `context-library/index.md`
- **Read when:** Only a topic, area, or approximate filename is known and no
  curated route locates it.
- **Do not read when:** The path or owning contract is already known.
- **Next route:** Open only the relevant shard; existence does not prove
  ownership, meaning, or current behavior.

## Reading boundaries

- Do not preload `.agents/`, `.codex/`, routes, tests, or private documentation.
- Do not use private documentation as runtime, build, deployment, or current
  technical evidence.
- Do not traverse assets, generated output, dependencies, or snapshots unless
  the selected owner requires a named artifact.
- Stop expanding when the request is supported.

## Maintenance

`$indexation-librarian` owns changes to this index. Update it when a canonical
entry is created, renamed, retired, or changes responsibility; ordinary edits
inside an indexed document do not require an index change.
