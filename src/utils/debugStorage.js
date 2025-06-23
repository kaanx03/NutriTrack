// src/utils/debugStorage.js - AsyncStorage Debug Helper
import AsyncStorage from "@react-native-async-storage/async-storage";

class DebugStorage {
  // AsyncStorage'daki tüm auth verilerini göster
  static async checkAuthStorage() {
    try {
      console.log("🔍 DEBUG: Checking AsyncStorage for auth data...");

      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      console.log("📦 DEBUG: AsyncStorage Auth Data:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.slice(0, 20)}...` : null,
        hasUserData: !!userData,
        userData: userData ? JSON.parse(userData) : null,
      });

      return {
        token,
        userData: userData ? JSON.parse(userData) : null,
      };
    } catch (error) {
      console.error("❌ DEBUG: AsyncStorage check error:", error);
      return { token: null, userData: null };
    }
  }

  // AsyncStorage'ı tamamen temizle
  static async clearAllStorage() {
    try {
      console.log("🗑️ DEBUG: Clearing all AsyncStorage data...");
      await AsyncStorage.clear();
      console.log("✅ DEBUG: AsyncStorage cleared");
    } catch (error) {
      console.error("❌ DEBUG: Clear storage error:", error);
    }
  }

  // AsyncStorage'daki tüm key'leri listele
  static async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log("🔑 DEBUG: All AsyncStorage keys:", keys);

      const values = await AsyncStorage.multiGet(keys);
      const storage = {};

      values.forEach(([key, value]) => {
        try {
          storage[key] = value ? JSON.parse(value) : value;
        } catch {
          storage[key] = value; // String olarak bırak
        }
      });

      console.log("📦 DEBUG: All AsyncStorage data:", storage);
      return storage;
    } catch (error) {
      console.error("❌ DEBUG: Get all keys error:", error);
      return {};
    }
  }

  // Manuel olarak auth data'yı set et (testing için)
  static async setTestAuthData() {
    try {
      console.log("🧪 DEBUG: Setting test auth data...");

      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      const testUser = {
        id: 1,
        email: "kaanx@hotmail.com",
        firstName: "Test",
        lastName: "User",
      };

      await AsyncStorage.setItem("authToken", testToken);
      await AsyncStorage.setItem("userData", JSON.stringify(testUser));

      console.log("✅ DEBUG: Test auth data set");
      return { token: testToken, user: testUser };
    } catch (error) {
      console.error("❌ DEBUG: Set test auth data error:", error);
      return null;
    }
  }

  // Auth token'ı manuel doğrula
  static async validateTokenManually(token) {
    try {
      console.log("🔑 DEBUG: Manual token validation...");

      const response = await fetch("http://10.0.2.2:3001/api/auth/verify", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 DEBUG: Validation response status:", response.status);

      const data = await response.json();
      console.log("📦 DEBUG: Validation response data:", data);

      return {
        status: response.status,
        data: data,
        isValid: response.ok && data.success,
      };
    } catch (error) {
      console.error("❌ DEBUG: Manual token validation error:", error);
      return {
        status: 0,
        data: null,
        isValid: false,
        error: error.message,
      };
    }
  }

  // Backend'e test login yap
  static async testLogin() {
    try {
      console.log("🧪 DEBUG: Testing login with real credentials...");

      const response = await fetch("http://10.0.2.2:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "kaanx@hotmail.com",
          password: "123qweasdzxC@",
        }),
      });

      console.log("📡 DEBUG: Test login response status:", response.status);

      const data = await response.json();
      console.log("📦 DEBUG: Test login response data:", data);

      if (data.success && data.token && data.user) {
        // Test data'yı storage'a kaydet
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
        console.log("✅ DEBUG: Test login successful and saved to storage");
      }

      return data;
    } catch (error) {
      console.error("❌ DEBUG: Test login error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Global olarak erişilebilir debug fonksiyonları
if (__DEV__) {
  global.debugAuth = DebugStorage.checkAuthStorage;
  global.debugClearStorage = DebugStorage.clearAllStorage;
  global.debugAllKeys = DebugStorage.getAllKeys;
  global.debugSetTestAuth = DebugStorage.setTestAuthData;
  global.debugValidateToken = DebugStorage.validateTokenManually;
  global.debugTestLogin = DebugStorage.testLogin;
}

export default DebugStorage;
