// src/utils/haptics.js
// Dokunsal geri bildirim sarmalayıcıları — desteklenmeyen ortamlarda sessizce geçer.
// Android'de expo-haptics, sistemin "dokunsal geri bildirim" ayarına bağlıdır;
// o kapalıyken titreşmeyebilir. Bu yüzden Android'de ek olarak doğrudan
// Vibration motorunu da kısa süre tetikliyoruz (daha güvenilir his).
import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";

const isIOS = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";
const supported = isIOS || isAndroid;

// Android'de kısa doğrudan titreşim (sistem haptic ayarından bağımsız)
const buzz = (ms) => {
  if (isAndroid) {
    try {
      Vibration.vibrate(ms);
    } catch (e) {
      /* titreşim desteklenmiyor — yoksay */
    }
  }
};

export const hapticLight = () => {
  if (!supported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  buzz(15);
};

export const hapticSelection = () => {
  if (!supported) return;
  Haptics.selectionAsync().catch(() => {});
  buzz(10);
};

export const hapticSuccess = () => {
  if (!supported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
  buzz(25);
};

export const hapticError = () => {
  if (!supported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => {}
  );
  buzz([0, 30, 40, 30]);
};
