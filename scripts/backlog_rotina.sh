#!/usr/bin/env bash
# =============================================================================
# Backlog-as-Code: Provisionamento de Labels, Milestone, Épicos e Issues
# Projeto: rotina. (Desenvolvimento Mobile II — IFPE Campus Garanhuns)
# Baseado em: DevObsidian / 05 - Templates & Playbooks / template-backlog-as-code.sh
#
# Uso:
#   DRY_RUN=1 bash scripts/backlog_rotina.sh   # Simulação local (sem criar nada)
#   bash scripts/backlog_rotina.sh             # Criação real no GitHub
# =============================================================================
set -euo pipefail

# --- 1. Configurações Globais ------------------------------------------------
REPO="${REPO:-PedroVilelaPera/rotina.}"
DRY_RUN="${DRY_RUN:-0}"
MILESTONE="${MILESTONE:-MVP v1.0 · Entrega Mobile II}"
MILESTONE_DUE="${MILESTONE_DUE:-2026-12-18T23:59:59Z}"

# Assignees verificados via API em repos/PedroVilelaPera/rotina./assignees
AUTH_INFRA="${AUTH_INFRA:-alvarokaycss}"
ROTINA_CORE="${ROTINA_CORE:-JoaoGuiBarros}"
LEMBRETES_CONQUISTAS="${LEMBRETES_CONQUISTAS:-PedroVilelaPera}"

# --- 2. Estado em Memória (Two-Pass Architecture) ----------------------------
declare -A NUM TITULO FILHOS
CONTADOR=0

label() {
  local nome="$1" cor="$2" desc="$3"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] label: $nome (#$cor)"
  else
    gh label create "$nome" --repo "$REPO" --color "$cor" --description "$desc" --force >/dev/null
  fi
}

nova() {
  local id="$1" titulo="$2" labels="$3" assignees="$4" epico="${5:-}"
  local corpo; corpo="$(cat)"
  TITULO[$id]="$titulo"
  if [[ -n "$epico" ]]; then FILHOS[$epico]="${FILHOS[$epico]:-} $id"; fi

  if [[ "$DRY_RUN" == "1" ]]; then
    CONTADOR=$((CONTADOR + 1))
    NUM[$id]="$CONTADOR"
    echo "[dry-run] #$CONTADOR [$id] $titulo | labels: $labels | assignee: ${assignees:-nenhum}"
    return
  fi

  local args=(issue create --repo "$REPO" --title "[$id] $titulo" --body "$corpo"
              --label "$labels" --milestone "$MILESTONE")
  if [[ -n "$assignees" ]]; then args+=(--assignee "$assignees"); fi
  local url; url="$(gh "${args[@]}")"
  NUM[$id]="${url##*/}"
  echo "#${NUM[$id]} [$id] $titulo"
}

# --- 3. Criação de Labels Temáticos ------------------------------------------
echo "== 1/5. Configurando Labels no repositório $REPO"
label "frente: auth-infra"           "0052CC" "Fundação Expo, Firebase, Auth, Conta e EAS Build"
label "frente: rotina-core"          "E07A5F" "Núcleo da rotina: tarefas, hábitos, checklist e detalhes"
label "frente: lembretes-conquistas" "5319E7" "Notificações locais, follow-up e conquistas"
label "tipo: epico"                  "3E4B9E" "Agrupador macro de entregas"
label "tipo: feature"                "0E8A16" "Nova funcionalidade do produto"
label "tipo: infra"                  "1D76DB" "Setup, configuração, regras de segurança e build"
label "prioridade: essencial"        "B60205" "Obrigatório para o funcionamento do MVP v1"
label "prioridade: importante"       "FBCA04" "Esperado no MVP v1 para experiência completa"
label "prioridade: desejavel"        "C5DEF5" "Evolução futura (v2) ou extra caso haja tempo hábil"

# --- 4. Criação do Milestone -------------------------------------------------
echo "== 2/5. Configurando Milestone: $MILESTONE"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] milestone: $MILESTONE (due: $MILESTONE_DUE)"
elif ! gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$MILESTONE"; then
  gh api "repos/$REPO/milestones" -f title="$MILESTONE" -f due_on="$MILESTONE_DUE" \
    -f description="MVP v1.0 do aplicativo rotina. (Expo + Firebase) — Desenvolvimento Mobile II (IFPE Campus Garanhuns)." >/dev/null
fi

# --- 5. Criação dos Épicos Macro (Passada 1) ---------------------------------
echo "== 3/5. Criando Épicos Macro"

nova E1 "Épico: Fundação, Firebase, Autenticação & Conta" "tipo: epico,frente: auth-infra,prioridade: essencial" "$AUTH_INFRA" <<EOF
Épico agregador da frente **auth-infra** (responsável: @$AUTH_INFRA).
Lista de issues será vinculada automaticamente na Passada 2.
EOF

nova E2 "Épico: Núcleo da Rotina (Tarefas, Hábitos & Checklist)" "tipo: epico,frente: rotina-core,prioridade: essencial" "$ROTINA_CORE" <<EOF
Épico agregador da frente **rotina-core** (responsável: @$ROTINA_CORE).
Lista de issues será vinculada automaticamente na Passada 2.
EOF

nova E3 "Épico: Lembretes Locais, Follow-up & Conquistas" "tipo: epico,frente: lembretes-conquistas,prioridade: essencial" "$LEMBRETES_CONQUISTAS" <<EOF
Épico agregador da frente **lembretes-conquistas** (responsável: @$LEMBRETES_CONQUISTAS).
Lista de issues será vinculada automaticamente na Passada 2.
EOF

nova E4 "Épico: Evolução v2 (Requisitos Desejáveis)" "tipo: epico,prioridade: desejavel" "" <<EOF
Épico agregador dos requisitos classificados como **Desejável** no Documento de Requisitos v1.0 (fora do escopo obrigatório do MVP).
Lista de issues será vinculada automaticamente na Passada 2.
EOF

# --- 6. Criação das Tarefas Granulares ---------------------------------------
echo "== 4/5. Criando Tarefas Granulares"

# ========================= FRENTE 1: AUTH-INFRA ==============================
nova A1 "Setup Expo, Design System (Warm Obsidian Terracotta) e Spec Kit" "frente: auth-infra,tipo: infra,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Usabilidade.NF001]\`, \`[Hardware e software.NF001]\`, \`[Hardware e software.NF002]\`

## Objetivo
Inicializar o projeto React Native com Expo (TypeScript + Expo Router), carregar a fonte \`Plus Jakarta Sans\`, centralizar os tokens visuais do tema *Warm Obsidian Terracotta* e estruturar os contratos base para uso com Spec Kit.

## Critérios de Aceite
- [ ] Projeto Expo rodando em Android/iOS com TypeScript estrito e Expo Router configurado (Tab Bar: \`rotina\`, \`conquistas\`, \`ajustes\`)
- [ ] Fonte \`Plus Jakarta Sans\` carregada via \`@expo-google-fonts/plus-jakarta-sans\`
- [ ] Arquivo \`theme/tokens.ts\` com todos os 9 tokens (\`#151312\`, \`#1D1B1A\`, \`#262423\`, \`#2D2927\`, \`#E07A5F\`, \`#151312\` onPrimary, \`#F5F2F0\`, \`#A8A29E\`, \`#C85A53\`)
- [ ] Componentes base reutilizáveis (\`Button\`, \`Card\`, \`Input\`) respeitando contraste WCAG AA

## Definition of Done (DoD)
Repositório clonável e executando \`npx expo start\` sem erros, com tokens consumíveis pelas demais frentes.
EOF

nova A2 "Configurar Firebase (Auth + Cloud Firestore offline) e Security Rules" "frente: auth-infra,tipo: infra,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Confiabilidade.NF001]\`, \`[Seguranca.NF001]\`, \`[Seguranca.NF002]\`

## Objetivo
Configurar a instância do Firebase no app Expo (via variáveis de ambiente \`.env\`), habilitar cache offline do Cloud Firestore e publicar as \`Firestore Security Rules\` isolando os dados por \`uid\`.

## Critérios de Aceite
- [ ] SDK Firebase inicializado com variáveis \`EXPO_PUBLIC_FIREBASE_*\` e \`.env.example\` documentado
- [ ] Persistência offline do Firestore ativa para leitura/escrita sem conexão
- [ ] Regras \`firestore.rules\` versionadas no repo restringindo \`users/{userId}/**\` a \`request.auth != null && request.auth.uid == userId\`
- [ ] Contexto/hook \`useAuth()\` expondo \`user\`, \`userId\`, \`isAnonymous\` e \`loading\`

## Definition of Done (DoD)
Leitura/escrita autenticada funcionando em \`users/{userId}\` e bloqueada para outros usuários.
EOF

nova A3 "Implementar cadastro/login E-mail+Senha, recuperação de senha e tela IF01" "frente: auth-infra,tipo: feature,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Autenticacao e Conta.RF001]\`, \`[Autenticacao e Conta.RF004]\`, Interface \`IF01\`

## Objetivo
Construir a tela **IF01 (Login - Minimalista)** e integrar cadastro, login por e-mail/senha e envio de e-mail de recuperação de senha via Firebase Auth.

## Critérios de Aceite
- [ ] Tela \`IF01\` fiel ao protótipo (ícone relógio, logo \`rotina.\`, subtítulo, inputs, \`Esqueceu?\`, botão \`Entrar →\`, \`Criar conta\`)
- [ ] Validação de e-mail (com \`trim\`) e senha (>= 6 caracteres) com alternância de visibilidade
- [ ] Criação automática do documento \`users/{userId}\` com \`settings\` padrão no primeiro cadastro
- [ ] Fluxo \`Esqueceu?\` enviando e-mail de redefinição com feedback neutro
- [ ] Botão bloqueia cliques duplos e exibe estado de carregamento durante requisição

## Definition of Done (DoD)
Usuário consegue criar conta, recuperar senha, fazer login e ser redirecionado para \`IF02\`.
EOF

nova A4 "Implementar Modo Visitante (Anonymous Auth) e conversão para conta definitiva" "frente: auth-infra,tipo: feature,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Autenticacao e Conta.RF002]\`, \`[Autenticacao e Conta.RF003]\`, Interfaces \`IF01\`, \`IF06\`

## Objetivo
Permitir acesso imediato sem cadastro via Firebase Anonymous Auth e oferecer a conversão posterior da conta visitante para conta definitiva preservando todos os dados do usuário.

## Critérios de Aceite
- [ ] Botão *"Entrar sem cadastro (modo visitante)"* na \`IF01\` cria sessão anônima e documento \`users/{userId}\` (\`isAnonymous: true\`)
- [ ] Banner discreto na \`IF06\` permite vincular e-mail/senha ou Google via \`linkWithCredential\`
- [ ] Após conversão, \`items\` e \`completions\` permanecem intactos sob o mesmo \`userId\` e \`isAnonymous\` passa para \`false\`
- [ ] Tratamento claro caso o e-mail informado já possua conta cadastrada

## Definition of Done (DoD)
Fluxo visitante → uso do app → conversão para conta definitiva validado sem perda de dados.
EOF

nova A5 "Implementar autenticação social com conta Google" "frente: auth-infra,tipo: feature,prioridade: importante" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Autenticacao e Conta.RF005]\`, Interface \`IF01\`

## Objetivo
Integrar o botão *Google* da tela \`IF01\` ao fluxo OAuth Google + Firebase Auth.

## Critérios de Aceite
- [ ] Botão *Google* abre seletor de conta e autentica no Firebase Auth
- [ ] Cria/carrega documento \`users/{userId}\` automaticamente e redireciona para \`IF02\`
- [ ] Cancelamento do seletor pelo usuário retorna silenciosamente à \`IF01\` sem mensagem de erro

## Definition of Done (DoD)
Login Google funcionando em build de desenvolvimento/APK Android.
EOF

nova A6 "Implementar tela IF06 (Ajustes — bloco de conta e Logout)" "frente: auth-infra,tipo: feature,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Autenticacao e Conta.RF007]\`, Interface \`IF06\`

## Objetivo
Criar a estrutura da aba **IF06 (Ajustes)** com exibição do status da conta, espaço dedicado para os controles de notificação (Frente 3) e fluxo seguro de encerramento de sessão.

## Critérios de Aceite
- [ ] Exibe e-mail autenticado ou banner de conversão quando \`isAnonymous == true\`
- [ ] Botão *"Sair"* exige confirmação explícita em modo visitante alertando sobre perda de dados sem conta vinculada
- [ ] Logout dispara callback de cancelamento de notificações locais, encerra sessão no Firebase Auth e retorna à \`IF01\`

## Definition of Done (DoD)
Tela \`IF06\` integrada na Tab Bar e pronta para receber a seção de notificações da Frente 3.
EOF

nova A7 "Configurar Expo EAS Build para geração de APK Android do MVP" "frente: auth-infra,tipo: infra,prioridade: essencial" "$AUTH_INFRA" E1 <<EOF
## Referência no Documento de Requisitos
- \`[Distribuicao.NF001]\`, \`[Hardware e software.NF001]\`

## Objetivo
Configurar \`eas.json\` e perfil \`preview\` para gerar pacote Android (\`.apk\`) instalável para testes e entrega da disciplina.

## Critérios de Aceite
- [ ] \`eas.json\` configurado com perfil \`preview\` (\`buildType: "apk"\`)
- [ ] Variáveis de ambiente de build configuradas sem expor segredos no Git
- [ ] APK gerado e testado em dispositivo Android 10+ (API 29+)

## Definition of Done (DoD)
Link/arquivo \`.apk\` funcional validado pela equipe.
EOF

# ========================= FRENTE 2: ROTINA-CORE =============================
nova R1 "Definir contratos TypeScript (Item, Completion) e repositório Firestore idempotente" "frente: rotina-core,tipo: infra,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Confiabilidade.NF001]\`, \`[Confiabilidade.NF002]\`, \`[Padroes.NF001]\`

## Objetivo
Criar os tipos compartilhados (\`RoutineItem\`, \`CompletionRecord\`) e a camada de acesso ao Firestore para \`users/{userId}/items\` e \`users/{userId}/completions/{itemId}_{YYYY-MM-DD}\`.

## Critérios de Aceite
- [ ] Tipos TypeScript documentados em \`src/types/routine.ts\` (consumíveis também pela Frente 3)
- [ ] Datas persistidas estritamente em \`YYYY-MM-DD\` (data local) e horários em \`HH:mm\` (24h)
- [ ] ID determinístico \`{itemId}_{YYYY-MM-DD}\` garantindo idempotência em conclusões offline/múltiplos cliques
- [ ] Funções CRUD para \`items\` e \`toggleCompletion(item, date)\` testadas com testes unitários

## Definition of Done (DoD)
Camada de dados estável, tipada e com testes unitários passando.
EOF

nova R2 "Implementar tela IF02 (Home & Tarefas): lista diária unificada e progresso" "frente: rotina-core,tipo: feature,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Gestao da Rotina.RF001]\`, \`[Desempenho.NF002]\`, Interface \`IF02\`

## Objetivo
Implementar a tela **IF02 (Home & Tarefas - Minimalista)** exibindo saudação, data por extenso, barra de progresso terracota e lista unificada de hábitos do dia + tarefas pontuais da data atual.

## Critérios de Aceite
- [ ] Filtra apenas hábitos ativos (\`isActive == true\`) aplicáveis ao dia da semana atual + tarefas com \`targetDate == hoje\`
- [ ] Ordenação por \`scheduledTime\` ascendente (itens sem horário ao final)
- [ ] Card *Progresso de Hoje* calcula dinamicamente \`X de Y concluídas\` com barras visuais em \`#E07A5F\`
- [ ] Estado vazio acolhedor quando não houver itens cadastrados para hoje
- [ ] Carregamento via cache local em \`< 1,5 s\`

## Definition of Done (DoD)
Tela \`IF02\` fiel ao protótipo renderizando dados reais do Firestore.
EOF

nova R3 "Implementar conclusão e desfazimento no dia via checkbox e gesto swipe" "frente: rotina-core,tipo: feature,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Gestao da Rotina.RF005]\`, \`[Usabilidade.NF002]\`, \`[Desempenho.NF001]\`, Interfaces \`IF02\`, \`IF04\`

## Objetivo
Permitir concluir ou desfazer qualquer item do dia em no máximo 1 toque (checkbox) ou 1 gesto (*swipe*), gravando \`completedAt\` automaticamente e atualizando a UI de forma otimista.

## Critérios de Aceite
- [ ] Toque no checkbox ou gesto *swipe* no card alterna conclusão sem pop-up bloqueante
- [ ] Atualização visual otimista (checkbox terracota + texto tachado + recálculo da barra) em \`< 200 ms\`
- [ ] Ao concluir: grava \`completions/{itemId}_{YYYY-MM-DD}\` com \`completedAt = now()\` e snapshot de \`scheduledTime\`
- [ ] Ao desfazer no mesmo dia: remove o documento \`{itemId}_{YYYY-MM-DD}\`
- [ ] Funciona offline sincronizando automaticamente ao reconectar

## Definition of Done (DoD)
Checklist interativo testado online e em modo avião sem duplicação de registros.
EOF

nova R4 "Implementar tela IF03 (Criar/Editar Tarefa pontual e Hábito recorrente)" "frente: rotina-core,tipo: feature,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Gestao da Rotina.RF002]\`, \`[Gestao da Rotina.RF003]\`, Interface \`IF03\`

## Objetivo
Construir o formulário minimalista **IF03** para criação e edição de *Tarefas do dia* e *Hábitos* (diários ou por dias da semana).

## Critérios de Aceite
- [ ] Seletor de tipo (\`Tarefa do dia\` vs \`Hábito\`)
- [ ] Validação de título obrigatório (1–80 caracteres) e nota pessoal opcional (até 280 caracteres)
- [ ] Para \`Hábito\`: exige \`scheduledTime\` (\`HH:mm\`), duração planejada (\`15m\`/\`30m\`/\`45m\`/\`1h\`) e recorrência (\`Diário\` ou \`Semanal\` com >= 1 dia selecionado)
- [ ] Emite/invoca hook de sincronização de lembrete (Frente 3) ao salvar hábito

## Definition of Done (DoD)
Criação e edição de tarefas e hábitos persistindo corretamente no Firestore e atualizando \`IF02\`.
EOF

nova R5 "Implementar tela IF04 (Detalhes do Item: ±15m, duração, Nota Pessoal)" "frente: rotina-core,tipo: feature,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Gestao da Rotina.RF004]\`, Interface \`IF04\`

## Objetivo
Construir a tela **IF04 (Detalhes - Minimalista)** com micro-ajustes rápidos de horário (\`-15m\`/\`+15m\`), pílulas de duração, card *Nota Pessoal* (escopo v1 sem IA) e ação *Concluir hoje*.

## Critérios de Aceite
- [ ] Exibe categoria, badge de recorrência, título, card *Início* (\`-15m\`/\`+15m\` com wrap \`00:00\`–\`23:45\`) e card *Duração* (\`15m\`/\`30m\`/\`45m\`/\`1h\`)
- [ ] Exibe card *Nota Pessoal* editável (texto livre sem cards de IA na v1)
- [ ] Botão largo terracota \`✓\` salva ajustes e retorna à \`IF02\`
- [ ] Botão *"Editar Tarefa"* abre \`IF03\` preenchida; botão *"Concluir hoje"* aciona \`RF005\`

## Definition of Done (DoD)
Fluxo \`IF02 → IF04 → salvar/concluir → IF02\` completo e responsivo.
EOF

nova R6 "Implementar exclusão lógica (arquivamento) preservando histórico de conquistas" "frente: rotina-core,tipo: feature,prioridade: essencial" "$ROTINA_CORE" E2 <<EOF
## Referência no Documento de Requisitos
- \`[Gestao da Rotina.RF006]\`, Interface \`IF04\`

## Objetivo
Implementar a ação *"Excluir da rotina"* na \`IF04\` como exclusão lógica (\`isActive = false\`) para não corromper contadores históricos da tela de Conquistas.

## Critérios de Aceite
- [ ] Exibe diálogo de confirmação antes de arquivar
- [ ] Atualiza \`isActive = false\` no Firestore mantendo intactos os documentos em \`completions\`
- [ ] Cancela notificações locais do item (integração com Frente 3) e retorna à \`IF02\`

## Definition of Done (DoD)
Item removido da lista diária sem apagar conquistas já obtidas.
EOF

# ==================== FRENTE 3: LEMBRETES-CONQUISTAS =========================
nova L1 "Implementar serviço de notificações locais (expo-notifications) para hábitos" "frente: lembretes-conquistas,tipo: feature,prioridade: essencial" "$LEMBRETES_CONQUISTAS" E3 <<EOF
## Referência no Documento de Requisitos
- \`[Lembretes e Notificacoes.RF001]\`, Interfaces \`IF03\`, \`IF04\`

## Objetivo
Criar o módulo de notificações 100% locais usando \`expo-notifications\` para agendar lembretes amigáveis no horário e dias definidos de cada hábito ativo.

## Critérios de Aceite
- [ ] Solicita permissão de notificações do SO de forma não invasiva; se negada, não bloqueia o app
- [ ] Agenda gatilhos locais recorrentes para hábitos diários e semanais (\`daysOfWeek\`) com texto amigável padrão
- [ ] Tocar na notificação abre o app direcionando para \`IF02\` ou \`IF04\` do item

## Definition of Done (DoD)
Notificação local disparada no horário agendado em aparelho Android/emulador mesmo sem internet.
EOF

nova L2 "Integrar reagendamento e cancelamento de lembretes (edição, exclusão e logout)" "frente: lembretes-conquistas,tipo: feature,prioridade: essencial" "$LEMBRETES_CONQUISTAS" E3 <<EOF
## Referência no Documento de Requisitos
- \`[Lembretes e Notificacoes.RF001]\`, \`[Gestao da Rotina.RF004]\`, \`[Gestao da Rotina.RF006]\`, \`[Autenticacao e Conta.RF007]\`

## Objetivo
Garantir que notificações locais fiquem sempre sincronizadas com o estado real dos hábitos (evitando alertas fantasmas após edição de horário, arquivamento ou logout).

## Critérios de Aceite
- [ ] Alterar horário ou dias do hábito cancela o gatilho antigo e agenda o novo
- [ ] Arquivar hábito (\`isActive = false\`) cancela todas as notificações daquele \`itemId\`
- [ ] Encerrar sessão (Logout na \`IF06\`) limpa todas as notificações agendadas no dispositivo

## Definition of Done (DoD)
Zero notificações duplicadas ou órfãs após ciclos de criar → editar → arquivar → logout.
EOF

nova L3 "Implementar Follow-up opcional no dia seguinte e controles na tela IF06" "frente: lembretes-conquistas,tipo: feature,prioridade: importante" "$LEMBRETES_CONQUISTAS" E3 <<EOF
## Referência no Documento de Requisitos
- \`[Lembretes e Notificacoes.RF002]\`, \`[Usabilidade.NF003]\`, Interfaces \`IF02\`, \`IF06\`

## Objetivo
Permitir que o usuário ative/desative na \`IF06\` o lembrete gentil do dia seguinte para hábitos não concluídos ontem, com opção de registrar conclusão retroativa.

## Critérios de Aceite
- [ ] Bloco de notificações na \`IF06\`: toggle \`nextDayFollowUpEnabled\`, seletor \`followUpTime\` (desabilitado quando toggle off) e indicador de permissão do SO
- [ ] Preferências persistidas em \`users/{userId}.settings\`
- [ ] Detecta hábitos de ontem sem \`completions/{itemId}_{ontem}\` e exibe prompt gentil (*"Você conseguiu realizar [título] ontem?"*)
- [ ] Responder *Sim* grava \`completions/{itemId}_{ontem}\`; responder *Não*/ignorar não aplica penalidade

## Definition of Done (DoD)
Fluxo completo de configuração + detecção + marcação retroativa validado.
EOF

nova L4 "Implementar motor de agregação de conquistas reais e Pensamento do Dia" "frente: lembretes-conquistas,tipo: feature,prioridade: importante" "$LEMBRETES_CONQUISTAS" E3 <<EOF
## Referência no Documento de Requisitos
- \`[Conquistas e Gamificacao.RF001]\`, Interface \`IF05\`

## Objetivo
Criar a camada pura de cálculo de conquistas a partir da coleção \`completions\`, sem analytics complexo nem métricas punitivas.

## Critérios de Aceite
- [ ] Calcula a partir de \`completions\`: hábito com maior número de conclusões (Marco de Destaque), total de conclusões por hábito, maior sequência de dias ativos e total geral de tarefas concluídas
- [ ] Nunca retorna valores negativos nem mensagens de falha caso a sequência seja 0
- [ ] Banco local de frases de *Pensamento do Dia* com seleção determinística pela data atual
- [ ] Coberto por testes unitários para cenários: vazio, 1 dia, sequência contínua e sequência com pausa

## Definition of Done (DoD)
Funções de cálculo 100% testadas e integradas ao repositório de \`completions\`.
EOF

nova L5 "Implementar tela IF05 (Conquistas - Minimalista)" "frente: lembretes-conquistas,tipo: feature,prioridade: importante" "$LEMBRETES_CONQUISTAS" E3 <<EOF
## Referência no Documento de Requisitos
- \`[Conquistas e Gamificacao.RF001]\`, \`[Usabilidade.NF003]\`, Interface \`IF05\`

## Objetivo
Construir a tela **IF05 (Conquistas - Minimalista)** no escopo v1 (contadores reais + Marco de Destaque sem foto + lista *Pequenas Vitórias Reais* + *Pensamento do Dia*).

## Critérios de Aceite
- [ ] Card de Destaque exibindo o maior marco real do usuário (sem upload de foto na v1)
- [ ] Lista *"Pequenas Vitórias Reais"* preenchida dinamicamente pelos contadores da task \`L4\`
- [ ] Card *Pensamento do Dia* com frase rotacionada diariamente
- [ ] Estado inicial encorajador para usuários sem conclusões ainda

## Definition of Done (DoD)
Tela \`IF05\` fiel à identidade *Warm Obsidian Terracotta* e acessível pela Tab Bar.
EOF

# ==================== ÉPICO 4: EVOLUÇÃO V2 (DESEJÁVEIS) ======================
nova V1 "[v2] Autenticação com conta Apple" "frente: auth-infra,tipo: feature,prioridade: desejavel" "" E4 <<EOF
## Referência no Documento de Requisitos
- \`[Autenticacao e Conta.RF006]\`, Interface \`IF01\`

## Objetivo
Habilitar login via *Sign in with Apple* na tela \`IF01\` integrado ao Firebase Auth (para builds iOS).
EOF

nova V2 "[v2] Lembretes contextuais gerados por IA via API de LLM" "frente: lembretes-conquistas,tipo: feature,prioridade: desejavel" "" E4 <<EOF
## Referência no Documento de Requisitos
- \`[Lembretes e Notificacoes.RF003]\`, Interface \`IF04\`

## Objetivo
Evoluir o card *Nota Pessoal* da \`IF04\` para gerar prévia e texto de lembrete acolhedor via API externa de LLM, com fallback automático para template local em caso de offline/timeout. *(TensorFlow permanece fora do escopo.)*
EOF

nova V3 "[v2] Conquista de pontualidade (completedAt vs. scheduledTime)" "frente: lembretes-conquistas,tipo: feature,prioridade: desejavel" "" E4 <<EOF
## Referência no Documento de Requisitos
- \`[Conquistas e Gamificacao.RF002]\`, Interface \`IF05\`

## Objetivo
Aproveitar \`completedAt\` e \`scheduledTime\` já salvos em \`completions\` para desbloquear marco positivo de pontualidade (±15 min), sem penalizar conclusões fora do horário.
EOF

nova V4 "[v2] Upload de foto afetiva em marco de conquista" "frente: lembretes-conquistas,tipo: feature,prioridade: desejavel" "" E4 <<EOF
## Referência no Documento de Requisitos
- \`[Conquistas e Gamificacao.RF003]\`, Interface \`IF05\`

## Objetivo
Permitir anexar foto da galeria/câmera no Card de Destaque (Marco Ouro) da \`IF05\` usando Firebase Storage.
EOF

nova V5 "[v2] Compartilhamento nativo de resumo de conquistas" "frente: lembretes-conquistas,tipo: feature,prioridade: desejavel" "" E4 <<EOF
## Referência no Documento de Requisitos
- \`[Conquistas e Gamificacao.RF004]\`, Interface \`IF05\`

## Objetivo
Adicionar o botão *"Compartilhar conquistas"* na \`IF05\` invocando a folha nativa de compartilhamento do SO.
EOF

# --- 7. Retroalimentação dos Épicos com IDs Reais (Passada 2) ----------------
echo "== 5/5. Vinculando Tarefas aos seus Épicos"

for epico in E1 E2 E3 E4; do
  filhos="${FILHOS[$epico]:-}"
  corpo_filhos="### Tarefas Integrantes deste Épico:"$'\n\n'
  for f in $filhos; do
    corpo_filhos+="- [ ] #${NUM[$f]} **[$f]** ${TITULO[$f]}"$'\n'
  done

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] Atualizando épico #${NUM[$epico]} ($epico) com tarefas:$filhos"
  else
    gh issue edit "${NUM[$epico]}" --repo "$REPO" --body "$corpo_filhos" >/dev/null
    echo "Épico #${NUM[$epico]} ($epico) atualizado."
  fi
done

echo "== Concluído com sucesso! Backlog provisionado em $REPO."
