// src/services/AuthService.js - Updated with Backend Integration
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:3001/api";

class AuthService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  // Token'ı AsyncStorage'dan yükle
  async loadToken() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error("Token loading error:", error);
    }
  }

  // Token'ı kaydet
  async saveToken(token) {
    try {
      await AsyncStorage.setItem("authToken", token);
      this.token = token;
    } catch (error) {
      console.error("Token saving error:", error);
    }
  }

  // Token'ı sil
  async clearToken() {
    try {
      await AsyncStorage.removeItem("authToken");
      this.token = null;
    } catch (error) {
      console.error("Token clearing error:", error);
    }
  }

  // Genel request helper
  async request(path, options = {}) {
    try {
      const url = `${API_URL}${path}`;
      console.log(`Making request to: ${url}`);

      const config = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };

      // Token varsa header'a ekle
      if (this.token && !options.skipAuth) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      if (options.body && typeof options.body === "object") {
        config.body = JSON.stringify(options.body);
      }

      console.log("Request config:", config);

      const response = await fetch(url, config);
      console.log("Response status:", response.status);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("Response data:", result);

      if (!response.ok) {
        const message =
          result.error || result.details || `HTTP Error: ${response.status}`;
        throw new Error(message);
      }

      return result;
    } catch (error) {
      console.error("Request error:", error);

      if (
        error.message.includes("Network request failed") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Backend sunucusuna bağlanılamıyor. Sunucunun çalıştığından emin olun."
        );
      }

      throw error;
    }
  }

  // Kullanıcı kaydı
  async signup(userData) {
    try {
      console.log("Signup data being sent:", userData);

      // Backend'in beklediği format
      const backendData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || "",
        gender: userData.gender,
        birthDate: userData.birthDate, // YYYY-MM-DD format
        height: parseInt(userData.height) || null,
        weight: parseFloat(userData.weight) || null,
        activityLevel: parseInt(userData.activityLevel) || 3,
      };

      const result = await this.request("/auth/signup", {
        method: "POST",
        body: backendData,
        skipAuth: true,
      });

      // Token'ı kaydet
      if (result.token) {
        await this.saveToken(result.token);
      }

      return result;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  // Kullanıcı girişi
  async login(credentials) {
    try {
      console.log("Login data being sent:", credentials);

      const result = await this.request("/auth/login", {
        method: "POST",
        body: credentials,
        skipAuth: true,
      });

      // Token'ı kaydet
      if (result.token) {
        await this.saveToken(result.token);
      }

      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Kullanıcı profilini çek
  async getUserProfile() {
    try {
      if (!this.token) {
        throw new Error("No authentication token available");
      }

      const result = await this.request("/auth/profile", {
        method: "GET",
      });

      return result;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  }

  // Token doğrulaması
  async verifyToken() {
    try {
      if (!this.token) {
        return false;
      }

      const result = await this.request("/auth/verify", {
        method: "GET",
      });

      return result.success;
    } catch (error) {
      console.error("Token verification error:", error);
      // Token geçersizse temizle
      await this.clearToken();
      return false;
    }
  }

  // Çıkış
  async logout() {
    try {
      await this.clearToken();
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // Token'ın var olup olmadığını kontrol et
  isAuthenticated() {
    return !!this.token;
  }

  // Şifre sıfırlama isteği
  async forgotPassword(email) {
    try {
      const result = await this.request("/auth/forgot-password", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });

      return result;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }
}

// Singleton instance
const authService = new AuthService();
export default authService;
