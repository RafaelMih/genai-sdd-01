# Revisao do Projeto

O projeto está em um estado consistente e já entrega um fluxo real de estudo para GenAI com SDD. A base está forte em specs versionadas, traceabilidade, testes, contexto curto por feature, validações automáticas e governança mínima de custo de contexto. O trabalho recente consolidou o projeto em torno de uma ideia mais clara: usar specs como contrato principal e reduzir o custo cognitivo da IA com contexto curto, retrieval resumido e validações de drift.

## Revalidação atual do repositório

- `npm run spec:check`: passou
- `npm run spec:lint`: passou sem warnings
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run context:report`: passou

## Estado atual do projeto

Hoje o repositório já possui:

- specs versionadas por feature
- `TRACEABILITY.md` por feature
- `CONTEXT.md` canônico por feature
- MCP próprio para recuperação de specs e agente especializado
- loader de contexto com budget
- telemetria básica de contexto
- checagem de cobertura de AC
- checagem de drift técnico
- instruções globais consolidadas

Isso coloca o projeto acima de um simples “template com boas intenções”. Já existe um fluxo operacional que ajuda a reduzir ambiguidade e tokens desperdiçados.

## Tabela de conceitos

| Conceito | Status atual | Evidência no projeto | Leitura prática |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | `CLAUDE.md`, `scripts/spec-lint.ts` | É a espinha dorsal do projeto |
| Specs versionadas por feature | Usado | `specs/features/*/spec-vX.Y.Z.md` | Evolução controlada e auditável |
| Status gate (`Approved`) | Usado | `scripts/spec-status.ts` | Implementação protegida por aprovação |
| Traceability AC -> código -> teste | Usado | `specs/features/*/TRACEABILITY.md` | Convenção consistente e validada |
| Testes alinhados com AC | Usado | `src/features/**/__tests__` + `TRACEABILITY.md` | Robusto e auditável |
| ADR | Usado | `specs/decisions/ADR-001-use-firebase.md` | Arquitetura formalizada |
| Contratos técnicos/documentais | Usado | specs técnicas e contracts nas features | Boa redução de ambiguidade |
| MCP próprio | Usado | `mcp/spec-rag-mcp.ts`, `mcp/pokemon-mcp.ts` | Bom para estudo de agentes e ferramentas |
| RAG de specs por manifesto/chunks | Usado | `scripts/index-specs.ts`, `scripts/ai-context.ts`, `mcp/spec-rag-mcp.ts` | Está enxuto, resumido e reindexado |
| Agente especializado | Usado | `.claude/agents/pokemon-agent.md` | Bom exemplo de agent-as-contract |
| Reconcile drift | Usado parcialmente | `.claude/skills/reconcile-drift/SKILL.md` | Skill atualizada para `CONTEXT.md`, mas ainda sem automação dedicada |
| Pré-commit de governança | Usado | `scripts/precommit-spec.ts` | Usa pipeline consolidado |
| Cobertura automática de AC por teste | Usado | `scripts/spec-ac-coverage.ts`, `spec:check` | Já está no pipeline principal |
| Detecção automática de drift técnico | Usado | `scripts/spec-drift.ts`, `spec:check` | Já está no pipeline principal |
| Budget de contexto | Usado | `scripts/ai-context.ts` | Há limite de chunks e tokens |
| Resumo de specs sob demanda | Usado | `mcp/spec-rag-mcp.ts` com `detail: "summary"` padrão | Reduz custo por request |
| Resumo canônico por feature (`CONTEXT.md`) | Usado | `specs/features/*/CONTEXT.md`, `scripts/generate-feature-contexts.ts` | Reduz leitura desnecessária de specs longas |
| Telemetria de custo de contexto | Usado parcialmente | `.telemetry/context-usage.jsonl`, `scripts/context-telemetry-report.ts` | Mede eventos, tokens estimados e volume servido |
| Consolidação de instruções globais | Usado | `.claude/GLOBAL-STANDARDS.md`, `README.md`, `.claude/rules/*.md` | Menos duplicação entre docs globais |
| Estratégia para histórico de specs | Usado | `specs/HISTORY.md` | Há política explícita para arquivamento |
| E2E real | Não usado | Não há suíte E2E no repositório | Ainda é uma lacuna relevante |
| Cache de contexto ou prompt caching explícito | Não usado | Não há camada de cache semântico | Oportunidade de economia adicional |
| Política formal de budget por tarefa | Não usado plenamente | Há budget e telemetria, mas não regra operacional por fluxo | Falta fechar o ciclo de governança |
| Matriz realmente enxuta de active spec only | Usado parcialmente | Ainda coexistem muitas versões no diretório ativo | Melhorou, mas ainda pode ficar mais rígido |

## Sinais concretos de maturidade

1. O `spec:lint` passou sem warnings, o que reduz bastante interpretação extra da IA.
2. O `spec:check` já cobre lint, status, traceabilidade, cobertura de AC e drift técnico.
3. As skills passaram a tratar `CONTEXT.md` como primeira camada de contexto.
4. O produto agora tem uma separação mais saudável entre contexto curto (`CONTEXT.md`) e contexto detalhado (spec completa).
5. A telemetria já está funcional e mostra uso real do fluxo de contexto.

## Estado atual do custo de contexto

Já existe um primeiro ciclo funcional de controle:

- contexto curto por feature (`CONTEXT.md`)
- budget no loader de chunks
- modo resumido por padrão no MCP
- telemetria de uso
- relatório de consumo estimado

Estado observado na última revalidação:

- `npm run context:report` reportou 2 eventos
- Total registrado: 533 tokens estimados
- Total servido: 18 chunks/documentos
- Todas as chamadas registradas até agora foram em modo resumido/chunked, sem uso de `full`

Isso é um bom sinal: o projeto já está conseguindo operar sem depender de contexto completo por padrão.

## O que ainda merece atenção

1. O projeto ainda não possui E2E real para jornadas críticas.
2. A telemetria atual mede volume estimado, mas ainda não mede duração por etapa, origem da tarefa ou custo por fluxo.
3. As versões antigas de specs continuam convivendo nas pastas ativas; a estratégia de histórico existe, mas ainda não foi operacionalizada.
4. Ainda não há cache semântico explícito ou política de reutilização de contexto entre tarefas parecidas.

## Melhorias recomendadas agora

1. Operacionalizar o arquivamento das specs antigas mais estáveis para `specs/archive/`.
2. Expandir a telemetria para incluir duração, modo, origem do comando e talvez feature por sessão.
3. Adicionar uma pequena suíte E2E para pelo menos login, signup e logout.
4. Avaliar cache de contexto para features acessadas repetidamente.
5. Definir uma política formal de budget por tarefa ou por modo de execução.

## Prioridade sugerida

1. Arquivar specs antigas superseded mais estáveis.
2. Evoluir a telemetria de contexto para métricas mais operacionais.
3. Adicionar E2E das jornadas críticas.
4. Avaliar cache semântico e reuse de contexto.
5. Formalizar budget por tarefa no workflow.
