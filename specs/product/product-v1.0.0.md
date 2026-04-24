# Product Spec

Version: 1.0.0
Status: Approved

## Product name

GenAI SDD

## Vision

Criar um projeto de estudo que demonstre, de forma prática, como usar Spec-Driven Development para tornar fluxos com GenAI mais previsíveis, rastreáveis, econômicos em tokens e produtivos para implementação real.

## Problem

Projetos com IA aplicada a código costumam falhar por uma combinação de fatores:

- requisitos vagos
- contexto excessivo
- falta de rastreabilidade entre spec, código e teste
- deriva entre documentação e implementação
- custo de contexto difícil de observar e controlar

Sem um fluxo disciplinado, a IA tende a consumir mais tokens do que o necessário e a produzir mudanças menos confiáveis.

## Goal

Usar specs versionadas como fonte principal de verdade para construir e evoluir o produto, com contexto curto por feature, validações automáticas e mecanismos mínimos de governança para reduzir ambiguidade e desperdício de tokens.

## Target outcome

O repositório deve servir como laboratório prático para:

- escrever features guiadas por spec
- implementar com contexto mínimo e explícito
- validar cobertura de acceptance criteria
- detectar drift entre spec, contratos técnicos e implementação
- observar e reduzir custo de contexto ao longo do fluxo

## Core principles

- A spec ativa aprovada é o contrato principal.
- A IA não deve operar com contexto amplo por padrão.
- Cada feature deve ter contexto curto, rastreabilidade e testes alinhados.
- O fluxo deve favorecer clareza, não improviso.
- Redução de tokens deve acontecer sem sacrificar robustez.

## In scope

- Specs de produto, técnicas, decisões e features versionadas
- `TRACEABILITY.md` por feature
- `CONTEXT.md` canônico por feature
- Scripts de validação de spec
- Checagem de cobertura de AC
- Checagem de drift técnico
- MCP para recuperação de specs com modo resumido
- Telemetria básica de uso de contexto
- Features de demonstração para validar o fluxo

## Out of scope

- autonomia total da IA sem revisão humana
- mudanças arquiteturais não documentadas
- edição ampla do repositório sem escopo explícito
- plataforma de produção completa
- observabilidade financeira real por API provider

## Current capabilities

Atualmente o projeto já demonstra:

- fluxo SDD com specs aprovadas
- traceabilidade entre AC, código e testes
- contexto curto por feature
- retrieval resumido de specs
- governança básica de custo de contexto
- detecção de drift entre contratos e specs

## Success criteria

- Features novas podem ser implementadas a partir de specs aprovadas sem ambiguidades relevantes
- O pipeline de specs valida lint, status, traceabilidade, cobertura e drift
- O contexto padrão usado pela IA parte de `CONTEXT.md` e retrieval resumido
- O projeto consegue medir pelo menos tokens estimados e volume de contexto servido
- O fluxo continua produtivo sem depender de carregar specs completas por padrão

## Non-goals

- fully autonomous implementation without review
- undocumented architecture changes
- broad repository-wide edits by default
- replacing human product decisions with prompt heuristics

## Product thesis

O principal valor deste projeto não é apenas “gerar código com IA”, mas demonstrar que um processo orientado por spec, com contexto canônico curto e validações explícitas, produz um ambiente mais robusto, previsível e econômico para desenvolvimento com GenAI.
