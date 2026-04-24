# Revisao do Projeto

O projeto esta em um estado bem mais maduro e operacional. Hoje ele combina SDD, traceabilidade, controle de contexto, archive de specs antigas, cache local, telemetria, policy de budget documentada, hard block para `full` mode, pre-commit bloqueante e uma suite E2E enxuta para jornadas criticas.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou (6 validacoes)
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run e2e`: passou com 9 testes
- `npm run test:rules`: passou
- `npm run context:report`: passou
- `npm run specs:archive`: executado e arquivou specs superseded

## Estado atual do projeto

Hoje o repositorio possui:

- 5 features ativas com spec no working set: `auth`, `user-signup`, `user-logout`, `pokemon-list`, `pokemon-agent`
- archive operacional em `specs/archive/` para versoes superseded
- `TRACEABILITY.md` por feature
- `CONTEXT.md` por feature
- `TRACEABILITY-SUMMARY.md` gerado por script e integrado ao contexto
- MCP proprio para recuperacao de specs (`spec-rag`) e para Pokemon (`pokemon`)
- agente especializado em `.claude/agents/pokemon-agent.md`
- pipeline `spec:check` com 6 validacoes: lint, status, trace, coverage, drift (Firestore) e drift-ui (rotas)
- cache local de contexto com fingerprint por arquivos-fonte
- telemetria de contexto em JSONL com relatorio por feature, por sessao e com feedback de RAG
- budgets por modo: `summary`, `chunked` e `full`, com hard block em 6000 tokens para `full`
- suite E2E Playwright com 9 testes cobrindo fluxos positivos e negativos de auth
- pre-commit instalado via `npm prepare`, executando `spec:check` e `specs:archive`
- 3 ADRs: Firebase, MCP e SDD como processo
- spec lint pre-retrieval: bloqueia TBD em `ai-context` e `spec-rag-mcp` antes de servir contexto
- session ID persistido em `.telemetry/.session` com TTL de 8h, sem necessidade de env manual
- feedback de RAG via `npm run rag:feedback`: registra `up`/`down` por invocacao com relatorio integrado

## Tabela de conceitos

### Praticas em uso

| Conceito | Status | Ponto forte | Ponto fraco |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | Reduz ambiguidade e scope creep | Tem overhead em features pequenas |
| Specs versionadas + archive | Usado | Historico rastreavel com working set mais enxuto | CI ainda nao roda `specs:archive` por conta propria |
| Status gate (`Approved`) | Usado | Aprovacao explicita antes de implementar | Ainda nao e um bloqueio dedicado no CI fora do `spec:check` |
| Traceability AC -> codigo -> teste | Usado | Facilita auditoria e refactor seguro | Continua dependente de manutencao disciplinada |
| `CONTEXT.md` auto-gerado | Usado | Reduz tokens e acelera implementacao | Pode carregar secoes que nao sao uteis para toda tarefa |
| Cache local de contexto | Usado | Evita reprocessamento quando os arquivos nao mudam | Base de telemetria ainda pequena para medir hit rate real |
| Telemetria de contexto | Usado | Registra tokens estimados, duracao, cache hit e sessao | Ainda nao correlaciona tarefa de negocio ou comando do Claude |
| Budget por modo | Usado | Retrieval tem limites claros e hard block em `full` | O budget de 4000 em `full` ainda e soft; hard block so em 6000 |
| Pipeline `spec:check` | Usado | Verifica 6 guardrails de uma vez (incluindo drift de UI) | Drift de UI nao cobre comportamento de navegacao, so registro de rotas |
| Drift detection Firestore | Usado | Detecta divergencia de contratos Firestore | Escopo limitado ao schema/write contract |
| Drift detection UI/rotas | Usado | Detecta rotas declaradas nos specs ausentes no codigo | Extracao de rotas dos specs e baseada em texto; falsos negativos possiveis |
| Spec lint pre-retrieval | Usado | Bloqueia TBD antes de servir contexto ao LLM | Cobre apenas BLOCKER markers; nao faz lint completo |
| Session ID automatico | Usado | Persiste sessao por 8h em `.telemetry/.session` sem env manual | TTL fixo; nao detecta troca de contexto dentro da janela |
| Feedback de RAG | Usado | Registra utilidade dos chunks por invocacao com relatorio integrado | Requer acao manual do desenvolvedor para avaliar |
| AC coverage | Usado | Garante que todo AC esta mapeado | Nao prova execucao real do teste, so referencia |
| Unit + integration tests | Usado | Cobertura solida para as features atuais | Continua separado do teste de regras do Firestore |
| E2E Playwright | Usado | 9 testes cobrindo fluxos positivos e negativos de auth | Ainda nao cobre variacoes negativas de pokemon-list |
| MCP spec-rag | Usado | Retrieval com summary/full, cache, telemetria e hard block | Base de feedback ainda pequena para otimizar retrieval |
| MCP pokemon | Usado | Encapsula o acesso a Pokemon de forma limpa | Ainda sem cache proprio da API |
| Agente especializado | Usado | Contrato do agente esta documentado | Ainda sem testes de integracao do contrato do agente |
| ADRs | Usado | Decisoes principais formalizadas | Ainda nao existe ADR para padrao de agente especializado |
| Pre-commit spec hook | Usado | Bloqueia commit com `spec:check` + `specs:archive` | Requer `npm install` para estar ativo em clone novo |
| Lazy escalation de contexto | Usado | `CONTEXT` -> `summary` -> `chunked` -> `full` | Enforcement ainda depende do tooling e da disciplina |
| `TRACEABILITY-SUMMARY.md` | Usado | Reduz custo de contexto vs traceability completo | Nao substitui auditoria detalhada do `TRACEABILITY.md` |
| Telemetria por sessao | Usado | Session ID automatico com TTL de 8h e breakdown por sessao | TTL fixo; sessoes longas podem acumular eventos de contextos diferentes |
| Organizacao por feature | Usado | Alta coesao por dominio | Ainda ha utilitarios compartilhados fora das features |
| Firebase modular SDK | Usado | Setup isolado e compativel com tree-shaking | Sem fragilidade relevante no estado atual |
| Zod validation | Usado | Boundary de entrada bem definido | Ainda existe repeticao simples entre schemas |
| Global standards doc | Usado | Fonte unica para budget e escalacao | Pode divergir de outros docs se nao for mantido |
| Skills SDD | Usado | Padronizam review, edit, resolve, implement e drift | Ainda sem testes proprios das skills |

### Praticas nao em uso

| Conceito | Status | Por que nao usar agora | Quando considerar |
| --- | --- | --- | --- |
| Cache semantico distribuido | Nao usado | Overkill para o tamanho atual do repo | Se crescer para mais features ou uso multiusuario |
| Token tracking real por API | Nao usado | O projeto mede estimativa, nao usage real do provider | Quando houver integracao direta com uso real da API |
| ADR para pokemon-agent | Nao usado | O padrao de agente ainda nao virou decisao formal | Quando houver mais agentes com o mesmo modelo |

## Economia de tokens

Praticas de maior impacto hoje:

| Pratica | Status | Impacto | Situacao atual |
| --- | --- | --- | --- |
| `CONTEXT.md` como primeira camada | Aplicado | Alto | Continua sendo a entrada preferencial |
| `summary` como padrao no MCP | Aplicado | Alto | Budget documentado e retrieval curto por padrao |
| Lazy escalation | Aplicado | Alto | Fluxo formalizado em docs e skills |
| Hard block em `full` | Aplicado | Alto | Rejeita acima de 6000 tokens em CLI e MCP |
| Spec lint pre-retrieval | Aplicado | Medio | Bloqueia TBD antes do LLM em `ai-context` e `spec-rag-mcp` |
| `TRACEABILITY-SUMMARY` no contexto | Aplicado | Medio | Reduz custo vs traceability completo |
| Cache local por fingerprint | Aplicado | Medio | Inclui spec, contexto, traceability, summary e changelog |
| `chunked` mais restritivo | Aplicado | Medio | `MAX_CONTEXT_CHUNKS = 6` |
| Archive do working set | Aplicado | Medio | Specs antigas sairam das pastas ativas |

### Regras de escalacao de contexto

1. `CONTEXT.md`
2. `summary`
3. `chunked`
4. `full`

`full` nunca deve ser o primeiro passo.

## Sinais concretos de maturidade

1. O working set ativo diminuiu de verdade apos o archive das versoes superseded.
2. O `spec:check` cobre 6 guardrails do fluxo SDD, incluindo drift de UI/rotas.
3. O contexto ja gera cache hit e registra telemetria operacional com session ID automatico.
4. As skills e docs tratam `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O projeto tem validacao E2E real para 9 fluxos de auth, incluindo casos negativos.
6. O pipeline de regras do Firestore voltou a funcionar com `vitest.rules.config.ts`.
7. O pre-commit bloqueante ja instala e roda o fluxo principal de governanca.
8. TBD em specs e bloqueado antes de chegar ao LLM via lint pre-retrieval.
9. Feedback de RAG registravel por invocacao com relatorio consolidado no `context:report`.

## Estado atual do custo de contexto

Ciclo funcional implementado:

- contexto curto por feature
- budget por modo
- cache local por feature, versao, modo e arquivos-fonte
- telemetria com duracao, cache hit, origem e tokens estimados
- session ID automatico com TTL de 8h
- feedback de RAG por invocacao com taxa de aprovacao por feature
- relatorio consolidado via `npm run context:report`

Estado observado na ultima revalidacao:

- `Events`: 4
- `Estimated tokens`: 1143
- `Chunks/documents served`: 36
- `Cache hits`: 1
- `Budget warnings`: 0
- Uso recente apenas em `summary`/`chunked`, sem `full`
- `Feedback`: 0 avaliacoes registradas (base ainda a ser preenchida)

Ponto de atencao: a base de eventos ainda e pequena para tirar conclusoes fortes sobre hit rate e utilidade dos chunks.

## O que ainda merece atencao

1. Drift detection nao cobre comportamento de navegacao (apenas registro de rotas).
2. `TRACEABILITY-SUMMARY.md` depende de regeneracao quando o traceability muda.
3. Feedback de RAG requer acao manual; nao ha coleta automatica de sinal de utilidade.
4. A suite E2E nao cobre variacoes negativas de `pokemon-list`.
5. ADR para padrao de agente especializado ainda nao existe.

## Melhorias recomendadas

1. Adicionar regeneracao automatica do `TRACEABILITY-SUMMARY.md` no pre-commit.
2. Ampliar drift detection para comportamento de navegacao (redirects declarados nos specs).
3. Expandir E2E com casos negativos de `pokemon-list` (sem rede, lista vazia).
4. Formalizar ADR para o padrao de agente especializado.
5. Criar testes de integracao do contrato do agente `pokemon-agent`.

## Prioridade sugerida

1. Regeneracao automatica do `TRACEABILITY-SUMMARY.md` no pre-commit.
2. Drift de comportamento de navegacao (redirects).
3. E2E negativo para `pokemon-list`.
4. ADR para agente especializado.
