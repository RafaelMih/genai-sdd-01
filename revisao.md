# Revisao do Projeto

O projeto está em um estado bem mais maduro do que nas revisões anteriores. A base continua forte em SDD, traceabilidade e testes, e agora também há mais coerência entre processo, automação, contexto curto e governança de custo. Os principais avanços já implementados foram: convenção única de `TRACEABILITY.md`, `CONTEXT.md` canônico por feature, retorno resumido por padrão no MCP de specs, checagem de cobertura de AC, checagem automática de drift técnico, telemetria básica de contexto e consolidação das instruções globais.

## Revalidação atual do repositório

- `npm run spec:check`: passou
- `npm run spec:lint`: passou sem warnings
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run context:generate`: passou
- `npm run context:report`: passou

## Tabela de conceitos

| Conceito | Status atual | Evidência no projeto | Leitura prática |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | `CLAUDE.md`, `scripts/spec-lint.ts` | Continua sendo a base do projeto |
| Specs versionadas por feature | Usado | `auth` com 5 versões, `user-signup` com 4 | Evolução controlada e auditável |
| Status gate (`Approved`) | Usado | `scripts/spec-status.ts` | Implementação protegida por aprovação |
| Traceability AC -> código -> teste | Usado | `specs/features/*/TRACEABILITY.md` | Convenção consistente e validada |
| Testes alinhados com AC | Usado | `src/features/**/__tests__` + `TRACEABILITY.md` | Robusto e auditável |
| ADR | Usado | `specs/decisions/ADR-001-use-firebase.md` | Decisão arquitetural formalizada |
| Contratos técnicos/documentais | Usado | specs técnicas, contracts nas features | Boa redução de ambiguidade |
| MCP próprio | Usado | `mcp/spec-rag-mcp.ts`, `mcp/pokemon-mcp.ts` | Bom para estudo de agentes e ferramentas |
| RAG de specs por manifesto/chunks | Usado | `scripts/index-specs.ts`, `scripts/ai-context.ts`, `mcp/spec-rag-mcp.ts` | Agora está enxuto, reindexado e com contexto curto |
| Agente especializado | Usado | `.claude/agents/pokemon-agent.md` | Bom exemplo de agent-as-contract |
| Reconcile drift | Usado parcialmente | `.claude/skills/reconcile-drift/SKILL.md` | Skill existe, mas ainda pode ganhar automação dedicada |
| Pré-commit de governança | Usado | `scripts/precommit-spec.ts` | Usa o pipeline consolidado |
| Cobertura automática de AC por teste | Usado | `scripts/spec-ac-coverage.ts`, `spec:check` | Já está no pipeline principal |
| Detecção automática de drift técnico | Usado | `scripts/spec-drift.ts`, `spec:check` | Já está no pipeline principal |
| Budget de contexto | Usado | `scripts/ai-context.ts` | Há limite de chunks e tokens no loader |
| Resumo de specs sob demanda | Usado | `mcp/spec-rag-mcp.ts` com `detail: "summary"` padrão | Melhora custo por request |
| Resumo canônico por feature (`CONTEXT.md`) | Usado | `specs/features/*/CONTEXT.md`, `scripts/generate-feature-contexts.ts` | Reduz leitura desnecessária de specs longas |
| Telemetria de custo de contexto | Usado parcialmente | `.telemetry/context-usage.jsonl`, `scripts/context-telemetry-report.ts` | Já mede eventos, tokens estimados e volume servido |
| Consolidação de instruções globais | Usado | `.claude/GLOBAL-STANDARDS.md`, `README.md`, `.claude/rules/*.md` | Menos duplicação entre docs globais |
| Estratégia para histórico de specs | Usado | `specs/HISTORY.md` | Há uma política explícita para arquivamento |
| E2E real | Não usado | Specs citam E2E, mas não há suite E2E | Validação segue em unit e integration |
| Cache de contexto ou prompt caching explícito | Não usado | Não há camada clara de cache semântico | Oportunidade de economia adicional |
| Orquestração por budget de tokens por tarefa | Não usado plenamente | Há budget e telemetria, mas ainda não há política de bloqueio por custo | Falta fechar o ciclo de governança |
| Matriz realmente enxuta de active spec only | Usado parcialmente | Há filtro por feature e dependências, mas as versões antigas ainda coexistem | Melhorou, mas ainda pode ficar mais rígido |

## O que melhorou nesta rodada

1. As specs ativas foram reescritas para remover ambiguidades de AC, e o `spec:lint` passou sem warnings.
2. Foram criados `CONTEXT.md` canônicos por feature, com geração automatizada via `npm run context:generate`.
3. O `ai:context` e o `spec-rag-mcp` agora usam `CONTEXT.md` como camada curta de contexto antes de expandir para specs maiores.
4. Foi adicionada telemetria básica de custo de contexto com armazenamento em `.telemetry/context-usage.jsonl`.
5. Foi adicionado um relatório operacional com `npm run context:report`.
6. As instruções globais foram consolidadas em `.claude/GLOBAL-STANDARDS.md`, e o `README.md` foi simplificado para apontar às fontes canônicas.
7. Foi registrada uma estratégia de arquivamento para specs antigas em `specs/HISTORY.md`.

## Estado atual do custo de contexto

Já existe um primeiro ciclo funcional de controle:

- contexto curto por feature (`CONTEXT.md`)
- budget no loader de chunks
- modo resumido por padrão no MCP
- telemetria de uso
- relatório de consumo estimado

Exemplo validado nesta rodada:

- `npm run ai:context auth` executado com sucesso
- `npm run context:report` reportou 2 eventos
- Total registrado: 533 tokens estimados e 18 chunks/documentos servidos

Isso já permite começar a observar padrão de uso real, em vez de otimizar contexto só por intuição.

## O que ainda merece atenção

1. O projeto ainda não possui E2E real para jornadas críticas.
2. A telemetria atual mede volume estimado, mas ainda não mede duração por etapa nem custo por usuário/tarefa.
3. As versões antigas de specs continuam convivendo nas pastas ativas; a estratégia de histórico já existe, mas ainda não foi operacionalizada.
4. Ainda não há cache semântico explícito ou política de reutilização de contexto entre tarefas parecidas.

## Melhorias recomendadas agora

1. Operacionalizar o arquivamento das specs antigas mais estáveis para `specs/archive/`.
2. Expandir a telemetria para incluir duração, feature, modo (`summary`, `full`, `chunked`) e talvez comando de origem em relatórios agregados.
3. Adicionar uma pequena suíte E2E para pelo menos login, signup e logout.
4. Avaliar cache de contexto para features acessadas repetidamente.
5. Considerar uma política formal de budget por tarefa, por exemplo limite de contexto por modo de execução.

## Prioridade sugerida

1. Arquivar specs antigas superseded mais estáveis.
2. Evoluir a telemetria de contexto para métricas mais operacionais.
3. Adicionar E2E das jornadas críticas.
4. Avaliar cache semântico e reuse de contexto.
5. Formalizar budget por tarefa no workflow.
