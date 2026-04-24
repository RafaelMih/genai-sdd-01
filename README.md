# genai-sdd

Projeto de estudo focado em GenAI com Spec-Driven Development (SDD), MCP e validações de contrato para reduzir ambiguidade, custo de contexto e drift entre spec, código e testes.

## Objetivos

- Tornar a spec o contrato principal de implementação
- Reduzir alucinação e ambiguidade em fluxos com IA
- Medir e controlar melhor o custo de contexto
- Evoluir um workflow produtivo para features guiadas por spec

## Fluxo atual

1. Criar ou evoluir a spec da feature
2. Aprovar a spec ativa
3. Gerar ou atualizar o contexto curto da feature
4. Implementar usando apenas a spec ativa e seus contratos
5. Validar spec, traceabilidade, cobertura e drift
6. Validar código com typecheck e testes

## Comandos principais

```bash
npm run spec:check
npm run context:generate
npm run ai:context <feature>
npm run context:report
npm run typecheck
npm run test
```

## Fontes canônicas

- Processo global e padrões: `.claude/GLOBAL-STANDARDS.md`
- Regras de execução para Claude: `CLAUDE.md`
- Spec ativa por feature: `specs/features/<feature>/spec-vX.Y.Z.md`
- Contexto curto por feature: `specs/features/<feature>/CONTEXT.md`
- Traceabilidade por feature: `specs/features/<feature>/TRACEABILITY.md`

## Observações

- `spec:check` valida lint, status, traceabilidade, cobertura de AC e drift técnico
- `ai:context` usa budget de contexto
- O MCP de specs responde em modo resumido por padrão
- O projeto ainda não possui suíte E2E nem cache semântico explícito
