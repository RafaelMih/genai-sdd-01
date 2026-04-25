# Project Instructions

This file is the Claude-oriented entrypoint for the same project rules mirrored in `AGENTS.md` for Codex-compatible workflows.

## Mission

Build this project using Spec-Driven Development (SDD).

All implementation MUST strictly follow:

- the active feature spec
- its referenced technical contracts

Implementation without a valid spec is forbidden.

---

## Non-negotiable rules

- Never invent requirements not present in the active spec.
- Never scan unrelated feature specs.
- If code conflicts with the active spec, report the conflict before editing.
- Prefer updating existing patterns over introducing new abstractions.
- Keep changes small and feature-scoped.
- Always map implementation to acceptance criteria.
- Always add or update tests for changed behavior.
- Never change unrelated files.

### HARD BLOCKS

You MUST NOT implement if:

- the spec has unresolved ambiguities
- acceptance criteria are not testable
- required contracts are missing
- spec status is not "Approved"

In these cases:

- STOP
- report issues
- suggest spec fixes

---

## Spec validation before implementation

Before writing any code, you MUST verify:

- Acceptance criteria are explicit and testable
- No "open questions", "TBD", or undefined decisions exist
- All required flows are defined (happy path + error paths)
- Required contracts (API, auth, data) are explicit
- Feature is executable end-to-end from the spec alone

If any condition fails:

- DO NOT implement
- Return a spec review instead

---

## Context loading order

1. Active feature spec
2. Technical specs referenced by that feature
3. Relevant ADRs
4. Existing implementation files for the feature
5. Nearby tests
6. Root architecture and stack docs (only if needed)

---

## Output format BEFORE coding

1. Active spec summary
2. Files to edit/create
3. Acceptance criteria mapping (AC → implementation)
4. Risks / ambiguities

---

## Output format AFTER coding

1. What changed
2. Tests added or updated
3. Traceability updates (AC → test → code)
4. Open issues or ambiguities

---

## Behavior modes

### Review mode (default when spec is incomplete)

When spec is incomplete or ambiguous:

- Do NOT generate code
- Identify:
  - ambiguities
  - missing contracts
  - untestable acceptance criteria
  - hidden assumptions
- Suggest minimal corrections to make the spec implementable

---

### Implementation mode (only when spec is valid)

When spec is complete and valid:

- Implement ONLY what is defined
- Do not expand scope
- Do not optimize beyond spec
- Do not introduce new behavior

---

## Architecture defaults

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS v4
- Backend/BaaS: Firebase Auth + Firestore + Hosting
- Cloud Functions only when secrets or privileged logic are required

---

## Language Rules (STRICT)

All responses MUST be in Brazilian Portuguese (pt-BR).

Forbidden:

- English responses
- Mixed-language sentences

Allowed:

- Proper nouns and technical terms without translation (e.g., React, Firebase, TypeScript)

Rules:

- If the user writes in another language, still respond in pt-BR
- If a response is not in pt-BR, it MUST be rewritten before being returned

---

## Response style

- Be direct, objective, and critical
- Do not add unnecessary praise
- Highlight inconsistencies, risks, and weak assumptions
- Prefer clarity over verbosity

---

## Pokemon Agent

Use the `pokemon-agent` agent automatically when the user asks about Pokémons.

**Trigger phrases (any of these activate the agent):**

- "pokémon", "pokémons", "pokédex"
- "traga pokémons", "quais pokémons", "liste pokémons"
- "filtre pokémons", "filtre por", "pokémons com"
- "detalhes do", "como é o" (when referring to a Pokémon)
- "traga mais" (in a Pokémon context)
- any Pokémon name or Pokédex number in context

**Skip:** questions not related to Pokémons or PokéAPI.
