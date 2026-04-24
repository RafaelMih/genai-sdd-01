# Revisao do Projeto

O projeto entrou em um estado mais maduro e operacional. Agora ele nao tem apenas SDD, traceabilidade e contexto curto: ele tambem opera com arquivamento de specs antigas, cache local de contexto, telemetria mais rica, policy de budget documentada e uma suite E2E enxuta para jornadas criticas.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run e2e`: passou com 3 testes
- `npm run context:report`: passou
- `npm run specs:archive`: executado e arquivou specs superseded

## Estado atual do projeto

Hoje o repositorio ja possui:

- specs versionadas por feature
- `TRACEABILITY.md` por feature
- `CONTEXT.md` canonico por feature
- working set ativo mais enxuto apos arquivamento real
- MCP proprio para recuperacao de specs e agente especializado
- loader de contexto com budget
- cache local de contexto
- telemetria de contexto com duracao, cache hit e budget warning
- checagem de cobertura de AC
- checagem de drift tecnico
- suite E2E para login, signup e logout
- instrucoes globais consolidadas

Isso coloca o projeto acima de um template de estudo. Ja existe um fluxo pratico para reduzir ambiguidade, tokens desperdicados e ruido historico no dia a dia.

## Tabela de conceitos

| Conceito                                    | Status atual       | Evidencia no projeto                                                     | Leitura pratica                                           |
| ------------------------------------------- | ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| Spec-Driven Development                     | Usado              | `CLAUDE.md`, `scripts/spec-lint.ts`                                      | Continua sendo a base do projeto                          |
| Specs versionadas por feature               | Usado              | `specs/features/*/spec-vX.Y.Z.md` e `specs/archive/*`                    | Evolucao controlada com historico separado                |
| Status gate (`Approved`)                    | Usado              | `scripts/spec-status.ts`                                                 | Implementacao protegida por aprovacao                     |
| Traceability AC -> codigo -> teste          | Usado              | `specs/features/*/TRACEABILITY.md`                                       | Convencao consistente e validada                          |
| Testes alinhados com AC                     | Usado              | `src/features/**/__tests__` + `TRACEABILITY.md`                          | Robusto e auditavel                                       |
| ADR                                         | Usado              | `specs/decisions/ADR-001-use-firebase.md`                                | Arquitetura formalizada                                   |
| Contratos tecnicos/documentais              | Usado              | specs tecnicas e contracts nas features                                  | Boa reducao de ambiguidade                                |
| MCP proprio                                 | Usado              | `mcp/spec-rag-mcp.ts`, `mcp/pokemon-mcp.ts`                              | Bom para estudo de agentes e ferramentas                  |
| RAG de specs por manifesto/chunks           | Usado              | `scripts/index-specs.ts`, `scripts/ai-context.ts`, `mcp/spec-rag-mcp.ts` | Esta enxuto, resumido e agora ignora arquivo historico    |
| Agente especializado                        | Usado              | `.claude/agents/pokemon-agent.md`                                        | Bom exemplo de agent-as-contract                          |
| Reconcile drift                             | Usado parcialmente | `.claude/skills/reconcile-drift/SKILL.md`                                | Skill alinhada ao contexto curto e ao working set ativo   |
| Pre-commit de governanca                    | Usado              | `scripts/precommit-spec.ts`                                              | Usa pipeline consolidado                                  |
| Cobertura automatica de AC por teste        | Usado              | `scripts/spec-ac-coverage.ts`, `spec:check`                              | Ja esta no pipeline principal                             |
| Deteccao automatica de drift tecnico        | Usado              | `scripts/spec-drift.ts`, `spec:check`                                    | Ja esta no pipeline principal                             |
| Budget de contexto                          | Usado              | `scripts/ai-context.ts`, `mcp/spec-rag-mcp.ts`                           | Ha limite por modo e warning nao bloqueante               |
| Resumo de specs sob demanda                 | Usado              | `mcp/spec-rag-mcp.ts` com `detail: "summary"` padrao                     | Reduz custo por request                                   |
| Resumo canonico por feature (`CONTEXT.md`)  | Usado              | `specs/features/*/CONTEXT.md`, `scripts/generate-feature-contexts.ts`    | Reduz leitura desnecessaria de specs longas               |
| Telemetria de custo de contexto             | Usado              | `.telemetry/context-usage.jsonl`, `scripts/context-telemetry-report.ts`  | Mede tokens estimados, duracao, cache hit e warnings      |
| Cache local de contexto                     | Usado              | `scripts/context-cache.ts`, `.telemetry/cache/context/`                  | Evita reprocessamento quando os arquivos nao mudam        |
| Consolidacao de instrucoes globais          | Usado              | `.claude/GLOBAL-STANDARDS.md`, `README.md`, `.claude/rules/*.md`         | Menos duplicacao entre docs globais                       |
| Estrategia para historico de specs          | Usado              | `specs/HISTORY.md`, `scripts/specs-archive.ts`, `specs/archive/*`        | Politica e execucao operacionalizadas                     |
| E2E real                                    | Usado              | `playwright.config.ts`, `e2e/auth-flows.spec.ts`                         | Cobertura enxuta para jornadas criticas                   |
| Politica formal de budget por tarefa        | Usado parcialmente | `README.md`, `.claude/GLOBAL-STANDARDS.md`, scripts de contexto          | Ha regra operacional, mas ainda sem enforcement por fluxo |
| Matriz realmente enxuta de active spec only | Usado              | `specs/archive/*`, loaders filtrando `archived`                          | O working set ativo ficou bem mais limpo                  |
| Cache semantico distribuido                 | Nao usado          | Cache atual e local por arquivo/mtime                                    | Pode evoluir depois se o projeto crescer                  |

## Sinais concretos de maturidade

1. O working set ativo encolheu de verdade apos mover specs superseded para `specs/archive/`.
2. O `spec:check` cobre lint, status, traceabilidade, cobertura e drift tecnico.
3. O fluxo de contexto ja gera cache hit e registra telemetria operacional.
4. As skills e docs passaram a tratar `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O produto agora tem validacao E2E minima para signup, login e logout.

## Estado atual do custo de contexto

Ja existe um ciclo funcional mais completo de controle:

- contexto curto por feature (`CONTEXT.md`)
- budget por modo (`summary`, `chunked`, `full`)
- warnings nao bloqueantes quando o budget recomendado e excedido
- cache local por feature, versao, modo e arquivos-fonte
- telemetria com duracao, cache hit, origem e tokens estimados
- relatorio consolidado via `npm run context:report`

Estado observado na ultima revalidacao:

- `npm run context:report` reportou 4 eventos
- Total registrado: 1143 tokens estimados
- Total servido: 36 chunks/documentos
- Cache hits: 1
- Budget warnings: 0
- Todas as chamadas recentes ficaram em modo `summary`/`chunked`, sem uso de `full`

Isso e um bom sinal: o projeto esta conseguindo reaproveitar contexto e operar com budget controlado sem depender de documentos completos.

## O que ainda merece atencao

1. A telemetria ainda pode crescer para incluir custo por sessao, por tarefa e por comando de ponta a ponta.
2. O cache atual e local e simples; ainda nao existe uma camada semantica mais inteligente.
3. A politica de budget ja existe, mas ainda funciona mais como orientacao do que como governanca forte.
4. O manifest historico ainda pode ficar mais automatizado para refletir todas as versoes arquivadas em todos os casos.

## Melhorias recomendadas agora

1. Evoluir a telemetria para correlacionar sessao, tarefa e feature com mais granularidade.
2. Refinar o arquivamento para manter manifest e changelog ainda mais sincronizados em cenarios edge-case.
3. Adicionar E2E para variacoes negativas relevantes, como erro de login e redirect de usuario autenticado.
4. Avaliar cache semantico ou reuse mais inteligente para features acessadas repetidamente.
5. Formalizar um budget por tipo de tarefa com metas explicitas para `summary`, `chunked` e `full`.

## Prioridade sugerida

1. Evoluir a telemetria de contexto para metricas mais operacionais.
2. Refinar o ciclo de cache/reuse de contexto.
3. Expandir E2E das jornadas criticas com cenarios negativos.
4. Fortalecer a automacao do historico e do manifest.
5. Fechar a governanca de budget por tipo de tarefa.
