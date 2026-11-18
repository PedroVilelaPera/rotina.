# Git Workflow & Versioning — `rotina.`

> Diretriz operacional para agentes de IA (Antigravity, Claude Code, Codex, Cursor) e desenvolvedores trabalhando no repositório `PedroVilelaPera/rotina.`. Baseada na skill `git-workflow-and-versioning`.

## 1. Estratégia de Branches (Trunk-Based Development)

- **`main` sempre executável/deployável.** Nunca commitar código quebrado direto na `main`.
- Trabalhe em **branches curtas (1 a 3 dias)** criadas a partir de `main` e deletadas após merge via Pull Request.
- **Convenção de nomenclatura (vincule o número da Issue):**
  - `feature/<issue>-<slug>` — ex.: `feature/5-setup-expo-design-system`
  - `fix/<issue>-<slug>` — ex.: `fix/14-swipe-duplicado-offline`
  - `chore/<slug>` — ex.: `chore/eas-build-preview`
  - `refactor/<slug>` — ex.: `refactor/firestore-repository`
- Evite branches de longa duração ou branches "por frente" vivendo semanas; integre fatias pequenas cedo para evitar conflitos entre as 3 frentes (`auth-infra`, `rotina-core`, `lembretes-conquistas`).

## 2. Disciplina de Commits

- **Commits atômicos (Save Point Pattern):** implemente uma fatia lógica → teste → verifique → commite. Alvo: ~100–300 linhas por commit/PR; alterações acima de ~1000 linhas devem ser divididas.
- **Separação de preocupações:** nunca misture formatação ou refatoração com novas funcionalidades ou correções no mesmo commit.
- **Formato obrigatório (Conventional Commits):**
  ```text
  <type>(<scope>): <descrição curta no imperativo>

  <corpo opcional explicando o PORQUÊ, não o que já está óbvio no diff>
  Refs: #<issue-id>
  ```
- **Tipos permitidos:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- **Escopos recomendados:** `auth`, `rotina`, `lembretes`, `conquistas`, `ui`, `firebase`, `infra`, `docs`.

## 3. Higiene Pré-Commit (Obrigatória antes de cada commit)

```bash
git diff --staged                                      # Revisar exatamente o que entra
git diff --staged | grep -iE "password|secret|api_key|token"  # Garantir zero segredos
npx tsc --noEmit                                       # Type-check TypeScript
npm run lint                                           # Lint
npm test                                               # Testes automatizados
```

## 4. Artefatos Versionados vs. Ignorados (`.gitignore`)

- **Versionar:** código-fonte, `docs/documento-de-requisitos-rotina.md` (fonte única da verdade em Markdown), `firestore.rules`, `.env.example`, `package-lock.json`, scripts de automação (`scripts/`).
- **NÃO versionar (manter no `.gitignore`):** `node_modules/`, `.expo/`, `dist/`, `android/`, `ios/` (se gerados por Prebuild), `.env`, `.env.local`, `*.pem`, `*.jks`, `*.apk` e binários gerados como `*.pdf` (entregue PDFs fora do histórico Git ou via GitHub Releases).

## 5. Resumo Estruturado de Mudanças (Change Summary)

Ao concluir qualquer alteração para revisão ou PR, reporte explicitamente:
```text
CHANGES MADE:
- <arquivo>: <o que mudou e por quê>

THINGS I DIDN'T TOUCH (intentionally):
- <arquivo/área fora do escopo preservada>

POTENTIAL CONCERNS:
- <trade-offs, novas dependências ou impactos entre frentes>
```

## 6. Versionamento Semântico (SemVer) e Releases

- Seguir `MAJOR.MINOR.PATCH` (`v0.x.y` durante desenvolvimento pré-MVP; `v1.0.0` na entrega do MVP):
  - `MAJOR`: mudança incompatível (ex.: quebra no schema do Firestore sem migração).
  - `MINOR`: nova funcionalidade retrocompatível.
  - `PATCH`: correção de bug retrocompatível.
- **Tag como fonte da verdade:** `git tag -a v1.0.0 -m "Release v1.0.0 — MVP rotina."`
- **CHANGELOG.md:** manter entradas legíveis para humanos agrupadas por `Added / Changed / Fixed / Removed` (escritas junto com a mudança, nunca dump de `git log`).

## 7. Trava de Segurança para Agentes de IA

- **Proibido** `git push --force` em `main` ou branches compartilhadas.
- **Consentimento explícito obrigatório:** agentes podem criar branches e commits locais livremente, mas **nunca devem executar `git push`, criar PR remoto ou publicar tags sem autorização expressa do desenvolvedor**.
