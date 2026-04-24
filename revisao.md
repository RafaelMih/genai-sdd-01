# Revisao do Projeto

O projeto entrou em um estado mais maduro e operacional. Possui SDD, traceabilidade, controle de contexto, archivamento de specs antigas, cache local, telemetria, policy de budget documentada, hard block de tokens para `full` mode, pre-commit bloqueante e suite E2E com fluxos positivos e negativos.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou (lint + status + trace + coverage + drift)
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run e2e`: 9 testes (3 happy path + 3 fluxos negativos + 3 validações de formulário)
- `npm run context:report`: passou
- `npm run specs:archive`: executado e arquivou specs superseded

## Estado atual do projeto

Hoje o repositorio possui:

- 5 features ativas com specs Approved (auth v1.1.3, user-signup v1.2.1, user-logout v1.1.0, pokemon-list v1.0.0, pokemon-agent v1.0.0)
- Specs versionadas com semantica MAJOR.MINOR.PATCH + archive de 8 versoes supersedidas
- TRACEABILITY.md com 100% de cobertura (AC → modulo → teste) em todas as features
- CONTEXT.md gerado automaticamente para todas as features
- MCP proprio para recuperacao de specs (spec-rag) e acesso a PokéAPI (pokemon)
- Agente especializado (pokemon-agent) com TRIGGER/SKIP documentados
- Pipeline spec:check com 5 validacoes em sequencia
- Cache local de contexto com SHA256 por feature/versao/arquivos (inclui TRACEABILITY.md, TRACEABILITY-SUMMARY.md e changelog)
- Telemetria de contexto com eventos JSONL, relatorio por feature e por sessao (`CLAUDE_SESSION_ID`)
- Budget por modo: summary (1400t), chunked (900t/chunk, max 6), full (4000t soft / 6000t hard block em MCP e CLI)
- Suite E2E Playwright com 9 fluxos (signup, login, logout + 3 negativos + 3 validações de formulário)
- CI/CD com 3 workflows (guardrails, spec-quality, cd)
- 6 skills SDD registrados (review-spec, resolve-spec, edit-spec, implement-spec, generate-tests, reconcile-drift)
- Global standards em `.claude/GLOBAL-STANDARDS.md` com escalacao de contexto formalizada
- 3 ADRs: Firebase (ADR-001), MCP (ADR-002), SDD como processo (ADR-003)
- Pre-commit bloqueante registrado via `npm prepare`; executa spec:check + specs:archive
- Telemetria com sessionId por variavel `CLAUDE_SESSION_ID`; relatorio inclui breakdown por sessao
- TRACEABILITY-SUMMARY.md gerado automaticamente (so AC + modulo, sem casos de teste)
- TRACEABILITY-SUMMARY integrado ao contexto de IA (ai-context.ts e spec-rag-mcp.ts)

## Tabela de conceitos: ponto forte e ponto fraco

### Praticas em uso

| Conceito | Status | Ponto forte | Ponto fraco |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | Impede scope creep; spec e verificavel antes do codigo | Sobrecarga em features pequenas; friction em iteracoes rapidas |
| Specs versionadas + archive | Usado | Historico rastreavel; working set enxuto; specs:archive roda no pre-commit | Archive ainda nao dispara ao aprovar spec sem commit; CI nao executa archive |
| Status gate (Approved) | Usado | Bloqueia implementacao prematura; visivel no pipeline | Nao tem enforcement automatico no CI; so lint avisa, nao bloqueia commit |
| Traceability AC→codigo→teste | Usado | Auditavel; facilita refactor seguro; mapeamento granular | TRACEABILITY.md pode ficar desatualizado sem hook de validacao por feature individual |
| CONTEXT.md auto-gerado | Usado | Reduz tokens carregados; 100% cobertura em 5 features | Conteudo gerado pode incluir secoes irrelevantes para a tarefa atual |
| Context caching (SHA256) | Usado | Fingerprint inclui TRACEABILITY.md, TRACEABILITY-SUMMARY.md e changelog; evita reprocessamento | Base pequena (4 eventos) — insuficiente para validar eficacia real do hit rate |
| Context telemetria (JSONL) | Usado | sessionId por env `CLAUDE_SESSION_ID`; relatorio por sessao e por feature | sessionId anonimo por padrao; nao correlaciona tarefa ou comando Claude especifico |
| Budget por modo | Usado | summary 1400t, chunked 900t/chunk x6, full 4000t, hard block em 6000t em MCP e CLI | Budget `full` de 4000t nao e hard block — so 6000t dispara rejeicao |
| Pipeline spec:check | Usado | 5 validacoes encadeadas (lint+status+trace+coverage+drift); integrado no CI | Status gate nao bloqueia CI; spec pode divergir sem impedir merge |
| Drift detection (spec-drift.ts) | Usado | Detecta divergencia spec vs schema Firestore automaticamente | Escopo limitado: so valida Firestore write contracts, nao comportamento de UI ou rotas |
| AC coverage (spec-ac-coverage.ts) | Usado | Garante que todo AC tem ≥1 teste mapeado em TRACEABILITY | Valida referencia textual, nao execucao real dos testes |
| Testes unit + integration | Usado | 11 arquivos Vitest; ACs cobertos; validacao de erros de firebase | Falhas de env relatadas em CI (Firebase vars nao carregadas corretamente) |
| E2E Playwright (9 fluxos) | Usado | 3 happy path + 3 negativos + 3 validacoes de formulario (nome vazio, senha curta, senhas divergentes) | Validacoes de email invalido e telefone invalido nao cobertas por E2E |
| MCP spec-rag | Usado | Retrieval dinamico com summary/full; cache, telemetria e hard block integrados | Hit rate real desconhecida; sem metricas de precisao de retrieval |
| MCP pokemon | Usado | Abstracao limpa da PokéAPI; sem chamadas diretas no codigo da feature | Sem cache local das respostas da API — cada chamada busca na rede |
| Agente especializado (pokemon) | Usado | TRIGGER/SKIP documentados; agent-as-contract bem definido | Sem testes de integracao que validem o contrato do agente de ponta a ponta |
| ADRs (Firebase, MCP, SDD) | Usado | 3 decisoes formalizadas com contexto, decisao e consequencias | Decisao sobre pokemon-agent como padrao de agente nao foi formalizada |
| CI/CD (3 workflows) | Usado | guardrails, spec-quality e cd separados com responsabilidades claras | spec-quality.yml valida spec mas nao bloqueia merge se drift for detectado |
| Pre-commit spec hook | Usado | Registrado via `npm prepare`; executa spec:check + specs:archive a cada commit | Requer `npm install` para instalar o hook — novo clone sem install nao tem protecao |
| Lazy escalation de contexto | Usado | Cadeia CONTEXT → summary → chunked → full documentada e com limites explicitos | Sem enforcement automatico; depende de disciplina para nao pular etapas |
| TRACEABILITY-SUMMARY.md | Usado | AC + modulo apenas; integrado no contexto de IA; gerado pelo spec-doctor | Nao substitui TRACEABILITY.md completo para auditoria; precisa de re-geracao ao editar traceability |
| Telemetria por sessao | Usado | sessionId por `CLAUDE_SESSION_ID`; relatorio agrupa por sessao e por feature | sessionId ainda e anonimo por padrao; nao correlaciona com ID real da sessao do Claude |
| Organizacao por feature | Usado | Alta coesao por dominio; facil de deletar ou mover uma feature inteira | Utilitarios compartilhados (src/test/) sem organizacao clara entre features |
| Firebase modular SDK | Usado | Tree-shaking ativo; setup isolado em src/firebase | Sem ponto fraco identificado na implementacao atual |
| Zod validation | Usado | Schemas coerced no boundary do usuario; erros descritivos | signupSchema e authSchema tem validacao de email repetida sem compartilhamento |
| Global standards doc | Usado | Ponto unico de referencia; inclui tabela de budget e cadeia de escalacao | Pode ficar desatualizado se CLAUDE.md e rules/*.md divergirem com o tempo |
| Skills SDD (6 skills) | Usado | Operacoes SDD padronizadas: review, resolve, edit, implement, test, drift | Skills nao tem testes proprios para validar que produzem output correto e consistente |

### Praticas nao em uso

| Conceito | Status | Por que nao usar agora | Quando considerar |
| --- | --- | --- | --- |
| Cache semantico distribuido | Nao usado | Overkill para 5 features e uso individual | Se features crescerem para 20+ ou uso multi-usuario |
| Token tracking por requisicao (real) | Nao usado | Estimativa atual, nao valor real da API | Quando integracao direta com Anthropic API incluir resposta com usage metrics |
| ADR para pokemon-agent | Nao usado | Padrao de agente especializado nao foi formalizado como decisao | Quando o padrao for replicado para outros agentes |

## Economia de tokens

Praticas especificas para reduzir gasto de tokens, ordenadas por impacto:

| Pratica | Status | Impacto estimado | Situacao atual |
| --- | --- | --- | --- |
| CONTEXT.md como primeira camada | Aplicado | Alto — evita spec completa (~3000t) | Manter; auditar se CONTEXT.md atual esta abaixo de 500t por feature |
| Modo summary como padrao no MCP | Aplicado | Alto — 1400t vs spec completa | Padrao definido; budget documentado em GLOBAL-STANDARDS.md |
| Lazy escalation de contexto | Aplicado | Alto — carrega so o necessario | Formalizado: CONTEXT.md → summary → chunked → full com limites explicitos |
| Hard block em full mode | Aplicado | Alto — impede gastos acima de 6000t em MCP e CLI | Limite de 4000t e soft; so 6000t e hard block |
| TRACEABILITY-SUMMARY no contexto | Aplicado | Medio — reduz tokens vs TRACEABILITY completo; integrado ao contexto | Precisa de re-geracao manual apos editar TRACEABILITY.md (spec-doctor cuida disso) |
| Cache local por SHA256 | Aplicado | Medio — fingerprint inclui TRACEABILITY.md, TRACEABILITY-SUMMARY e changelog | Hit rate ainda com base pequena (4 eventos) |
| Chunked context loading (max 6) | Aplicado | Medio — reduzido de 8 para 6 chunks maximos | Scoring mais restritivo ao reduzir o limite |
| Archive automatico no pre-commit | Aplicado | Medio — specs:archive roda a cada commit | Ainda nao roda ao aprovar uma spec sem commit |
| Spec lint pre-retrieval | Nao aplicado | Medio | Rejeitar spec com TBD antes de envia-la ao LLM |
| Deduplicacao semantica | Nao aplicado | Alto potencial, alta complexidade | Nao prioritario agora |

### Regras de escalacao de contexto (lazy escalation)

Para qualquer tarefa, seguir esta ordem e parar quando tiver informacao suficiente:

1. **CONTEXT.md** — sempre primeiro; resume objetivo, escopo e ACs (~300-500t)
2. **summary mode** — quando CONTEXT.md nao for suficiente; retorna secoes-chave da spec (~1400t)
3. **chunked mode** — quando precisar de detalhes especificos; ~900t por chunk, max 6 chunks
4. **full mode** — apenas quando todos os outros modos falharem; 4000t max; hard block em 6000t

Nunca carregar `full` como primeiro passo. Nunca pular etapas.

## Sinais concretos de maturidade

1. O working set ativo encolheu de verdade apos mover specs superseded para `specs/archive/`.
2. O `spec:check` cobre lint, status, traceabilidade, cobertura e drift tecnico em sequencia.
3. O fluxo de contexto gera cache hit e registra telemetria operacional.
4. As skills e docs tratam `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O produto tem validacao E2E com happy path e fluxos negativos essenciais.
6. Toda feature ativa tem spec Approved + TRACEABILITY.md + CONTEXT.md + testes.
7. Budget de `full` mode tem hard block em 6000t implementado no MCP e no CLI (ai-context.ts).
8. Pre-commit bloqueante registrado via `npm prepare`; executa spec:check + specs:archive.
9. Decisoes arquiteturais de MCP e SDD formalizadas como ADR-002 e ADR-003.
10. TRACEABILITY-SUMMARY.md gerado para as 5 features e integrado ao contexto de IA.
11. Telemetria com sessionId configuravel e relatorio com breakdown por sessao.

## Estado atual do custo de contexto

Ciclo funcional de controle implementado:

- contexto curto por feature (CONTEXT.md)
- budget por modo: summary 1400t, chunked 900t/chunk x6, full 4000t soft / 6000t hard block em MCP e CLI
- cache local por feature, versao, modo e arquivos-fonte (SHA256) — inclui TRACEABILITY.md, TRACEABILITY-SUMMARY.md e changelog
- telemetria com duracao, cache hit, origem e tokens estimados
- relatorio consolidado via `npm run context:report`

Estado observado na ultima revalidacao:

- `npm run context:report` reportou 4 eventos
- Total registrado: 1143 tokens estimados
- Total servido: 36 chunks/documentos
- Cache hits: 1 de 2 invocacoes relevantes (50% hit rate)
- Budget warnings: 0
- Todas as chamadas recentes em modo `summary`/`chunked`

Ponto de atencao: base de apenas 4 eventos e insuficiente para validar eficacia real do cache. A ampliacao do fingerprint (TRACEABILITY.md + TRACEABILITY-SUMMARY.md + changelog) pode reduzir hit rate temporariamente — cache antigo sera invalidado; hit rate real precisa de base maior.

## O que ainda merece atencao

1. **Pre-commit requer npm install** — clone novo sem `npm install` nao tem o hook registrado; CI nao e afetado.
2. **Drift detection limitado ao schema Firestore** — comportamento de UI, rotas e integracao com MCP nao sao verificados.
3. **sessionId ainda anonimo por padrao** — `CLAUDE_SESSION_ID` nao e preenchido automaticamente; correlacao real requer configuracao manual ou hook.
4. **Cache com base pequena** — 4 eventos e pouco para validar eficacia real; a ampliacao do fingerprint pode reduzir hit rate temporariamente.
5. **TRACEABILITY-SUMMARY nao e regenerado automaticamente fora do spec-doctor** — se TRACEABILITY.md for editado sem rodar spec-doctor, o summary fica defasado.

## Melhorias recomendadas por impacto

### Ja implementado

- [x] Hard block em `full` mode (6000t) no spec-rag-mcp.ts e ai-context.ts
- [x] Lazy escalation formalizada em GLOBAL-STANDARDS.md com tabela de budget
- [x] ADR-002 (MCP) e ADR-003 (SDD como processo)
- [x] E2E para fluxos negativos (login invalido, email duplicado, acesso sem auth)
- [x] E2E para validacoes de formulario (nome vazio, senha curta, senhas divergentes)
- [x] Cache ampliado (TRACEABILITY.md + TRACEABILITY-SUMMARY.md + changelog no fingerprint)
- [x] MAX_CONTEXT_CHUNKS reduzido de 8 para 6
- [x] Pre-commit registrado via `npm prepare`; executa spec:check + specs:archive
- [x] Telemetria com sessionId por env var `CLAUDE_SESSION_ID`; relatorio por sessao
- [x] TRACEABILITY-SUMMARY.md gerado para as 5 features; integrado ao contexto de IA

### Pendente

1. **sessionId automatico** — popular `CLAUDE_SESSION_ID` via hook do Claude ou script wrapper.
2. **Drift detection de UI e rotas** — ampliar spec-drift.ts alem do schema Firestore.
3. **Metricas de precisao do RAG** — registrar se o chunk retornado foi util ou ignorado.
4. **Spec lint pre-retrieval** — rejeitar spec com TBD antes de envia-la ao LLM.

## Prioridade sugerida

1. Configurar `CLAUDE_SESSION_ID` automatico via hook ou wrapper (fechar a correlacao de telemetria).
2. Ampliar drift detection para comportamento de UI e rotas.
3. Spec lint pre-retrieval para evitar envio de specs com TBD ao LLM.
4. Metricas de precisao do RAG para medir utilidade dos chunks retornados.
