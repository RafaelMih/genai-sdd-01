# ADR-004 - Specialized Agent Pattern

## Status

Accepted

## Context

Some features require an AI agent that operates autonomously over an external API or a domain-specific tool, rather than being driven step-by-step by the user. Without a formal pattern, each such agent is defined ad-hoc: trigger conditions are implicit, tool contracts are embedded in prompts, output format is undocumented, and there is no way to audit whether the agent follows its own spec.

The `pokemon-agent` was the first instance of this need: a self-contained conversational agent that lists, paginates, filters, and details Pokémons exclusively via a dedicated MCP server, with explicit trigger conditions, output format, and error handling.

## Decision

A specialized agent in this project follows this pattern:

**1. Agent definition file** — `.claude/agents/<name>.md`

- YAML frontmatter with `name` and `description`
- `description` must include trigger phrases (when to activate) and skip conditions (when not to activate)
- Body contains: spec reference, available MCP tools, numbered flows (one per AC group), and absolute rules

**2. Dedicated MCP server** — `mcp/<name>-mcp.ts`

- Exposes only the tools the agent needs; no general-purpose tools
- Registered in the workspace agent configuration
- The agent never calls external APIs directly — only through the MCP tools

**3. Feature spec** — `specs/features/<name>/spec-v*.md`

- Follows the standard SDD spec format (Status: Approved, ACs, tests section)
- Is the authoritative source for the agent's behavior; the agent definition file is a derived artifact

**4. Flows, not a general prompt**

- The agent definition file describes concrete numbered flows (e.g., "Fluxo 1 — Listagem", "Fluxo 2 — Paginação")
- Each flow maps to one or more ACs from the spec
- Flows include step-by-step instructions and concrete output format examples

**5. Absolute rules section**

- No data invention: if the tool fails, the agent reports the error in the user's language
- No scope creep: out-of-scope requests are explicitly rejected with a message
- Output language matches the project's language standard (pt-BR)

## Consequences

- Agent behavior is auditable: the agent definition file and the spec are both versioned and traceability is maintained
- Adding a new specialized agent requires: a new spec, a new (or extended) MCP server, and a new agent file — never just a prompt change
- The separation between agent file (derived) and spec (authoritative) prevents behavioral drift when the spec evolves
- Trigger/skip conditions in the description allow the orchestrating model to route correctly without prompt engineering
- Integration tests for the agent contract are not yet automated; this remains an open gap
