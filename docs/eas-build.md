# Build Android (`.apk`) via Expo EAS Build

Guia rápido para gerar o pacote `.apk` instalável do **`rotina.`** usando o perfil `preview` definido em [eas.json](../eas.json).

## 1. Pré-requisitos
- Conta no [expo.dev](https://expo.dev) com acesso ao projeto.
- EAS CLI: `npm install -g eas-cli` (ou `npx eas-cli`).
- Autenticar na CLI: `npx eas login`.
- Vincular o projeto (caso ainda não tenha `extra.eas.projectId` em `app.json`): `npx eas init`.

## 2. Configurar Variáveis de Ambiente (Sem Expor Segredos no Git)
As chaves `EXPO_PUBLIC_FIREBASE_*` do `.env` local **nunca** devem ser commitadas em `eas.json` ou no repositório. Cadastre-as diretamente nos ambientes do EAS (ex.: `preview`):

```bash
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "..."
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..."
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "..."
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "..."
npx eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_APP_ID --value "..."
```

## 3. Gerar o `.apk`
```bash
npm run build:android:preview
```
Ao finalizar o build na nuvem, o link para download do `.apk` compatível com Android 10+ (API 29+) será exibido no terminal e no painel do Expo.
