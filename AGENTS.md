# AGENTS.md — `rotina.`

Guia de contexto para agentes de IA atuando no repositório `PedroVilelaPera/rotina.`.

## Fonte da Verdade do Projeto
- **Especificação de Requisitos (Markdown versionável):** [docs/documento-de-requisitos-rotina.md](docs/documento-de-requisitos-rotina.md)
- **Regras de Git, Branches, Commits e Releases:** [.agents/rules/git-workflow-and-versioning.md](.agents/rules/git-workflow-and-versioning.md)

## Stack & Fronteiras
- **Mobile:** React Native + Expo (TypeScript, Expo Router), **Expo Dev Client (`expo-dev-client`)** no fluxo diário de desenvolvimento e builds via EAS, `Plus Jakarta Sans`, tema *Warm Obsidian Terracotta* (Dark Mode único na v1).
- **Backend (BaaS):** **Firebase JS SDK (`firebase`)** — Auth (E-mail/Senha, Anonymous Auth; Google opcional) + Cloud Firestore com cache offline nativo. *(Não instalar `@react-native-firebase/*` para manter a arquitetura gerenciada e compatível com a suíte de testes em Node sem mocks nativos pesados.)*
- **Notificações:** 100% locais via `expo-notifications` (suporte a canais Android e disparo em background via Dev Build).
- **Escopo negativo v1:** sem TensorFlow/ML on-device, sem LLM/IA na v1 (v2), sem foto/compartilhamento na v1 (v2), sem analytics complexo.

## Frentes da Equipe (3 Integrantes)
- `frente: auth-infra` — `@alvarokaycss`
- `frente: rotina-core` — `@JoaoGuiBarros`
- `frente: lembretes-conquistas` — `@PedroVilelaPera`
