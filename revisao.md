# Revisao do Projeto

O projeto está em um estado melhor do que na revisão anterior. A base continua forte em SDD, traceabilidade e testes, e agora há mais coerência entre processo, automação e custo de contexto. Os principais ajustes estruturais já implementados foram: convenção única de `TRACEABILITY.md`, contexto com budget em `ai-context`, retorno resumido por padrão no MCP de specs, checagem de cobertura de AC e checagem automática de drift técnico.

Revalidação atual do repositório:

- `npm run spec:check`: passou
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `spec:lint`: continua passando com warnings, mas sem blockers

O principal problema agora não é mais inconsistência grosseira do fluxo. O maior foco restante é reduzir ambiguidade nas specs, especialmente nos acceptance criteria, porque isso ainda gera custo cognitivo desnecessário para a IA.

## Tabela de conceitos

| Conceito | Status atual | Evidência no projeto | Leitura prática |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | `CLAUDE.md`, `scripts/spec-lint.ts` | Continua sendo a base do projeto |
| Specs versionadas por feature | Usado | `auth` com 5 versões, `user-signup` com 4 | Evolução controlada e auditável |
| Status gate (`Approved`) | Usado | `scripts/spec-status.ts` | Implementação protegida por aprovação |
| Traceability AC -> código -> teste | Usado | `specs/features/*/TRACEABILITY.md` | Convenção agora está mais consistente |
| Testes alinhados com AC | Usado | `src/features/**/__tests__` + `TRACEABILITY.md` | Robusto e auditável |
| ADR | Usado | `specs/decisions/ADR-001-use-firebase.md` | Decisão arquitetural formalizada |
| Contratos técnicos/documentais | Usado | specs técnicas, contracts nas features | Boa redução de ambiguidade |
| MCP próprio | Usado | `mcp/spec-rag-mcp.ts`, `mcp/pokemon-mcp.ts` | Bom para estudo de agentes e ferramentas |
| RAG de specs por manifesto/chunks | Usado | `scripts/index-specs.ts`, `scripts/ai-context.ts`, `mcp/spec-rag-mcp.ts` | Agora está mais enxuto e focado |
| Agente especializado | Usado | `.claude/agents/pokemon-agent.md` | Bom exemplo de agent-as-contract |
| Reconcile drift | Usado parcialmente | `.claude/skills/reconcile-drift/SKILL.md` | Skill existe, mas a prática ainda pode crescer |
| Pré-commit de governança | Usado | `scripts/precommit-spec.ts` | Agora usa o check consolidado |
| Cobertura automática de AC por teste | Usado | `scripts/spec-ac-coverage.ts`, `spec:check` | Já está no pipeline principal |
| Detecção automática de drift técnico | Usado | `scripts/spec-drift.ts`, `spec:check` | Já está no pipeline principal |
| Budget de contexto | Usado parcialmente | `scripts/ai-context.ts` | Há limite de chunks e tokens, mas ainda sem telemetria completa |
| Resumo de specs sob demanda | Usado | `mcp/spec-rag-mcp.ts` com `detail: "summary"` padrão | Melhora custo por request |
| E2E real | Não usado | Specs citam E2E, mas não há suite E2E | Validação segue em unit e integration |
| Avaliação e observabilidade de prompts | Não usado | Não há logs nem métricas por request | Ainda falta medir custo real |
| Cache de contexto ou prompt caching explícito | Não usado | Não há camada clara de cache semântico | Oportunidade de economia adicional |
| Resumo canônico por feature (`CONTEXT.md`) | Não usado | Não há briefs curtos persistidos por feature | Ainda depende de specs maiores |
| Orquestração por budget de tokens por tarefa | Não usado plenamente | Há budget no loader, mas não governança por fluxo | Falta fechar o ciclo de custo |
| Matriz realmente enxuta de active spec only | Usado parcialmente | Há filtro por feature e dependências, mas coexistem muitas versões | Melhorou, mas ainda pode ficar mais rígido |

## O que melhorou desde a revisão anterior

1. O `spec:check` agora está mais robusto e cobre lint, status, traceabilidade, cobertura de AC e drift técnico.
2. O `spec-rag-mcp` não retorna mais conteúdo completo por padrão; ele já trabalha em modo resumido.
3. O `ai-context` passou a operar com budget explícito de chunks e tokens.
4. A convenção de traceability ficou unificada em `specs/features/<feature>/TRACEABILITY.md`.
5. O drift técnico de `user-signup` com o campo `phone` foi corrigido no schema.

## Onde ainda há desperdício de tokens

1. Os acceptance criteria ainda têm muitos warnings de observabilidade e contexto implícito. Isso continua sendo a principal fonte de interpretação extra pela IA.
2. Ainda existe redundância entre `README`, `CLAUDE.md`, regras em `.claude/rules`, skills e specs.
3. O projeto já tem resumo dinâmico de contexto, mas ainda não tem um resumo canônico persistido por feature, como um `CONTEXT.md`.
4. O budget de contexto existe no carregador, mas ainda não há telemetria de uso real por tarefa.
5. A convivência de muitas versões antigas de specs continua aumentando a superfície cognitiva do repositório, mesmo com filtros melhores.

## Warnings atuais mais importantes

Os warnings do `spec:lint` se concentram principalmente em:

- ACs sem gatilho explícito (`when`, `on submit`, `if`, `after`, `ao montar`, etc.)
- ACs com comportamento observável ainda pouco binário
- ACs que são claros para leitura humana, mas não totalmente operacionais para automação

As features mais afetadas continuam sendo:

- `auth`
- `user-signup`
- `user-logout`
- `pokemon-list`
- `pokemon-agent`

## Melhorias recomendadas agora

1. Reescrever os ACs com gatilho explícito e resultado observável binário.
2. Criar um `CONTEXT.md` por feature para servir como briefing curto e estável.
3. Consolidar regras globais para reduzir duplicação entre arquivos de instrução.
4. Adicionar telemetria simples por tarefa: feature carregada, chunks usados, tokens estimados e duração.
5. Avaliar se vale manter todas as versões antigas no mesmo fluxo de trabalho ativo ou se parte delas deve virar arquivo histórico menos visível.

## Prioridade sugerida

1. Corrigir os warnings do `spec:lint` nas specs ativas.
2. Criar resumos canônicos por feature (`CONTEXT.md`).
3. Adicionar telemetria de custo de contexto.
4. Consolidar instruções globais redundantes.
5. Avaliar uma estratégia de arquivo histórico para specs antigas.
