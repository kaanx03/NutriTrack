// src/context/WaterContext.js - BACKEND COMPATIBLE VERSION
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const WaterContext = createContext();

const API_URL = "http://10.0.2.2:3001/api"; // Sizin backend URL'iniz

export const WaterProvider = ({ children }) => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [waterLogs, setWaterLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayDate, setTodayDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // AUTH TOKEN'I AL
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      console.log("WaterContext - Got auth token:", !!token);
      return token;
    } catch (error) {
      console.error("Token alma hatası:", error);
      return null;
    }
  };

  // Bugünün tarihini kontrol et ve gerekirse resetle
  useEffect(() => {
    const checkDate = () => {
      const currentDate = new Date().toISOString().split("T")[0];
      if (currentDate !== todayDate) {
        console.log("WaterContext - Date changed, resetting data");
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
      console.log("WaterContext - Loading water data for date:", date);

      const token = await getAuthToken();
      if (!token) {
        console.log("WaterContext - No auth token available");
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

      console.log("WaterContext - API Response status:", response.status);
      const data = await response.json();
      console.log("WaterContext - API Response data:", data);

      if (data.success) {
        const totalConsumed = data.data.summary.totalConsumed || 0;
        const dailyGoal = data.data.summary.dailyGoal || 2500;
        const logs = data.data.logs || [];

        setWaterIntake(totalConsumed);
        setWaterGoal(dailyGoal);
        setWaterLogs(logs);

        // Local cache'e kaydet
        await saveToLocalCache(totalConsumed, logs);

        console.log("WaterContext - Data loaded:", {
          totalConsumed,
          dailyGoal,
          logsCount: logs.length,
        });
      } else {
        throw new Error(data.error || "Su verileri yüklenemedi");
      }
    } catch (error) {
      console.error("WaterContext - Su verileri yükleme hatası:", error);
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
      console.log("WaterContext - Cannot increase water:", {
        hasToken: !!token,
        amount,
      });
      Alert.alert("Hata", "Su eklemek için giriş yapmalısınız.");
      return;
    }

    // Mevcut değerleri al
    const currentIntake = waterIntake;
    const currentLogs = [...waterLogs];

    console.log("WaterContext - Increasing water:", { amount, currentIntake });

    // OPTIMISTIC UPDATE: Önce local state'i güncelle
    const optimisticIntake = currentIntake + amount;
    setWaterIntake(optimisticIntake);

    try {
      console.log("WaterContext - Sending to backend:", {
        amount, // YOUR BACKEND EXPECTS amount
        date: todayDate,
        time: new Date().toISOString(),
      });

      // YOUR BACKEND ENDPOINT: POST /tracker/water
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

      console.log("WaterContext - Backend response status:", response.status);
      const data = await response.json();
      console.log("WaterContext - Backend response data:", data);

      if (data.success) {
        // Backend'den dönen yeni log'u ekle
        const newLog = data.data;
        const newLogs = [...currentLogs, newLog];
        setWaterLogs(newLogs);

        // Local cache'e kaydet
        await saveToLocalCache(optimisticIntake, newLogs);

        console.log("WaterContext - Su kaydı başarıyla eklendi");
        console.log("WaterContext - New logs count:", newLogs.length);
      } else {
        // Backend başarısız olursa state'i geri al
        console.log(
          "WaterContext - Backend error, reverting to:",
          currentIntake
        );
        setWaterIntake(currentIntake);
        throw new Error(data.error || data.details || "Su kaydı eklenemedi");
      }
    } catch (error) {
      console.error("WaterContext - Su ekleme hatası:", error);

      // Hata durumunda state'i geri al
      setWaterIntake(currentIntake);
      Alert.alert(
        "Hata",
        "Su kaydı eklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin."
      );
    }
  };

  // Su azaltma - BACKEND COMPATIBLE
  const decreaseWater = async (amount) => {
    const token = await getAuthToken();

    if (!token || amount <= 0 || waterIntake <= 0) {
      console.log("WaterContext - Cannot decrease water:", {
        hasToken: !!token,
        amount,
        currentIntake: waterIntake,
      });

      if (!token) {
        Alert.alert("Hata", "Su azaltmak için giriş yapmalısınız.");
      } else if (waterIntake <= 0) {
        Alert.alert("Uyarı", "Su miktarı zaten 0. Azaltılacak bir şey yok.");
      }
      return;
    }

    try {
      console.log("WaterContext - Fetching fresh data before decrease");

      // FRESH DATA: YOUR BACKEND ENDPOINT
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
      console.log("WaterContext - Fresh logs count:", freshLogs.length);

      // Bugünün loglarını filtrele ve sırala (fresh data'da zaten bugünün verileri var)
      const todayLogs = freshLogs
        .filter((log) => log && log.id) // Valid logs only
        .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));

      console.log("WaterContext - Today's fresh logs found:", todayLogs.length);

      if (todayLogs.length === 0) {
        console.warn("WaterContext - No logs found for today");
        Alert.alert(
          "Uyarı",
          "Bugün için silinecek su kaydı bulunamadı. Önce su ekleyin."
        );
        return;
      }

      // En son log'u al
      const lastLog = todayLogs[0];
      console.log("WaterContext - Last log to delete:", {
        id: lastLog.id,
        amount: lastLog.amount_ml,
        logged_at: lastLog.logged_at,
      });

      // Mevcut değerleri sakla
      const currentIntake = waterIntake;

      // OPTIMISTIC UPDATE: Local state'i hemen güncelle
      const newIntake = Math.max(0, currentIntake - lastLog.amount_ml);
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

      console.log(
        "WaterContext - Delete response status:",
        deleteResponse.status
      );
      const deleteData = await deleteResponse.json();
      console.log("WaterContext - Delete response data:", deleteData);

      if (deleteData.success) {
        // Log'u listeden çıkar
        const newLogs = freshLogs.filter((log) => log.id !== lastLog.id);
        setWaterLogs(newLogs);

        // Local cache'e kaydet
        await saveToLocalCache(newIntake, newLogs);

        console.log("WaterContext - Su kaydı başarıyla silindi");
      } else {
        // Backend hatası durumunda state'i geri al
        console.error(
          "WaterContext - Backend delete failed:",
          deleteData.error || deleteData.details
        );
        setWaterIntake(currentIntake);
        throw new Error(
          deleteData.error || deleteData.details || "Su kaydı silinemedi"
        );
      }
    } catch (error) {
      console.error("WaterContext - Su azaltma hatası:", error);

      // Kullanıcıya hata mesajı göster
      Alert.alert(
        "Hata",
        `Su kaydı silinirken bir hata oluştu: ${error.message}`
      );
    }
  };

  // Su sıfırlama
  const resetWater = async () => {
    try {
      console.log("WaterContext - Resetting water data");
      setWaterIntake(0);
      setWaterLogs([]);
      await AsyncStorage.removeItem(`waterCache_user_${todayDate}`);
    } catch (error) {
      console.error("WaterContext - Su sıfırlama hatası:", error);
    }
  };

  // Su hedefini güncelle - basit version
  const updateWaterGoal = async (newGoal) => {
    if (newGoal <= 0 || newGoal > 10000) {
      Alert.alert("Hata", "Su hedefi 500-5000 ml arasında olmalıdır.");
      return;
    }

    // Şimdilik sadece local state'i güncelle
    setWaterGoal(newGoal);
    console.log("WaterContext - Su hedefi güncellendi:", newGoal);
  };

  // Local cache'e kaydet
  const saveToLocalCache = async (intake, logs) => {
    try {
      const cacheData = {
        waterIntake: intake,
        waterLogs: logs,
        waterGoal: waterGoal,
        lastUpdated: new Date().toISOString(),
        date: todayDate,
      };

      await AsyncStorage.setItem(
        `waterCache_user_${todayDate}`,
        JSON.stringify(cacheData)
      );

      console.log("WaterContext - Data saved to cache");
    } catch (error) {
      console.error("WaterContext - Local cache kaydetme hatası:", error);
    }
  };

  // Local cache'den yükle
  const loadFromLocalCache = async () => {
    try {
      const cacheKey = `waterCache_user_${todayDate}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);

        // Cache verilerinin bugünün tarihi ile uyumlu olup olmadığını kontrol et
        if (parsed.date === todayDate) {
          setWaterIntake(parsed.waterIntake || 0);
          setWaterLogs(parsed.waterLogs || []);
          setWaterGoal(parsed.waterGoal || 2500);
          console.log("WaterContext - Su verileri local cache'den yüklendi");
        } else {
          console.log(
            "WaterContext - Cache verileri eski tarihli, temizleniyor"
          );
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error("WaterContext - Local cache yükleme hatası:", error);
    }
  };

  // Manual refresh
  const refreshData = async () => {
    console.log("WaterContext - Manual refresh requested");
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
