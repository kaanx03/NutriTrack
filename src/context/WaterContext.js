// src/context/WaterContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { API_URL } from "../config";
import NotificationService, {
  WATER_SETTINGS_KEY,
} from "../services/NotificationService";

const WaterContext = createContext();
const TOKEN_KEY = "authToken";

function getUserIdFromToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.userId || "anon";
  } catch {
    return "anon";
  }
}

export const WaterProvider = ({ children }) => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [waterLogs, setWaterLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // backend erişilemedi (cache gösterilir)
  const [todayDate, setTodayDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("WaterContext - Token alma hatası:", error);
      return null;
    }
  };

  // Bugünün tarihini kontrol et ve gerekirse resetle
  useEffect(() => {
    const checkDate = () => {
      const currentDate = new Date().toISOString().split("T")[0];
      if (currentDate !== todayDate) {
        setTodayDate(currentDate);
        setWaterIntake(0);
        setWaterLogs([]);
        loadTodayWaterData(currentDate);
      }
    };

    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [todayDate]);

  // Component mount olunca su verilerini yükle
  useEffect(() => {
    loadTodayWaterData();
    loadWaterGoal();
  }, []);

  // Bugünün su verilerini yükle - BACKEND COMPATIBLE
  const loadTodayWaterData = async (date = todayDate) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        await loadFromLocalCache();
        return;
      }

      // YOUR BACKEND ENDPOINT: /tracker/water/daily/:date
      const response = await fetch(`${API_URL}/tracker/water/daily/${date}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        const totalConsumed = data.data.summary.totalConsumed || 0;
        const dailyGoal = data.data.summary.dailyGoal || 2500;
        const logs = data.data.logs || [];

        setWaterIntake(totalConsumed);
        setWaterGoal(dailyGoal);
        setWaterLogs(logs);

        // Local cache'e kaydet
        await saveToLocalCache(totalConsumed, logs);
      } else {
        throw new Error(data.error || "Failed to load water data");
      }
    } catch (error) {
      console.error("WaterContext - Su verileri yükleme hatası:", error);
      setError(error.message || "load_failed");
      await loadFromLocalCache();
    } finally {
      setLoading(false);
    }
  };

  // Su hedefini backend'den yükle - USER TARGETS
  const loadWaterGoal = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Bu endpoint yoksa varsayılan hedefi kullan
      setWaterGoal(2500); // Varsayılan hedef

      // Eğer user settings endpoint'iniz varsa:
      // const response = await fetch(`${API_URL}/user/settings`, { ... });
    } catch (error) {
      console.error("WaterContext - Su hedefi yükleme hatası:", error);
    }
  };

  // Su ekleme - BACKEND COMPATIBLE
  const increaseWater = async (amount) => {
    const token = await getAuthToken();

    if (!token || amount <= 0) {
      Alert.alert("Error", "You must be logged in to add water.");
      return;
    }

    const currentIntake = waterIntake;
    const currentLogs = [...waterLogs];

    // OPTIMISTIC UPDATE: Önce local state'i güncelle
    const optimisticIntake = currentIntake + amount;
    setWaterIntake(optimisticIntake);

    try {
      const response = await fetch(`${API_URL}/tracker/water`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount, // YOUR BACKEND EXPECTS amount
          date: todayDate,
          time: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newLog = data.data;
        const newLogs = [...currentLogs, newLog];
        setWaterLogs(newLogs);
        await saveToLocalCache(optimisticIntake, newLogs);

        // "Stop When 100%": hedefe ulaşıldıysa ve ayar açıksa
        // su hatırlatıcı bildirimlerini durdur
        if (optimisticIntake >= waterGoal) {
          try {
            const raw = await AsyncStorage.getItem(WATER_SETTINGS_KEY);
            const prefs = raw ? JSON.parse(raw) : {};
            if (prefs.stopWhenComplete) {
              await NotificationService.cancelWaterReminders();
            }
          } catch (e) {
            // ayar okunamadı — hatırlatıcılara dokunma
          }
        }
      } else {
        setWaterIntake(currentIntake);
        throw new Error(data.error || data.details || "Failed to add water log");
      }
    } catch (error) {
      console.error("WaterContext - Su ekleme hatası:", error);

      // Hata durumunda state'i geri al
      setWaterIntake(currentIntake);
      Alert.alert(
        "Error",
        "Failed to add water log. Please check your internet connection."
      );
    }
  };

  // Su azaltma - BACKEND COMPATIBLE
  const decreaseWater = async (amount) => {
    const token = await getAuthToken();

    if (!token || amount <= 0 || waterIntake <= 0) {
      if (!token) {
        Alert.alert("Error", "You must be logged in to remove water.");
      } else if (waterIntake <= 0) {
        Alert.alert("Warning", "Water intake is already 0. Nothing to remove.");
      }
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/tracker/water/daily/${todayDate}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const freshData = await response.json();

      if (!freshData.success) {
        throw new Error("Güncel veriler alınamadı");
      }

      const freshLogs = freshData.data.logs || [];

      // Bugünün loglarını filtrele ve sırala (fresh data'da zaten bugünün verileri var)
      const todayLogs = freshLogs
        .filter((log) => log && log.id) // Valid logs only
        .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));

      if (todayLogs.length === 0) {
        Alert.alert(
          "Warning",
          "No water logs found for today. Add some water first."
        );
        return;
      }

      const lastLog = todayLogs[0];
      const currentIntake = waterIntake;

      // OPTIMISTIC UPDATE: Local state'i hemen güncelle
      // amount_ml her zaman sayıya çevrilir (NaN'a karşı koruma)
      const lastAmount = parseInt(lastLog.amount_ml, 10) || 0;
      const newIntake = Math.max(0, currentIntake - lastAmount);
      setWaterIntake(newIntake);

      // YOUR BACKEND ENDPOINT: DELETE /tracker/water/:logId
      const deleteResponse = await fetch(
        `${API_URL}/tracker/water/${lastLog.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const deleteData = await deleteResponse.json();

      if (deleteData.success) {
        const newLogs = freshLogs.filter((log) => log.id !== lastLog.id);
        setWaterLogs(newLogs);
        await saveToLocalCache(newIntake, newLogs);
      } else {
        setWaterIntake(currentIntake);
        throw new Error(
          deleteData.error || deleteData.details || "Failed to delete water log"
        );
      }
    } catch (error) {
      console.error("WaterContext - decrease water error:", error);

      Alert.alert(
        "Error",
        `Failed to delete water log: ${error.message}`
      );
    }
  };

  // Su sıfırlama
  const resetWater = async () => {
    try {
      const token = await getAuthToken();
      const uid = token ? getUserIdFromToken(token) : "anon";
      setWaterIntake(0);
      setWaterLogs([]);
      await AsyncStorage.removeItem(`waterCache_${uid}_${todayDate}`);
    } catch (error) {
      console.error("WaterContext - Su sıfırlama hatası:", error);
    }
  };

  // Su hedefini güncelle — backend'e de kaydet
  const updateWaterGoal = async (newGoal) => {
    if (newGoal <= 0 || newGoal > 10000) {
      Alert.alert("Error", "Water goal must be between 500 and 5000 ml.");
      return;
    }

    const previousGoal = waterGoal;
    setWaterGoal(newGoal);

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/settings/water`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ water_intake_goal: newGoal }),
      });

      const data = await response.json();
      if (!data.success) {
        setWaterGoal(previousGoal);
        console.error("WaterContext - Su hedefi backend'e kaydedilemedi:", data.error);
      }
    } catch (error) {
      console.error("WaterContext - Su hedefi güncelleme hatası:", error);
      setWaterGoal(previousGoal);
    }
  };

  const getCacheKey = async () => {
    const token = await getAuthToken();
    const uid = token ? getUserIdFromToken(token) : "anon";
    return `waterCache_${uid}_${todayDate}`;
  };

  // Local cache'e kaydet
  const saveToLocalCache = async (intake, logs) => {
    try {
      const key = await getCacheKey();
      await AsyncStorage.setItem(key, JSON.stringify({
        waterIntake: intake,
        waterLogs: logs,
        waterGoal,
        lastUpdated: new Date().toISOString(),
        date: todayDate,
      }));
    } catch (error) {
      console.error("WaterContext - Local cache kaydetme hatası:", error);
    }
  };

  // Local cache'den yükle
  const loadFromLocalCache = async () => {
    try {
      const key = await getCacheKey();
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === todayDate) {
          setWaterIntake(parsed.waterIntake || 0);
          setWaterLogs(parsed.waterLogs || []);
          setWaterGoal(parsed.waterGoal || 2500);
        } else {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("WaterContext - Local cache yükleme hatası:", error);
    }
  };

  // Manual refresh
  const refreshData = async () => {
    await loadTodayWaterData();
  };

  // Su yüzdesini hesapla
  const getWaterPercentage = () => {
    return Math.min((waterIntake / waterGoal) * 100, 100);
  };

  // Kalan su miktarını hesapla
  const getRemainingWater = () => {
    return Math.max(0, waterGoal - waterIntake);
  };

  // Günlük su hedefine ulaşıldı mı?
  const isGoalReached = () => {
    return waterIntake >= waterGoal;
  };

  // Bugünkü log sayısı
  const getTodayLogCount = () => {
    return waterLogs.length;
  };

  const value = {
    // State'ler
    waterIntake,
    waterGoal,
    waterLogs,
    loading,
    error,
    todayDate,

    // Ana fonksiyonlar
    increaseWater,
    decreaseWater,
    resetWater,
    updateWaterGoal,
    loadTodayWaterData,
    refreshData,

    // Hesaplanan değerler
    getWaterPercentage,
    getRemainingWater,
    isGoalReached,
    getTodayLogCount,
  };

  return (
    <WaterContext.Provider value={value}>{children}</WaterContext.Provider>
  );
};

export const useWater = () => {
  const context = useContext(WaterContext);
  if (!context) {
    throw new Error("useWater must be used within a WaterProvider");
  }
  return context;
};
