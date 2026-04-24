# Revisao do Projeto

O projeto entrou em um estado mais maduro e operacional. Possui SDD, traceabilidade, controle de contexto, archivamento de specs antigas, cache local, telemetria, policy de budget documentada e suite E2E enxuta para jornadas criticas.

## Revalidacao atual do repositorio

- `npm run spec:check`: passou (lint + status + trace + coverage + drift)
- `npm run typecheck`: passou
- `npm run test`: passou com 11 arquivos e 68 testes
- `npm run e2e`: passou com 3 testes
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
- Cache local de contexto com SHA256 por feature/versao/arquivos
- Telemetria de contexto com eventos JSONL e relatorio consolidado
- Budget por modo: summary (~900t), chunked, full
- Suite E2E Playwright com 3 fluxos criticos de auth
- CI/CD com 3 workflows (guardrails, spec-quality, cd)
- 6 skills SDD registrados (review-spec, resolve-spec, edit-spec, implement-spec, generate-tests, reconcile-drift)
- Global standards em `.claude/GLOBAL-STANDARDS.md` e regras por dominio em `.claude/rules/`

## Tabela de conceitos: ponto forte e ponto fraco

### Praticas em uso

| Conceito | Status | Ponto forte | Ponto fraco |
| --- | --- | --- | --- |
| Spec-Driven Development | Usado | Impede scope creep; spec e verificavel antes do codigo | Sobrecarga em features pequenas; friction em iteracoes rapidas |
| Specs versionadas + archive | Usado | Historico rastreavel; working set enxuto apos arquivo | Archive e manual — pode ficar defasado se nao rodado regularmente |
| Status gate (Approved) | Usado | Bloqueia implementacao prematura; visivel no pipeline | Nao tem enforcement automatico no CI; so lint avisa, nao bloqueia commit |
| Traceability AC→codigo→teste | Usado | Auditavel; facilita refactor seguro; mapeamento granular | TRACEABILITY.md pode ficar desatualizado sem hook de validacao por feature individual |
| CONTEXT.md auto-gerado | Usado | Reduz tokens carregados; 100% cobertura em 5 features | Conteudo gerado pode incluir secoes irrelevantes para a tarefa atual |
| Context caching (SHA256) | Usado | Evita reprocessamento; fingerprint por feature/versao/arquivos | Base pequena (4 eventos, hit rate 50%) — insuficiente para validar eficacia real |
| Context telemetria (JSONL) | Usado | Visibilidade de custo por feature; relatorio consolidado | Baixa granularidade: sem correlacao com sessao, tarefa ou comando especifico |
| Budget por modo | Usado | summary ~900t bem definido; modos distintos (summary/chunked/full) | Budget de `full` nao esta definido explicitamente; warning nao bloqueia nada |
| Pipeline spec:check | Usado | 5 validacoes encadeadas (lint+status+trace+coverage+drift); integrado no CI | Pre-commit e informativo; nao impede commit se validacao falhar |
| Drift detection (spec-drift.ts) | Usado | Detecta divergencia spec vs schema Firestore automaticamente | Escopo limitado: so valida Firestore write contracts, nao comportamento de UI ou rotas |
| AC coverage (spec-ac-coverage.ts) | Usado | Garante que todo AC tem ≥1 teste mapeado em TRACEABILITY | Valida referencia textual, nao execucao real dos testes |
| Testes unit + integration | Usado | 11 arquivos Vitest; ACs cobertos; validacao de erros de firebase | Falhas de env relatadas em CI (Firebase vars nao carregadas corretamente) |
| E2E Playwright (3 fluxos) | Usado | Cobertura de jornadas criticas de auth (signup, login, logout) | Apenas happy path; zero cobertura de fluxos negativos (login invalido, redirect de autenticado) |
| MCP spec-rag | Usado | Retrieval dinamico com modo summary/full; cache e telemetria integrados | Hit rate real desconhecida; sem metricas de precisao de retrieval |
| MCP pokemon | Usado | Abstracao limpa da PokéAPI; sem chamadas diretas no codigo da feature | Sem cache local das respostas da API — cada chamada busca na rede |
| Agente especializado (pokemon) | Usado | TRIGGER/SKIP documentados; agent-as-contract bem definido | Sem testes de integracao que validem o contrato do agente de ponta a ponta |
| ADR-001 Firebase | Usado | Decisao documentada com consequencias e trade-offs | So 1 ADR para 5 features; decisoes sobre MCP e SDD nao foram formalizadas |
| CI/CD (3 workflows) | Usado | guardrails, spec-quality e cd separados com responsabilidades claras | spec-quality.yml valida spec mas nao bloqueia merge se drift for detectado |
| Pre-commit spec hook | Usado | Avisa sobre mudancas na spec antes do commit | Informativo apenas; nao impede commit com spec inconsistente |
| Organizacao por feature | Usado | Alta coesao por dominio; facil de deletar ou mover uma feature inteira | Utilitarios compartilhados (src/test/) sem organizacao clara entre features |
| Firebase modular SDK | Usado | Tree-shaking ativo; setup isolado em src/firebase | Sem ponto fraco identificado na implementacao atual |
| Zod validation | Usado | Schemas coerced no boundary do usuario; erros descritivos | signupSchema e authSchema tem validacao de email repetida sem compartilhamento |
| Global standards doc | Usado | Ponto unico de referencia para regras de processo e arquitetura | Pode ficar desatualizado se CLAUDE.md e rules/*.md divergirem com o tempo |
| Skills SDD (6 skills) | Usado | Operacoes SDD padronizadas: review, resolve, edit, implement, test, drift | Skills nao tem testes proprios para validar que produzem output correto e consistente |
| Budget warning (nao-bloqueante) | Usado | Nao interrompe o fluxo de trabalho do desenvolvedor | Warning sem consequencia vira ruido; nao cria pressao real para otimizar |

### Praticas nao em uso

| Conceito | Status | Por que nao usar agora | Quando considerar |
| --- | --- | --- | --- |
| Cache semantico distribuido | Nao usado | Overkill para 5 features e uso individual | Se features crescerem para 20+ ou uso multi-usuario |
| Enforcement de budget (hard block) | Nao usado | Troca flexibilidade por rigidez antes de ter baseline estabelecido | Quando custo real for monitorado e baseline documentado |
| E2E para fluxos negativos | Nao usado | Escopo atual focado em happy path de auth | Proximo ciclo: login invalido, redirect de autenticado, signup com email duplicado |
| Telemetria por sessao/tarefa | Nao usado | Infra atual agrega so por feature | Quando correlacao sessao→custo for necessaria para otimizacao real |
| Archiving automatico com trigger | Nao usado | specs:archive e manual; sem automacao no pipeline | Quando features ultrapassarem 3 versoes com frequencia alta |
| ADRs para MCP e SDD | Nao usado | Decisoes existem mas nao foram formalizadas como ADR | Agora: ADR-002 para adocao de MCP e ADR-003 para SDD como processo |
| Token tracking por requisicao (real) | Nao usado | Estimativa atual, nao valor real da API | Quando integracao direta com Anthropic API incluir resposta com usage metrics |

## Economia de tokens

Praticas especificas para reduzir gasto de tokens, ordenadas por impacto:

| Pratica | Status | Impacto estimado | Acao recomendada |
| --- | --- | --- | --- |
| CONTEXT.md como primeira camada | Aplicado | Alto — evita spec completa (~3000t) | Manter; auditar se CONTEXT.md atual esta abaixo de 500t por feature |
| Modo summary como padrao no MCP | Aplicado | Alto — 900t vs spec completa | Manter; definir explicitamente budget de `full` (sugestao: 3000t max) |
| Lazy escalation de contexto | Parcial | Alto — carrega so o necessario | Formalizar a cadeia: CONTEXT.md → summary → chunked → full (nunca pular etapas) |
| Cache local por SHA256 | Aplicado | Medio — 50% hit rate atual | Ampliar escopo: incluir TRACEABILITY.md e changelog no cache |
| Archive de specs antigas | Aplicado | Medio — RAG ignora archivados | Automatizar trigger ao aprovar nova versao de spec |
| Chunked context loading (max 8) | Aplicado | Medio — limita tokens por request | Reduzir para 6 chunks maximos; tornar scoring mais restritivo |
| Budget warning | Aplicado (nao bloqueia) | Baixo — warning sem acao | Converter em soft block com sugestao automatica do modo mais eficiente |
| Spec lint pre-retrieval | Nao aplicado | Medio | Rejeitar spec com TBD ou ambiguidade antes de envia-la ao LLM |
| TRACEABILITY resumido no contexto | Nao aplicado | Medio — TRACEABILITY completo e verboso | Criar TRACEABILITY-SUMMARY com so ACs e arquivos, sem casos de teste detalhados |
| Deduplicacao semantica | Nao aplicado | Alto potencial, alta complexidade | Nao prioritario agora |

### Regras de escalacao de contexto (lazy escalation)

Para qualquer tarefa, seguir esta ordem e parar quando tiver informacao suficiente:

1. **CONTEXT.md** — sempre primeiro; resume objetivo, escopo e ACs (~300-500t)
2. **summary mode** — quando CONTEXT.md nao for suficiente; retorna secoes-chave da spec (~900t)
3. **chunked mode** — quando precisar de detalhes especificos; carrega secoes relevantes (~900t por chunk, max 6)
4. **full mode** — apenas quando todos os outros modos falharem; custo alto, usar com justificativa explicita

Nunca carregar `full` como primeiro passo. Nunca pular etapas.

## Sinais concretos de maturidade

1. O working set ativo encolheu de verdade apos mover specs superseded para `specs/archive/`.
2. O `spec:check` cobre lint, status, traceabilidade, cobertura e drift tecnico em sequencia.
3. O fluxo de contexto gera cache hit e registra telemetria operacional.
4. As skills e docs tratam `CONTEXT.md` como primeira camada e `summary` como modo preferencial.
5. O produto tem validacao E2E minima para signup, login e logout.
6. Toda feature ativa tem spec Approved + TRACEABILITY.md + CONTEXT.md + testes.

## Estado atual do custo de contexto

Ciclo funcional de controle implementado:

- contexto curto por feature (CONTEXT.md)
- budget por modo (summary ~900t, chunked ~900t/chunk, full sem limite definido)
- warnings nao-bloqueantes quando budget recomendado e excedido
- cache local por feature, versao, modo e arquivos-fonte (SHA256)
- telemetria com duracao, cache hit, origem e tokens estimados
- relatorio consolidado via `npm run context:report`

Estado observado na ultima revalidacao:

- `npm run context:report` reportou 4 eventos
- Total registrado: 1143 tokens estimados
- Total servido: 36 chunks/documentos
- Cache hits: 1 de 2 invocacoes relevantes (50% hit rate)
- Budget warnings: 0
- Todas as chamadas recentes em modo `summary`/`chunked`

Ponto de atencao: base de apenas 4 eventos e insuficiente para validar eficacia real do cache. Hit rate de 50% pode ser otimismo ou coincidencia.

## O que ainda merece atencao

1. **Budget de `full` sem limite definido** — unico modo sem teto; pode causar gastos altos sem aviso.
2. **Pre-commit nao e bloqueante** — qualquer commit passa mesmo com spec inconsistente; enforcement e so via CI.
3. **E2E sem fluxos negativos** — login invalido, redirect de autenticado e signup com email duplicado nao estao cobertos.
4. **Apenas 1 ADR** — decisoes sobre MCP, SDD como processo e pokemon-agent nao foram formalizadas.
5. **Cache com base pequena** — 4 eventos e pouco para validar; escopo do cache nao inclui TRACEABILITY.md.
6. **Drift detection limitado ao schema Firestore** — comportamento de UI, rotas e integracao com MCP nao sao verificados.
7. **Telemetria sem correlacao com sessao ou tarefa** — impossivel saber o custo de uma tarefa especifica.

## Melhorias recomendadas por impacto

### Impacto alto (tokens e governanca)

1. **Definir budget explicito para `full`** — sugestao: 3000t; adicionar hard block acima de 6000t.
2. **Formalizar lazy escalation** — documentar em GLOBAL-STANDARDS.md a cadeia CONTEXT → summary → chunked → full.
3. **ADR-002 e ADR-003** — formalizar decisoes de MCP e SDD como processo (2 ADRs simples).

### Impacto medio (qualidade e cobertura)

4. **E2E para fluxos negativos** — pelo menos: login invalido, signup com email duplicado, acesso sem autenticacao.
5. **Ampliar escopo do cache** — incluir TRACEABILITY.md e changelog no fingerprint do cache.
6. **Pre-commit blocking** — converter de informativo para soft block quando spec:check falhar.

### Impacto baixo (refinamento)

7. **Telemetria por sessao/tarefa** — correlacionar eventos com sessao Claude para medir custo real por tarefa.
8. **TRACEABILITY-SUMMARY.md** — versao reduzida (so ACs + arquivos) para uso em contexto de IA.
9. **Automacao do archive** — trigger automatico ao aprovar nova versao de spec.
10. **Metricas de precisao do RAG** — registrar se o chunk retornado foi util ou ignorado.

## Prioridade sugerida

1. Definir budget explicito de `full` e formalizar lazy escalation de contexto.
2. Adicionar ADR-002 (MCP) e ADR-003 (SDD como processo).
3. Expandir E2E com fluxos negativos essenciais.
4. Ampliar cache e melhorar hit rate para acima de 70%.
5. Converter pre-commit de informativo para soft block.
