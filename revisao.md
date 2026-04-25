# Revisao do Projeto

O projeto esta em um estado bem mais maduro e operacional. Hoje ele combina SDD, traceabilidade, controle de contexto, archive de specs antigas, cache local, telemetria, policy de budget documentada, hard block para `full` mode, pre-commit bloqueante, suite E2E enxuta, pipeline de CI remoto com gate de governance, e verificacao automatizada de idioma do agente.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou (6 validacoes)
- `npm run typecheck`: passou (sem erros, incluindo `pokemon-agent.lang.test.ts` com `/// <reference types="node" />`)
- `npm run test`: passou com 13 arquivos e 91 testes
- `npm run e2e`: passou com 13 testes
- `npm run test:rules`: passou
- `npm run context:report`: passou
- `npm run governance`: passou
- `npm run skill:lint`: passou
- `npm run agent:lang-check`: passou

## Estado atual do projeto

Hoje o repositorio possui:

- 5 features ativas com spec no working set: `auth`, `user-signup`, `user-logout`, `pokemon-list`, `pokemon-agent`
- archive operacional em `specs/archive/` para versoes superseded
- `TRACEABILITY.md` por feature
- `CONTEXT.md` por feature
- `TRACEABILITY-SUMMARY.md` regenerado automaticamente no pre-commit e integrado ao contexto
- MCP proprio para recuperacao de specs (`spec-rag`) e para Pokemon (`pokemon`)
- agente especializado em `.claude/agents/pokemon-agent.md`
- pipeline `spec:check` com 6 validacoes: lint, status, trace, coverage, drift (Firestore) e drift-ui (rotas + redirects)
- cache local de contexto com fingerprint por arquivos-fonte
- telemetria de contexto em JSONL com relatorio por feature, por sessao e com feedback de RAG
- budgets por modo: `summary`, `chunked` e `full`, com hard block em 6000 tokens para `full`
- suite E2E Playwright com 13 testes: auth (fluxos positivos e negativos) e pokemon-list (erro de rede, loading, filtro, limpeza de filtro)
- pre-commit instalado via `npm prepare`, executando `spec:check`, `traceability:generate` e `specs:archive`
- 4 ADRs: Firebase, MCP, SDD como processo e padrao de agente especializado
- spec lint pre-retrieval: bloqueia TBD em `ai-context` e `spec-rag-mcp` antes de servir contexto
- session ID persistido em `.telemetry/.session` com TTL de 8h, sem necessidade de env manual
- feedback de RAG via `npm run rag:feedback`: registra `up`/`down` por invocacao com relatorio integrado
- testes de contrato do `pokemon-agent` em `pokemon-agent.contract.test.ts` cobrindo AC1-AC5
- testes de linguagem do `pokemon-agent` em `pokemon-agent.lang.test.ts`: heuristica de deteccao de idioma + mandato pt-BR do arquivo de definicao
- `mcp/pokemon-service.ts` extraido e testavel independentemente do servidor MCP
- `npm run governance`: script de CI independente para regenerar summaries e arquivar specs
- `npm run skill:lint`: valida frontmatter, secoes H2, referencias a ACs e secao de outputs em skills e agentes
- `npm run agent:lang-check`: verifica mandato de idioma em arquivos de agente e detecta blocos de exemplo em ingles
- `scripts/detect-language.ts`: heuristica de deteccao de idioma (pt-BR / en / unknown) por frequencia de palavras marcadoras
- pipeline de CI remoto em `.github/workflows/`: `ci.yml` (push) e `spec-quality.yml` (PR para main) rodando `spec:check` + `skill:lint` + governance gate
- drift detection para rotas dinamicas com normalizacao `:param` e WARN para `navigate(route)` sem replace sem cobertura de spec

## Tabela de conceitos

### Praticas em uso

| Conceito                           | Status | Ponto forte                                                                                                           | Ponto fraco                                                                          |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Spec-Driven Development            | Usado  | Reduz ambiguidade e scope creep                                                                                       | Tem overhead em features pequenas                                                    |
| Specs versionadas + archive        | Usado  | Historico rastreavel com working set mais enxuto                                                                      | Sem ADR dedicado para estrategia de CI/CD                                            |
| Status gate (`Approved`)           | Usado  | Aprovacao explicita antes de implementar                                                                              | Ainda nao e um bloqueio dedicado no CI fora do `spec:check`                          |
| Traceability AC -> codigo -> teste | Usado  | Facilita auditoria e refactor seguro                                                                                  | Continua dependente de manutencao disciplinada                                       |
| `CONTEXT.md` auto-gerado           | Usado  | Reduz tokens e acelera implementacao                                                                                  | Pode carregar secoes que nao sao uteis para toda tarefa                              |
| Cache local de contexto            | Usado  | Evita reprocessamento quando os arquivos nao mudam                                                                    | Base de telemetria ainda pequena para medir hit rate real                            |
| Telemetria de contexto             | Usado  | Registra tokens estimados, duracao, cache hit e sessao                                                                | Ainda nao correlaciona tarefa de negocio ou comando do Claude                        |
| Budget por modo                    | Usado  | Retrieval tem limites claros e hard block em `full`                                                                   | O budget de 4000 em `full` ainda e soft; hard block so em 6000                       |
| Pipeline `spec:check`              | Usado  | Verifica 6 guardrails de uma vez, incluindo drift de rotas dinamicas e redirects                                      | Extracao de rotas/redirects dos specs e baseada em texto; falsos negativos possiveis |
| Drift detection Firestore          | Usado  | Detecta divergencia de contratos Firestore                                                                            | Escopo limitado ao schema/write contract                                             |
| Drift detection UI/rotas           | Usado  | Detecta rotas estaticas e dinamicas; WARN para navigate sem replace sem cobertura                                     | Extracao por regex; nao cobre navegacao programatica complexa                        |
| Spec lint pre-retrieval            | Usado  | Bloqueia TBD antes de servir contexto ao LLM                                                                          | Cobre apenas BLOCKER markers; nao faz lint completo                                  |
| Session ID automatico              | Usado  | Persiste sessao por 8h em `.telemetry/.session` sem env manual                                                        | TTL fixo; nao detecta troca de contexto dentro da janela                             |
| Feedback de RAG                    | Usado  | Registra utilidade dos chunks por invocacao com relatorio integrado                                                   | Requer acao manual do desenvolvedor para avaliar                                     |
| AC coverage                        | Usado  | Garante que todo AC esta mapeado                                                                                      | Nao prova execucao real do teste, so referencia                                      |
| Unit + integration tests           | Usado  | 91 testes cobrindo todas as 5 features, incluindo contrato e idioma do agente                                         | AC5 verificacao real do output do LLM ainda e manual                                 |
| E2E Playwright                     | Usado  | 13 testes cobrindo auth e pokemon-list, incluindo casos negativos                                                     | Ainda sem E2E de browser para o agente pokemon (agente nao tem UI propria)           |
| MCP spec-rag                       | Usado  | Retrieval com summary/full, cache, telemetria e hard block                                                            | Base de feedback ainda pequena para otimizar retrieval                               |
| MCP pokemon                        | Usado  | Encapsula o acesso a Pokemon; `pokemon-service.ts` e testavel independentemente                                       | Ainda sem cache proprio da API                                                       |
| Agente especializado               | Usado  | Contrato documentado, padrao em ADR-004 e testes de contrato AC1-AC5                                                  | AC5 verificacao do output real do LLM requer execucao manual                         |
| ADRs                               | Usado  | 4 decisoes formalizadas, incluindo padrao de agente especializado                                                     | Sem ADR para estrategia de CI/CD                                                     |
| Pre-commit spec hook               | Usado  | Bloqueia commit com `spec:check` + `traceability:generate` + `specs:archive`                                          | Requer `npm install` para estar ativo em clone novo                                  |
| Lazy escalation de contexto        | Usado  | `CONTEXT` -> `summary` -> `chunked` -> `full`                                                                         | Enforcement ainda depende do tooling e da disciplina                                 |
| `TRACEABILITY-SUMMARY.md`          | Usado  | Regenerado automaticamente no pre-commit e via `governance`; reduz custo de contexto                                  | Nao substitui auditoria detalhada do `TRACEABILITY.md`                               |
| Telemetria por sessao              | Usado  | Session ID automatico com TTL de 8h e breakdown por sessao                                                            | TTL fixo; sessoes longas podem acumular eventos de contextos diferentes              |
| Organizacao por feature            | Usado  | Alta coesao por dominio                                                                                               | Ainda ha utilitarios compartilhados fora das features                                |
| Firebase modular SDK               | Usado  | Setup isolado e compativel com tree-shaking                                                                           | Sem fragilidade relevante no estado atual                                            |
| Zod validation                     | Usado  | Boundary de entrada bem definido                                                                                      | Ainda existe repeticao simples entre schemas                                         |
| Global standards doc               | Usado  | Fonte unica para budget e escalacao                                                                                   | Pode divergir de outros docs se nao for mantido                                      |
| Skills SDD                         | Usado  | Padronizam review, edit, resolve, implement e drift; validadas por `skill:lint` com AC refs e outputs                 | Skill:lint valida estrutura mas nao comportamento das skills                         |
| Script `governance`                | Usado  | `npm run governance` roda `traceability:generate` + `specs:archive`; gate no CI detecta summaries desatualizados      | Governance no CI valida que pode rodar, nao que o output e correto                   |
| `skill:lint`                       | Usado  | Valida frontmatter, H2, referencias a ACs e secao de outputs em skills e agentes                                      | Valida estrutura; nao verifica comportamento ou cobertura real dos ACs               |
| Pipeline de CI remoto              | Usado  | `ci.yml` (push) e `spec-quality.yml` (PR) rodam `spec:check` + `skill:lint` + governance gate                         | Sem gate de PR dedicado para `agent:lang-check`; CD depende de secrets do Firebase   |
| Verificacao de idioma do agente    | Usado  | `agent:lang-check` verifica mandato pt-BR no arquivo de definicao; `detectLanguage` heuristica para blocos de exemplo | Verifica declaracao, nao o output real do LLM; heuristica pode ter imprecisoes       |
| Deteccao de rotas dinamicas        | Usado  | Normalizacao `:param` em `spec-drift-ui`; WARN para navigate sem replace sem cobertura                                | WARN, nao BLOCKER; navigate programatico complexo pode nao ser detectado             |

### Praticas nao em uso

| Conceito                          | Status    | Por que nao usar agora                                | Quando considerar                                    |
| --------------------------------- | --------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Cache semantico distribuido       | Nao usado | Overkill para o tamanho atual do repo                 | Se crescer para mais features ou uso multiusuario    |
| Token tracking real por API       | Nao usado | O projeto mede estimativa, nao usage real do provider | Quando houver integracao direta com uso real da API  |
| Verificacao de output real do LLM | Nao usado | Requer execucao do agente em ambiente controlado      | Quando houver infraestrutura de teste de agentes LLM |

## Economia de tokens

Praticas de maior impacto hoje:

| Pratica                            | Status   | Impacto | Situacao atual                                              |
| ---------------------------------- | -------- | ------- | ----------------------------------------------------------- |
| `CONTEXT.md` como primeira camada  | Aplicado | Alto    | Continua sendo a entrada preferencial                       |
| `summary` como padrao no MCP       | Aplicado | Alto    | Budget documentado e retrieval curto por padrao             |
| Lazy escalation                    | Aplicado | Alto    | Fluxo formalizado em docs e skills                          |
| Hard block em `full`               | Aplicado | Alto    | Rejeita acima de 6000 tokens em CLI e MCP                   |
| Spec lint pre-retrieval            | Aplicado | Medio   | Bloqueia TBD antes do LLM em `ai-context` e `spec-rag-mcp`  |
| `TRACEABILITY-SUMMARY` no contexto | Aplicado | Medio   | Regenerado automaticamente no pre-commit e via `governance` |
| Cache local por fingerprint        | Aplicado | Medio   | Inclui spec, contexto, traceability, summary e changelog    |
| `chunked` mais restritivo          | Aplicado | Medio   | `MAX_CONTEXT_CHUNKS = 6`                                    |
| Archive do working set             | Aplicado | Medio   | Specs antigas sairam das pastas ativas                      |

### Regras de escalacao de contexto

1. `CONTEXT.md`
2. `summary`
3. `chunked`
4. `full`

`full` nunca deve ser o primeiro passo.

## Sinais concretos de maturidade

1. O working set ativo diminuiu de verdade apos o archive das versoes superseded.
2. O `spec:check` cobre 6 guardrails do fluxo SDD, incluindo drift de rotas dinamicas e redirects.
3. O contexto ja gera cache hit e registra telemetria operacional com session ID automatico.
4. As skills e docs tratam `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O projeto tem validacao E2E real para 13 fluxos, cobrindo auth e pokemon-list com casos negativos.
6. O pipeline de regras do Firestore voltou a funcionar com `vitest.rules.config.ts`.
7. O pre-commit bloqueante roda `spec:check`, regenera summaries e arquiva specs obsoletas em todo commit.
8. TBD em specs e bloqueado antes de chegar ao LLM via lint pre-retrieval.
9. Feedback de RAG registravel por invocacao com relatorio consolidado no `context:report`.
10. O padrao de agente especializado esta formalizado em ADR-004 com estrutura replicavel.
11. O contrato do agente `pokemon-agent` tem 91 testes automatizados (AC1-AC5 contrato + linguagem), com o service MCP testavel isoladamente.
12. Skills e agentes em `.claude/` sao validados por `skill:lint` incluindo referencias a ACs e secao de outputs.
13. `npm run governance` permite rodar a governanca de specs de forma independente do pre-commit.
14. Pipeline de CI remoto em `.github/workflows/` com `spec:check`, `skill:lint` e governance gate em push e PR.
15. `agent:lang-check` verifica que todo agente declara mandato de idioma explicitamente; `detectLanguage` detecta blocos de exemplo em ingles.
16. Drift detection normaliza rotas dinamicas (`:param`) e emite WARN para `navigate()` sem replace sem cobertura de spec.

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

1. `agent:lang-check` verifica que o arquivo de agente DECLARA pt-BR, mas nao executa o agente para validar o output real do LLM — verificacao manual permanece necessaria para confirmar o comportamento efetivo.
2. Feedback de RAG requer acao manual; nao ha coleta automatica de sinal de utilidade.
3. `skill:lint` estendido valida AC refs e outputs na estrutura, mas nao verifica se os ACs referenciados existem na spec ou se os outputs sao coerentes com o contrato.
4. Governance gate no CI verifica stale via `git status`, mas e sensivel a arquivos gerados em runtime (ex: `.telemetry/`) que podem aparecer como untracked.
5. WARN para `navigate()` sem replace sem cobertura de spec pode gerar ruido se a rota ja estiver coberta de outra forma na spec mas sem a expressao literal.

## Melhorias recomendadas

1. Executar o agente em ambiente controlado e verificar automaticamente o idioma do output retornado (ex: teste de integracao com MCP real + `detectLanguage`).
2. Ampliar `skill:lint` para cruzar AC refs da skill com os ACs listados na spec da feature correspondente.
3. Tornar o governance gate no CI robusto contra arquivos de runtime (ex: usar `.gitignore` para excluir `.telemetry/` do status check).
4. Explorar coleta automatica de sinal de feedback de RAG (ex: via hook pos-implementacao).
5. Criar ADR para estrategia de CI/CD documentando o fluxo push → spec:check → PR → spec-quality → merge → CD.

## Prioridade sugerida

1. Robustecer governance gate no CI contra arquivos de runtime (`.telemetry/` no `.gitignore`).
2. ADR para estrategia de CI/CD.
3. Teste de integracao de idioma com MCP real.
4. `skill:lint` com cruzamento de AC refs vs spec.
