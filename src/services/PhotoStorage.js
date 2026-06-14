// src/services/PhotoStorage.js
// Profil ve progress fotoğraflarının LOKAL depolaması.
// Dosyalar documentDirectory altında (kalıcı), metadata AsyncStorage'da.
// Backend'e upload YOK (kullanıcı kararı).
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_DIR = `${FileSystem.documentDirectory}profile/`;
const progressDir = (userId) =>
  `${FileSystem.documentDirectory}progress/${userId}/`;

const profileKey = (userId) => `profilePhoto:${userId}`;
const progressKey = (userId) => `progressPhotos:${userId}`;

async function ensureDir(dir) {
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => {}
  );
}

const PhotoStorage = {
  // ── Profil fotoğrafı ────────────────────────────────
  async saveProfilePhoto(userId, pickerUri) {
    await ensureDir(PROFILE_DIR);
    const dest = `${PROFILE_DIR}${userId}.jpg`;
    // Aynı dosya adına kopyalandığı için render'da ?t=updatedAt ile cache-bust gerekir
    await FileSystem.copyAsync({ from: pickerUri, to: dest });
    const meta = { uri: dest, updatedAt: Date.now() };
    await AsyncStorage.setItem(profileKey(userId), JSON.stringify(meta));
    return meta;
  },

  async getProfilePhoto(userId) {
    try {
      const raw = await AsyncStorage.getItem(profileKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async deleteProfilePhoto(userId) {
    await FileSystem.deleteAsync(`${PROFILE_DIR}${userId}.jpg`, {
      idempotent: true,
    }).catch(() => {});
    await AsyncStorage.removeItem(profileKey(userId));
  },

  // ── Progress fotoğrafları ───────────────────────────
  async addProgressPhoto(userId, pickerUri, { weight } = {}) {
    const dir = progressDir(userId);
    await ensureDir(dir);
    const id = Date.now().toString();
    const dest = `${dir}${id}.jpg`;
    await FileSystem.copyAsync({ from: pickerUri, to: dest });

    const entry = {
      id,
      uri: dest,
      dateISO: new Date().toISOString(),
      weight: weight ?? null,
    };
    const list = await this.getProgressPhotos(userId);
    list.unshift(entry);
    await AsyncStorage.setItem(progressKey(userId), JSON.stringify(list));
    return entry;
  },

  async getProgressPhotos(userId) {
    try {
      const raw = await AsyncStorage.getItem(progressKey(userId));
      const list = raw ? JSON.parse(raw) : [];
      // Yeniden eskiye sıralı tut
      return list.sort((a, b) => (a.id < b.id ? 1 : -1));
    } catch (e) {
      return [];
    }
  },

  async deleteProgressPhoto(userId, id) {
    const list = await this.getProgressPhotos(userId);
    const entry = list.find((p) => p.id === id);
    if (entry) {
      await FileSystem.deleteAsync(entry.uri, { idempotent: true }).catch(
        () => {}
      );
    }
    const next = list.filter((p) => p.id !== id);
    await AsyncStorage.setItem(progressKey(userId), JSON.stringify(next));
    return next;
  },
};

export default PhotoStorage;
