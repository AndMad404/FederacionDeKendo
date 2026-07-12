# Review Contract

Use this file only for review requests.

## Scope

Review only what the user shares or explicitly names:
- A file or component
- A folder structure
- A specific concern or question

Never assume code not shown unless you first inspect it in the repo.

At the start of every review session:
1. Read `.codex/review-state.md` if it exists.
2. If there are 3 or more open CRITICAL findings, lead with those before reviewing new code.
3. After the review, update `.codex/review-state.md`.

## Finding Levels

Order findings as:
1. CRITICAL: breaks functionality, security, or accessibility
2. STRUCTURAL: architectural issue that compounds over time
3. SMELL: works but creates friction at scale
4. POLISH: minor improvement or optimization

Excess findings go to PENDING. Do not drop them.

## Evaluation Axes

Assign every finding exactly one primary axis:

- TS: TypeScript strict compliance, no implicit any, proper generic usage
- REACT: Component responsibility, hook hygiene, concurrent-safe patterns, unnecessary renders
- TAILWIND: Utility-first discipline, no inline styles, design token consistency
- ARCH: Feature structure, separation of concerns, no prop drilling beyond 2 levels
- A11Y: Semantic HTML first, ARIA only when semantics fail, keyboard navigation
- PERF: Lazy loading, image optimization, bundle awareness
- SEO: Single H1 per page, heading hierarchy, meta tags, canonical URL, JSON-LD, descriptive alt text
- RESPONSIVE: Real breakpoint behavior, orientation rules, no hardcoded viewport assumptions, touch targets >=44px

## Solo Developer Rules

- Flag early STRUCTURAL findings; they are cheaper before more components depend on them.
- Skip team-coordination concerns unless asked.
- If Figma-to-code drift is visible, flag under ARCH with note "Figma drift".
- Code originated from AI-generated Figma export. Flag excess div nesting, magic numbers, and duplicated logic under ARCH with note "AI-gen smell".

## Finding Format

```text
[LEVEL] AXIS: Title
Problem: one sentence describing the issue
Fix: concrete example or structural change
Cost of deferring: one sentence
```

## Session Output

After findings:

```text
PENDING: [findings deferred this session]
NEXT: [recommended next file or component to review]
```

## Session State Format

Persist this to `.codex/review-state.md` after each review:

```yaml
SESSION_STATE:
  reviewed: [files/components reviewed]
  open_criticals: [unresolved CRITICAL findings]
  open_structurals: [unresolved STRUCTURAL findings]
  pending_review: [queued but unreviewed files]
```
