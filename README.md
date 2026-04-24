# genai-sdd

Projeto de estudo focado em GenAI com Spec-Driven Development (SDD), MCP e validacoes de contrato para reduzir ambiguidade, custo de contexto e drift entre spec, codigo e testes.

## Objetivos

- Tornar a spec o contrato principal de implementacao
- Reduzir alucinacao e ambiguidade em fluxos com IA
- Medir e controlar melhor o custo de contexto
- Evoluir um workflow produtivo para features guiadas por spec

## Fluxo atual

1. Criar ou evoluir a spec da feature
2. Aprovar a spec ativa
3. Gerar ou atualizar o contexto curto da feature
4. Implementar usando `CONTEXT.md` e retrieval resumido antes da spec completa
5. Validar spec, traceabilidade, cobertura, drift e budgets
6. Arquivar specs superseded quando a feature estabilizar
7. Validar codigo com typecheck, testes e E2E

## Comandos principais

```bash
npm run spec:check
npm run context:generate
npm run ai:context <feature>
npm run context:report
npm run specs:archive
npm run typecheck
npm run test
npm run e2e
```

## Fontes canonicas

- Processo global e padroes: `.claude/GLOBAL-STANDARDS.md`
- Regras de execucao para Claude: `CLAUDE.md`
- Spec ativa por feature: `specs/features/<feature>/spec-vX.Y.Z.md`
- Contexto curto por feature: `specs/features/<feature>/CONTEXT.md`
- Traceabilidade por feature: `specs/features/<feature>/TRACEABILITY.md`

## Observacoes

- `spec:check` valida lint, status, traceabilidade, cobertura de AC e drift tecnico
- `ai:context` usa budget de contexto, warnings nao bloqueantes e cache local
- O MCP de specs responde em modo resumido por padrao e registra telemetria
- `specs:archive` move specs superseded para `specs/archive/<feature>/`
- `context:report` mostra tokens estimados, duracao, cache hits e budget warnings
- A suite E2E usa Playwright com ambiente local previsivel (`npm run dev:e2e`)
