import { AndroidImportance, setNotificationChannelAsync, setNotificationHandler } from "expo-notifications";
import { Platform } from "react-native";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications() {
  if (Platform.OS !== "android") return;

  await setNotificationChannelAsync("habit-reminders", {
    name: "Lembretes de hábitos",
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E07A5F",
  });
}
