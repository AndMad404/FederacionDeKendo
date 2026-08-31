# Context index

Purpose: route a request to the smallest canonical source without scanning the
repository or preloading sibling contracts. This file describes where to look;
it does not prove product behavior or replace the selected owner.

| Concern                          | Canonical entry                                                      | Read when                                                                                                       | Do not read when                                                             | Next route                                                                    |
| -------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Repository governance            | `AGENTS.md`                                                          | The request needs standing product rules, responsibility selection, or completion requirements.                 | A known specialized contract already governs the task.                       | Use only the contract selected by its task router.                            |
| Unknown technical scope          | `.agents/project-map.md`                                             | The request describes behavior, routes, files, or checks without a known technical path.                        | The target file, route, or owning contract is already known.                 | Read only the primary files and directed checks selected by the matching row. |
| Implementation                   | `.agents/implementation-contract.md`                                 | Product code or configuration will be changed.                                                                  | The task is read-only review, documentation, or verification selection.      | Follow dependencies explicitly required by that contract.                     |
| Review                           | `.agents/review-contract.md`                                         | The user asks for a technical review or findings.                                                               | The task already authorizes a known implementation.                          | Read review state only as directed by the contract.                           |
| Verification                     | `.agents/verification.md`                                            | Checks must be selected or visual evidence must be validated.                                                   | A narrower directed check is already known and sufficient.                   | Expand only when the selected gate requires it.                               |
| Private Federation documentation | `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md` | The request concerns private architecture notes, decisions, roadmaps, methodology, or case-study documentation. | The request is ordinary product implementation with a known technical route. | Let the private index select one owning document.                             |

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
