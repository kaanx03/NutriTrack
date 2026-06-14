// src/services/NotificationService.js
// Yerel bildirimler (su içme hatırlatıcısı vb.)
// Not: Özel zil sesleri development build gerektirir (app.json'daki
// expo-notifications plugin'i sesleri native tarafa gömer). Expo Go'da
// sistem varsayılan sesine düşer. Hatalar sessizce yutulur, çağıran
// taraf dönüş değerine göre kullanıcıyı bilgilendirir.
import { Platform } from "react-native";

// expo-notifications SDK 53+'tan beri Expo Go'nun ANDROID sürümünde YOK —
// statik import uygulamayı açılışta çökertir ("Something went wrong").
// Lazy + korumalı yükleme: modül yoksa servis no-op çalışır,
// development build'de tam işlevseldir.
let Notifications = null;
try {
  Notifications = require("expo-notifications");

  // Uygulama açıkken de bildirim göster
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Expo Go (Android) — bildirim desteği yok; çağıranlar
  // { success:false, reason:"unsupported" } ile bilgilendirilir.
  Notifications = null;
}

const WATER_REMINDER_TAG = "water-reminder";

// WaterTrackerScreen ayarlarının AsyncStorage anahtarı.
// WaterContext "Stop When 100%" için de okur — değiştirme.
export const WATER_SETTINGS_KEY = "waterTrackerSettings";

// Ringtone adı → bundle edilen ses dosyası
const RINGTONE_FILES = {
  Harmony: "harmony.wav",
  Droplet: "droplet.wav",
  Ocean: "ocean.wav",
  Rain: "rain.wav",
  Classic: "classic.wav",
};

const VIBRATION_PATTERN = [0, 250, 150, 250];

class NotificationService {
  // Android'de kanal özellikleri (ses/titreşim) oluşturulduktan sonra
  // DEĞİŞTİRİLEMEZ — bu yüzden her ayar kombinasyonu için ayrı kanal id'si.
  async ensureChannel({ ringtone, soundEnabled, vibrationEnabled }) {
    if (!Notifications || Platform.OS !== "android") return undefined;

    const soundFile = soundEnabled
      ? RINGTONE_FILES[ringtone] || "default"
      : null;
    const channelId = `reminders-${(ringtone || "default").toLowerCase()}-${
      soundEnabled ? "s" : "ns"
    }-${vibrationEnabled ? "v" : "nv"}`;

    await Notifications.setNotificationChannelAsync(channelId, {
      name: `Reminders (${ringtone || "Default"})`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: soundFile, // null = sessiz
      vibrationPattern: vibrationEnabled ? VIBRATION_PATTERN : [0],
      enableVibrate: vibrationEnabled,
    });

    return channelId;
  }

  async requestPermissions() {
    if (!Notifications) return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === "granted") return true;

      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      return false;
    }
  }

  buildContent({ title, body, ringtone, soundEnabled }) {
    return {
      title,
      body,
      // iOS: dosya adı; Android: ses kanal üzerinden gelir
      sound: soundEnabled
        ? RINGTONE_FILES[ringtone] || "default"
        : undefined,
      vibrate: undefined, // Android'de kanal yönetir
      data: { tag: WATER_REMINDER_TAG },
    };
  }

  // Su hatırlatıcısını kur: intervalHours saatte bir tekrarlar.
  async scheduleWaterReminder({
    intervalHours = 2,
    ringtone = "Harmony",
    soundEnabled = true,
    vibrationEnabled = false,
  } = {}) {
    if (!Notifications) return { success: false, reason: "unsupported" };
    try {
      const granted = await this.requestPermissions();
      if (!granted) return { success: false, reason: "permission" };

      // Öncekileri temizle, üst üste binmesin
      await this.cancelWaterReminders();

      const channelId = await this.ensureChannel({
        ringtone,
        soundEnabled,
        vibrationEnabled,
      });

      await Notifications.scheduleNotificationAsync({
        content: this.buildContent({
          title: "💧 Time to drink water!",
          body: "Stay hydrated — log a glass of water in NutriTrack.",
          ringtone,
          soundEnabled,
        }),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, intervalHours) * 3600,
          repeats: true,
          channelId,
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async cancelWaterReminders() {
    if (!Notifications) return;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const item of scheduled) {
        if (item.content?.data?.tag === WATER_REMINDER_TAG) {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
      }
    } catch (error) {
      // sessizce geç — bildirim desteklenmiyor olabilir (Expo Go / Android)
    }
  }

  // Ayarlar ekranındaki "test" için: 5 sn sonra tek seferlik bildirim
  async sendTestNotification({
    ringtone = "Harmony",
    soundEnabled = true,
    vibrationEnabled = false,
  } = {}) {
    if (!Notifications) return { success: false, reason: "unsupported" };
    try {
      const granted = await this.requestPermissions();
      if (!granted) return { success: false, reason: "permission" };

      const channelId = await this.ensureChannel({
        ringtone,
        soundEnabled,
        vibrationEnabled,
      });

      await Notifications.scheduleNotificationAsync({
        content: this.buildContent({
          title: "🔔 NutriTrack",
          body: "Notifications are working!",
          ringtone,
          soundEnabled,
        }),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          channelId,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

export default new NotificationService();
