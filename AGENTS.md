# AGENTS.md — `rotina.`

Guia de contexto para agentes de IA atuando no repositório `PedroVilelaPera/rotina.`.

## Fonte da Verdade do Projeto
- **Especificação de Requisitos (Markdown versionável):** [docs/documento-de-requisitos-rotina.md](docs/documento-de-requisitos-rotina.md)
- **Regras de Git, Branches, Commits e Releases:** [.agents/rules/git-workflow-and-versioning.md](.agents/rules/git-workflow-and-versioning.md)

## Stack & Fronteiras
- **Mobile:** React Native + Expo (TypeScript, Expo Router), `Plus Jakarta Sans`, tema *Warm Obsidian Terracotta* (Dark Mode único na v1).
- **Backend (BaaS):** Firebase Auth (E-mail/Senha, Google, Anonymous Auth) + Cloud Firestore com cache offline nativo.
- **Notificações:** 100% locais via `expo-notifications`.
- **Escopo negativo v1:** sem TensorFlow/ML on-device, sem LLM/IA na v1 (v2), sem foto/compartilhamento na v1 (v2), sem analytics complexo.

## Frentes da Equipe (3 Integrantes)
- `frente: auth-infra` — `@alvarokaycss`
- `frente: rotina-core` — `@JoaoGuiBarros`
- `frente: lembretes-conquistas` — `@PedroVilelaPera`
