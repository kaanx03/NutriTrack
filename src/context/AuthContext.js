// src/context/AuthContext.js - Fixed with Real User
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

const API_URL = "http://10.0.2.2:3001/api"; // Backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Debug için loglar
  useEffect(() => {
    console.log("🔐 AuthContext state:", {
      userId: user?.id,
      userEmail: user?.email,
      hasToken: !!token,
      isAuthenticated,
      isLoading,
    });
  }, [user, token, isAuthenticated, isLoading]);

  // Uygulama başlatıldığında token'ı kontrol et
  useEffect(() => {
    checkAuthState();
  }, []);

  // AsyncStorage'dan token ve user bilgilerini yükle
  const checkAuthState = async () => {
    try {
      console.log("🔍 Checking auth state...");

      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("userData");

      console.log("📦 Stored token exists:", !!storedToken);
      console.log("📦 Stored user exists:", !!storedUser);

      if (storedToken && storedUser) {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);

        console.log("✅ User loaded from storage:", {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
        });

        // Token'ın geçerliliğini kontrol et
        await validateToken(storedToken);
      } else {
        console.log("❌ No stored auth data found");
      }
    } catch (error) {
      console.error("❌ Auth state check error:", error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Token geçerliliğini backend'den kontrol et
  const validateToken = async (authToken) => {
    try {
      console.log("🔑 Validating token...");

      const response = await fetch(`${API_URL}/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔑 Token validation response status:", response.status);

      if (!response.ok) {
        throw new Error("Token geçersiz");
      }

      const data = await response.json();
      console.log("🔑 Token validation data:", data);

      if (!data.success) {
        throw new Error("Token doğrulanamadı");
      }

      console.log("✅ Token is valid");
    } catch (error) {
      console.error("❌ Token validation error:", error);
      await logout();
    }
  };

  // Login fonksiyonu
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log("🚀 Attempting login for:", email);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 Login response status:", response.status);
      const data = await response.json();
      console.log("📦 Login response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Giriş başarısız");
      }

      // Backend response formatına göre token ve user'ı al
      const { token: authToken, user: userData } = data;

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      // AsyncStorage'a kaydet
      await AsyncStorage.setItem("authToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      console.log("✅ Login successful, user:", {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
      });

      return { success: true, user: userData };
    } catch (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: error.message || "Giriş yapılamadı",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register fonksiyonu
  const register = async (userData) => {
    try {
      setIsLoading(true);
      console.log("🚀 Attempting registration for:", userData.email);

      // Backend'in beklediği format
      const registrationData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || "",
        gender: userData.gender,
        birthDate: userData.birthDate,
        height: parseInt(userData.height) || null,
        weight: parseFloat(userData.weight) || null,
        activityLevel: parseInt(userData.activityLevel) || 3,
      };

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      console.log("📡 Registration response status:", response.status);
      const data = await response.json();
      console.log("📦 Registration response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Kayıt başarısız");
      }

      // Backend response formatına göre token ve user'ı al
      const { token: authToken, user: newUser } = data;

      setToken(authToken);
      setUser(newUser);
      setIsAuthenticated(true);

      // AsyncStorage'a kaydet
      await AsyncStorage.setItem("authToken", authToken);
      await AsyncStorage.setItem("userData", JSON.stringify(newUser));

      console.log("✅ Registration successful, user:", {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
      });

      return { success: true, user: newUser };
    } catch (error) {
      console.error("❌ Register error:", error);
      return {
        success: false,
        error: error.message || "Kayıt oluşturulamadı",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout fonksiyonu
  const logout = async () => {
    try {
      console.log("🚪 Logging out...");

      // Local state'i temizle
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      // AsyncStorage'ı temizle
      await AsyncStorage.multiRemove(["authToken", "userData"]);

      console.log("✅ Logout completed");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  // Token'ı al (API istekleri için)
  const getToken = async () => {
    if (token) {
      return token;
    }

    // Token yoksa AsyncStorage'dan yükle
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error("❌ Token retrieval error:", error);
    }

    return null;
  };

  // User bilgilerini güncelle
  const updateUser = async (newUserData) => {
    try {
      const updatedUser = { ...user, ...newUserData };
      setUser(updatedUser);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
      console.log("✅ User updated:", updatedUser);
      return { success: true };
    } catch (error) {
      console.error("❌ User update error:", error);
      return { success: false, error: error.message };
    }
  };

  // User profile'ı backend'den yükle
  const loadUserProfile = async () => {
    try {
      console.log("📊 Loading user profile from backend...");

      const authToken = await getToken();
      if (!authToken) {
        console.log("❌ No token available for profile load");
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Profile response status:", response.status);

      if (!response.ok) {
        throw new Error("Profile yüklenemedi");
      }

      const data = await response.json();
      console.log("📦 Profile data:", data);

      if (data.success && data.user) {
        setUser(data.user);
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));
        console.log("✅ Profile updated successfully");
      }
    } catch (error) {
      console.error("❌ Profile loading error:", error);
    }
  };

  // Test için manual login fonksiyonu - GERÇEK KULLANıCI BİLGİLERİ
  const testLogin = async () => {
    console.log("🧪 Testing with REAL credentials...");

    // GERÇEK kullanıcı bilgileri
    const result = await login("kaanx@hotmail.com", "123qweasdzxC@");

    if (result.success) {
      console.log("✅ Test login successful!");
    } else {
      console.log("❌ Test login failed:", result.error);
    }

    return result;
  };

  const value = {
    // State'ler
    user,
    token,
    isLoading,
    isAuthenticated,

    // Fonksiyonlar
    login,
    register,
    logout,
    getToken,
    updateUser,
    validateToken,
    checkAuthState,
    loadUserProfile,
    testLogin, // Debug için
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
