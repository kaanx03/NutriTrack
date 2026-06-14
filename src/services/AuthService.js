// src/services/AuthService.js
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config";

const TOKEN_KEY = "authToken";

class AuthService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  async loadToken() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) this.token = token;
    } catch (error) {
      console.error("Token loading error:", error);
    }
  }

  async saveToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      this.token = token;
    } catch (error) {
      console.error("Token saving error:", error);
    }
  }

  async getToken() {
    if (!this.token) await this.loadToken();
    return this.token;
  }

  async clearToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      this.token = null;
    } catch (error) {
      console.error("Token clearing error:", error);
    }
  }

  async request(path, options = {}) {
    try {
      const url = `${API_URL}${path}`;
      const config = {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      };

      if (this.token && !options.skipAuth) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      if (options.body && typeof options.body === "object") {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(result.error || result.details || `HTTP Error: ${response.status}`);
      }

      return result;
    } catch (error) {
      if (error.message.includes("Network request failed") || error.message.includes("fetch")) {
        throw new Error("Cannot connect to server. Please check your connection.");
      }
      throw error;
    }
  }

  async signup(userData) {
    const backendData = {
      email:         userData.email,
      password:      userData.password,
      firstName:     userData.firstName,
      lastName:      userData.lastName,
      phoneNumber:   userData.phoneNumber || "",
      gender:        userData.gender,
      birthDate:     userData.birthDate,
      height:        parseInt(userData.height) || null,
      weight:        parseFloat(userData.weight) || null,
      activityLevel: parseInt(userData.activityLevel) || 3,
    };

    const result = await this.request("/auth/signup", { method: "POST", body: backendData, skipAuth: true });
    if (result.token) await this.saveToken(result.token);
    return result;
  }

  async login(credentials) {
    const result = await this.request("/auth/login", { method: "POST", body: credentials, skipAuth: true });
    if (result.token) await this.saveToken(result.token);
    return result;
  }

  async getUserProfile() {
    if (!this.token) throw new Error("No authentication token available");
    return this.request("/auth/profile", { method: "GET" });
  }

  async verifyToken() {
    if (!this.token) return false;
    try {
      const result = await this.request("/auth/verify", { method: "GET" });
      return result.success;
    } catch {
      await this.clearToken();
      return false;
    }
  }

  async logout() {
    await this.clearToken();
    return true;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async forgotPassword(email) {
    return this.request("/auth/forgot-password", { method: "POST", body: { email }, skipAuth: true });
  }

  async resetPassword(email, token, newPassword) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { email, token, newPassword },
      skipAuth: true,
    });
  }
}

const authService = new AuthService();
export default authService;
