// src/context/AuthContext.js - Direct Fix
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();
const API_URL = "http://10.0.2.2:3001/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");

      if (storedToken) {
        // Token varsa direkt backend'den user bilgisini al
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setToken(storedToken);
            setUser(data.user);
            setIsAuthenticated(true);

            // Fresh user data'yı storage'a kaydet
            await AsyncStorage.setItem("userData", JSON.stringify(data.user));
            console.log("✅ Auth restored successfully");
          } else {
            await clearAuth();
          }
        } else {
          await clearAuth();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.multiRemove(["authToken", "userData"]);
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);

        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const getToken = async () => {
    if (token) return token;
    return await AsyncStorage.getItem("authToken");
  };

  const refreshAuthState = async () => {
    await checkAuthState();
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getToken,
    refreshAuthState,
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
