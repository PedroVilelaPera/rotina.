import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  // Garante que o canal Android existe antes de exibir o pedido de permissão.

  const current = await Notifications.getPermissionsAsync();

  // Usuário já deu autorização.
  if (current.granted) return true;

  // Caso o usuário não tenha dado a autorização, verifica se pode pedir por ela.

  // Não tenta pedir novamente se o sistema não permitir mostrar o aviso.
  if (!current.canAskAgain) return false;

  // Se o sistema permitir mostrar o aviso, pede a autorização.
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}
