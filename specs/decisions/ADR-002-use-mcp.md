# ADR-002 - Use MCP for Tooling

## Status

Accepted

## Context

The project needs a structured way for AI agents to access specs, external APIs, and project data without embedding tool logic in prompts or feature code. Ad-hoc tool calls inside prompts are unversioned, untestable, and leak implementation details into the conversation context.

## Decision

Use the Model Context Protocol (MCP) to expose project-specific tools as typed, versioned server tools. Each MCP server is scoped to one responsibility:

- `spec-rag-mcp.ts` — spec retrieval with summary/full modes, cache, and telemetry
- `pokemon-mcp.ts` — PokéAPI access (list, detail) without direct HTTP calls in feature code

MCP servers are registered in `.claude/settings.json` and invoked by agents and skills.

## Consequences

- AI agents get structured, cacheable access to specs and external data
- Tool contracts are explicit: input schema, output format, and error paths are defined
- Adding a new capability requires a new registered MCP tool, not a prompt change
- Adds runtime dependency on `@modelcontextprotocol/sdk`
- MCP servers must be started separately (`npm run mcp:spec`, `npm run mcp:pokemon`)
