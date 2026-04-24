# Revisao do Projeto

O projeto esta em um estado bem mais maduro e operacional. Hoje ele combina SDD, traceabilidade, controle de contexto, archive de specs antigas, cache local, telemetria, policy de budget documentada, hard block para `full` mode, pre-commit bloqueante e uma suite E2E enxuta para jornadas criticas.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run e2e`: passou com 3 testes
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
- pipeline `spec:check` com 5 validacoes: lint, status, trace, coverage e drift
- cache local de contexto com fingerprint por arquivos-fonte
- telemetria de contexto em JSONL com relatorio por feature e por sessao
- budgets por modo: `summary`, `chunked` e `full`, com hard block em 6000 tokens para `full`
- suite E2E Playwright para signup, login e logout
- pre-commit instalado via `npm prepare`, executando `spec:check` e `specs:archive`
- 3 ADRs: Firebase, MCP e SDD como processo

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
| Pipeline `spec:check` | Usado | Verifica 5 guardrails de uma vez | Nao cobre drift de UI ou rotas |
| Drift detection | Usado | Detecta divergencia de contratos Firestore | Escopo ainda limitado ao schema/write contract |
| AC coverage | Usado | Garante que todo AC esta mapeado | Nao prova execucao real do teste, so referencia |
| Unit + integration tests | Usado | Cobertura solida para as features atuais | Continua separado do teste de regras do Firestore |
| E2E Playwright | Usado | Valida jornadas criticas reais | Ainda e pequeno: 3 fluxos apenas |
| MCP spec-rag | Usado | Retrieval com summary/full, cache, telemetria e hard block | Ainda sem metricas de utilidade dos chunks |
| MCP pokemon | Usado | Encapsula o acesso a Pokemon de forma limpa | Ainda sem cache proprio da API |
| Agente especializado | Usado | Contrato do agente esta documentado | Ainda sem testes de integracao do contrato do agente |
| ADRs | Usado | Decisoes principais formalizadas | Ainda nao existe ADR para padrao de agente especializado |
| Pre-commit spec hook | Usado | Bloqueia commit com `spec:check` + `specs:archive` | Requer `npm install` para estar ativo em clone novo |
| Lazy escalation de contexto | Usado | `CONTEXT` -> `summary` -> `chunked` -> `full` | Enforcement ainda depende do tooling e da disciplina |
| `TRACEABILITY-SUMMARY.md` | Usado | Reduz custo de contexto vs traceability completo | Nao substitui auditoria detalhada do `TRACEABILITY.md` |
| Telemetria por sessao | Usado | Suporta `CLAUDE_SESSION_ID` e breakdown por sessao | Quando a env nao e preenchida, cai em id anonimo |
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
| Metricas de precisao do RAG | Nao usado | Ainda nao ha feedback loop sobre utilidade dos chunks | Quando quiser otimizar retrieval com dados reais |
| ADR para pokemon-agent | Nao usado | O padrao de agente ainda nao virou decisao formal | Quando houver mais agentes com o mesmo modelo |

## Economia de tokens

Praticas de maior impacto hoje:

| Pratica | Status | Impacto | Situacao atual |
| --- | --- | --- | --- |
| `CONTEXT.md` como primeira camada | Aplicado | Alto | Continua sendo a entrada preferencial |
| `summary` como padrao no MCP | Aplicado | Alto | Budget documentado e retrieval curto por padrao |
| Lazy escalation | Aplicado | Alto | Fluxo formalizado em docs e skills |
| Hard block em `full` | Aplicado | Alto | Rejeita acima de 6000 tokens em CLI e MCP |
| `TRACEABILITY-SUMMARY` no contexto | Aplicado | Medio | Reduz custo vs traceability completo |
| Cache local por fingerprint | Aplicado | Medio | Inclui spec, contexto, traceability, summary e changelog |
| `chunked` mais restritivo | Aplicado | Medio | `MAX_CONTEXT_CHUNKS = 6` |
| Archive do working set | Aplicado | Medio | Specs antigas sairam das pastas ativas |
| Spec lint pre-retrieval | Nao aplicado | Medio | Seria util para bloquear TBD antes do LLM |

### Regras de escalacao de contexto

1. `CONTEXT.md`
2. `summary`
3. `chunked`
4. `full`

`full` nunca deve ser o primeiro passo.

## Sinais concretos de maturidade

1. O working set ativo diminuiu de verdade apos o archive das versoes superseded.
2. O `spec:check` cobre os guardrails principais do fluxo SDD.
3. O contexto ja gera cache hit e registra telemetria operacional.
4. As skills e docs tratam `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O projeto tem validacao E2E real para signup, login e logout.
6. O pipeline de regras do Firestore voltou a funcionar com `vitest.rules.config.ts`.
7. O pre-commit bloqueante ja instala e roda o fluxo principal de governanca.

## Estado atual do custo de contexto

Ciclo funcional implementado:

- contexto curto por feature
- budget por modo
- cache local por feature, versao, modo e arquivos-fonte
- telemetria com duracao, cache hit, origem e tokens estimados
- relatorio consolidado via `npm run context:report`

Estado observado na ultima revalidacao:

- `Events`: 4
- `Estimated tokens`: 1143
- `Chunks/documents served`: 36
- `Cache hits`: 1
- `Budget warnings`: 0
- Uso recente apenas em `summary`/`chunked`, sem `full`

Ponto de atencao: a base de eventos ainda e pequena para tirar conclusoes fortes sobre hit rate.

## O que ainda merece atencao

1. `CLAUDE_SESSION_ID` ainda nao e preenchido automaticamente em todo fluxo.
2. O drift detection ainda nao cobre UI, rotas ou comportamento de navegacao.
3. A suite E2E cobre o essencial, mas ainda nao cobre variacoes negativas mais amplas.
4. O cache funciona, mas ainda falta volume real para medir eficacia.
5. `TRACEABILITY-SUMMARY.md` depende de regeneracao quando o traceability muda.

## Melhorias recomendadas

1. Automatizar o preenchimento de `CLAUDE_SESSION_ID`.
2. Ampliar `spec-drift.ts` para UI e rotas.
3. Adicionar spec lint pre-retrieval para bloquear `TBD`.
4. Medir utilidade real do RAG com sinal de feedback sobre chunks.
5. Expandir E2E com casos negativos adicionais.

## Prioridade sugerida

1. Session id automatico na telemetria.
2. Drift detection alem do Firestore.
3. Spec lint pre-retrieval.
4. Metricas de precisao do RAG.
