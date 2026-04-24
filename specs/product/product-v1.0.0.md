# Product Spec

Version: 1.0.0
Status: Approved

## Product name

GenAI SDD

## Vision

Criar um projeto de estudo que demonstre, de forma pratica, como usar Spec-Driven Development para tornar fluxos com GenAI mais previsiveis, rastreaveis, economicos em tokens e produtivos para implementacao real.

## Problem

Projetos com IA aplicada a codigo costumam falhar por uma combinacao de fatores:

- requisitos vagos
- contexto excessivo
- falta de rastreabilidade entre spec, codigo e teste
- deriva entre documentacao e implementacao
- custo de contexto dificil de observar e controlar

Sem um fluxo disciplinado, a IA tende a consumir mais tokens do que o necessario e a produzir mudancas menos confiaveis.

## Goal

Usar specs versionadas como fonte principal de verdade para construir e evoluir o produto, com contexto curto por feature, validacoes automaticas e mecanismos minimos de governanca para reduzir ambiguidade e desperdicio de tokens.

## Target outcome

O repositorio deve servir como laboratorio pratico para:

- escrever features guiadas por spec
- implementar com contexto minimo e explicito
- validar cobertura de acceptance criteria
- detectar drift entre spec, contratos tecnicos e implementacao
- observar e reduzir custo de contexto ao longo do fluxo

## Core principles

- A spec ativa aprovada e o contrato principal.
- A IA nao deve operar com contexto amplo por padrao.
- Cada feature deve ter contexto curto, rastreabilidade e testes alinhados.
- O fluxo deve favorecer clareza, nao improviso.
- Reducao de tokens deve acontecer sem sacrificar robustez.

## In scope

- Specs de produto, tecnicas, decisoes e features versionadas
- `TRACEABILITY.md` por feature
- `CONTEXT.md` canonico por feature
- Scripts de validacao de spec
- Checagem de cobertura de AC
- Checagem de drift tecnico
- MCP para recuperacao de specs com modo resumido
- Telemetria basica de uso de contexto
- Cache local simples para reuse de contexto
- Budget warnings por modo de retrieval
- Arquivamento operacional de specs superseded
- Suite E2E pequena para jornadas criticas
- Features de demonstracao para validar o fluxo

## Out of scope

- autonomia total da IA sem revisao humana
- mudancas arquiteturais nao documentadas
- edicao ampla do repositorio sem escopo explicito
- plataforma de producao completa
- observabilidade financeira real por API provider

## Current capabilities

Atualmente o projeto ja demonstra:

- fluxo SDD com specs aprovadas
- traceabilidade entre AC, codigo e testes
- contexto curto por feature
- retrieval resumido de specs
- governanca basica de custo de contexto
- deteccao de drift entre contratos e specs
- cache local de contexto com invalidacao por arquivos-fonte
- arquivamento de historico para reduzir working set
- E2E enxuto para login, signup e logout

## Success criteria

- Features novas podem ser implementadas a partir de specs aprovadas sem ambiguidades relevantes
- O pipeline de specs valida lint, status, traceabilidade, cobertura e drift
- O contexto padrao usado pela IA parte de `CONTEXT.md` e retrieval resumido
- O projeto consegue medir tokens estimados, duracao, cache hits e budget warnings
- O fluxo continua produtivo sem depender de carregar specs completas por padrao

## Non-goals

- fully autonomous implementation without review
- undocumented architecture changes
- broad repository-wide edits by default
- replacing human product decisions with prompt heuristics

## Product thesis

O principal valor deste projeto nao e apenas "gerar codigo com IA", mas demonstrar que um processo orientado por spec, com contexto canonico curto e validacoes explicitas, produz um ambiente mais robusto, previsivel e economico para desenvolvimento com GenAI.
