# rotina.

> Aplicativo mobile minimalista de organização diária, hábitos e tarefas com foco em baixa carga cognitiva, clareza operacional e persistência offline-first.

---

## ✦ Visão Geral do Produto

O **`rotina.`** é um aplicativo desenvolvido para quem busca manter a consistência diária sem atritos desnecessários, cobranças punitivas ou poluição visual. O app unifica hábitos recorrentes e tarefas pontuais em uma linha do tempo clara para o dia atual, garantindo agilidade no registro de conclusões e ajustes rápidos de horários e anotações.

### Propósito & Filosofia
- **Baixa Carga Cognitiva:** Interface limpa no tema *Warm Obsidian Terracotta*, reduzindo distrações e priorizando o que precisa ser feito hoje.
- **Sem Culpa:** Itens não concluídos não geram punições ou sequências quebradas de forma agressiva; o ritmo de cada usuário é respeitado.
- **Offline-First Nativo:** Todas as ações refletem instantaneamente no dispositivo e sincronizam em segundo plano com o Firebase.

---

## ⚡ Principais Funcionalidades

1. **Gestão Diária Unificada**
   - Agrupamento inteligente de **Hábitos Recorrentes** e **Tarefas Pontuais** na mesma visão do dia.
   - Indicador de progresso diário em tempo real com barra de completude e badge de sucesso contextual.
   - Estado vazio acolhedor e suporte a atualização sob demanda (*Pull-to-Refresh*).

2. **Conclusão Otimista Offline-First**
   - Alternância de conclusão em 1 toque (checkbox) ou via gestos de deslizamento lateral (*swipe actions* configuráveis para concluir ou desfazer).
   - Feedback tátil leve (*haptic feedback*) e atualização instantânea de estado na interface, com propagação assíncrona para o cache local e nuvem.

3. **Hábitos Recorrentes e Tarefas Pontuais**
   - Definição de horários planejados com suporte a máscaras rápidas (HH:mm) e atalhos frequentes.
   - Duração estimada parametrizada em blocos focados (`15m`, `30m`, `45m`, `1h`).
   - Frequência configurável para hábitos: diária (todos os dias) ou semanal (seleção específica de dias com atalhos para dias úteis ou finais de semana).
   - Categorias contextuais (*Saúde*, *Foco*, *Trabalho*, *Estudos*, *Pessoal*).

4. **Detalhes e Ajustes Rápidos**
   - Painel de detalhes dedicado com stepper de micro-ajustes rápidos de horário em intervalos de `±15 min` sem necessidade de reabrir o formulário completo.
   - Bloco de **Notas Pessoais** com limite ergonômico de 280 caracteres para reflexões, instruções ou contexto do item.
   - Exclusão com confirmação preventiva e atalhos diretos para edição.

5. **Lembretes Locais e Conquistas**
   - Agendamento de notificações locais diretamente no sistema operacional (`expo-notifications`), sem dependência de infraestrutura externa de mensageria.
   - Acompanhamento de consistência baseado em contadores reais e marcos atingidos.

---

## 🛠 Stack Tecnológica

- **Core & Runtime:** [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 58)
- **Navegação & Roteamento:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing com suporte a abas nativas e modais)
- **Linguagem & Tipagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Gestos & Animações:** [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) + [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Design System:** Tema *Warm Obsidian Terracotta* (Dark Mode ergonômico de alto contraste)
- **Backend as a Service (BaaS):** [Firebase JS SDK](https://firebase.google.com/docs/web/setup) (Firebase Auth & Cloud Firestore com cache offline nativo)
- **Notificações:** [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) (100% locais)
- **Qualidade de Código:** ESLint + TypeScript Compiler (`tsc`)

---

## 📁 Estrutura do Projeto

O repositório adota arquitetura modular com separação estrita de responsabilidades:

```text
src/
├── app/                  # Rotas e telas da aplicação (Expo Router)
│   ├── (tabs)/           # Abas principais (Rotina, Conquistas, Ajustes)
│   ├── item-form.tsx     # Modal de criação e edição de hábitos/tarefas
│   └── item-details.tsx  # Tela de detalhes e micro-ajustes do item
├── components/           # Componentes modulares (pasta dedicada com index + styles)
│   ├── app-tabs/         # Navegação por abas com variantes de plataforma
│   ├── routine/          # Componentes do domínio de rotina
│   │   ├── greeting-section/
│   │   ├── progress-card/
│   │   ├── empty-routine-state/
│   │   ├── routine-header/
│   │   ├── routine-item-card/
│   │   ├── item-form/    # Seletores de tipo, duração, recorrência e horários
│   │   └── item-details/ # Headers, steppers de horário e notas pessoais
│   ├── themed-text/      # Tipografia padronizada do design system
│   └── themed-view/      # Contêineres tematizados
├── constants/            # Tokens visuais do tema e cores
├── hooks/                # Hooks customizados para regras de apresentação e estado
├── repositories/         # Camada de abstração e acesso a dados (Firestore / In-Memory)
├── services/             # Instanciação de serviços e injeção de dependências
├── types/                # Definições de tipos e interfaces de domínio
└── utils/                # Funções puras de formatação, cálculo e validação
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.
- Gerenciador de pacotes `npm`.
- Para execução em dispositivo móvel/emulador:
  - Ambiente Android Studio / SDK configurado (para compilação local via Dev Client), **ou**
  - O binário de desenvolvimento (`.apk` Dev Client) instalado no aparelho físico / emulador via EAS Build.

### 1. Clonar o repositório
```bash
git clone https://github.com/PedroVilelaPera/rotina.git
cd rotina
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Execução em Desenvolvimento (Expo Dev Client)

Como o projeto utiliza recursos nativos de notificações (`expo-notifications`) com canais personalizados no Android, a execução utiliza o **Expo Dev Client**:

#### Opção A: Compilação nativa direta no emulador ou dispositivo conectado via USB
```bash
# Compilar e abrir diretamente no Android
npm run android

# Compilar e abrir no simulador iOS (requer macOS)
npm run ios
```

#### Opção B: Iniciar apenas o Metro Bundler (com a Dev Build já instalada no aparelho)
```bash
npm start
```
Ao iniciar o Metro, escaneie o QR Code usando a câmera do seu dispositivo com a Dev Build instalada (ou pressione `a` para abrir no emulador Android).

### Comandos de Atalho
- Iniciar servidor de desenvolvimento: `npm start`
- Compilar e rodar no Android: `npm run android`
- Iniciar versão Web: `npm run web`
- Gerar build preview do APK Android: `npm run build:android:preview`

---

## 🔍 Verificação Técnica & Linters

Para validar a integridade estática e a formatação do código:

```bash
# Validação de tipagem TypeScript (Strict)
npx tsc --noEmit

# Análise estática com ESLint
npx eslint .
```

---

## 👥 Equipe & Frentes de Desenvolvimento

- **Auth & Infraestrutura:** Álvaro Kayc (`@alvarokaycss`)
- **Rotina & Core:** João Guilherme Barros (`@JoaoGuiBarros`)
- **Lembretes & Conquistas:** Pedro Vilela Pereira (`@PedroVilelaPera`)
- **Orientação / Docente:** Profa. Mayana Duarte (Desenvolvimento Mobile II — IFPE Campus Garanhuns)
