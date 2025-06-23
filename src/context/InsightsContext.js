// src/context/InsightsContext.js - Simplified Version
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const InsightsContext = createContext();

const API_URL = "http://10.0.2.2:3001/api"; // Android emulator için

export const InsightsProvider = ({ children }) => {
  const { user, getToken } = useAuth();

  // State'ler
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Dashboard verileri
  const [dashboardData, setDashboardData] = useState(null);
  const [calorieData, setCalorieData] = useState(null);
  const [weightData, setWeightData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [bmiData, setBmiData] = useState(null);

  // Error handling
  const [error, setError] = useState(null);

  // Kullanıcı değiştiğinde verileri yükle
  useEffect(() => {
    if (user?.id) {
      console.log(
        "InsightsContext: User found, loading data for user:",
        user.id
      );
      loadInsightsDashboard();
    } else {
      console.log("InsightsContext: No user found");
    }
  }, [user, selectedPeriod, currentDate]);

  // Backend'den dashboard verilerini yükle
  const loadInsightsDashboard = async () => {
    if (!user?.id) {
      console.log("InsightsContext: No user ID, skipping data load");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const dateRange = calculateDateRange(selectedPeriod, currentDate);

      console.log("InsightsContext: Loading data with params:", {
        userId: user.id,
        period: selectedPeriod,
        dateRange: dateRange,
      });

      const apiUrl = `${API_URL}/insights/dashboard?period=${selectedPeriod}&startDate=${dateRange.start}&endDate=${dateRange.end}`;
      console.log("InsightsContext: API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("InsightsContext: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("InsightsContext: Response error:", errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "InsightsContext: Response received:",
        data.success ? "SUCCESS" : "FAILED"
      );

      if (data.success) {
        console.log("InsightsContext: Setting dashboard data");
        setDashboardData(data.data);
        setCalorieData(data.data.calories);
        setWeightData(data.data.weight);
        setWaterData(data.data.water);
        setNutritionData(data.data.nutrition);
        setBmiData(data.data.bmi);

        // Debug: Chart data kontrolü
        console.log("InsightsContext: Chart data lengths:", {
          calories: data.data.calories?.chart?.length || 0,
          weight: data.data.weight?.chart?.length || 0,
          water: data.data.water?.chart?.length || 0,
          nutrition: data.data.nutrition?.chart?.length || 0,
        });

        // Cache'e kaydet
        await saveDashboardCache(data.data);
      } else {
        throw new Error(data.error || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("InsightsContext: Loading error:", err.message);
      setError(err.message);

      // Cache'den yükle
      await loadFromCache();
    } finally {
      setLoading(false);
    }
  };

  // Period değiştir
  const changePeriod = (newPeriod) => {
    console.log("InsightsContext: Changing period to:", newPeriod);
    setSelectedPeriod(newPeriod);
    setCurrentDate(new Date()); // Bugüne sıfırla
  };

  // Tarih değiştir
  const changeDate = (direction) => {
    const newDate = new Date(currentDate);

    if (selectedPeriod === "weekly") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (selectedPeriod === "monthly") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (selectedPeriod === "yearly") {
      newDate.setFullYear(
        newDate.getFullYear() + (direction === "next" ? 1 : -1)
      );
    }

    setCurrentDate(newDate);
  };

  // Tarih aralığını hesapla
  const calculateDateRange = (period, date) => {
    const targetDate = new Date(date);

    if (period === "weekly") {
      const startOfWeek = new Date(targetDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff =
        startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        start: startOfWeek.toISOString().split("T")[0],
        end: endOfWeek.toISOString().split("T")[0],
      };
    } else if (period === "monthly") {
      const startOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      );

      return {
        start: startOfMonth.toISOString().split("T")[0],
        end: endOfMonth.toISOString().split("T")[0],
      };
    } else if (period === "yearly") {
      const startOfYear = new Date(targetDate.getFullYear(), 0, 1);
      const endOfYear = new Date(targetDate.getFullYear(), 11, 31);

      return {
        start: startOfYear.toISOString().split("T")[0],
        end: endOfYear.toISOString().split("T")[0],
      };
    }

    return {
      start: targetDate.toISOString().split("T")[0],
      end: targetDate.toISOString().split("T")[0],
    };
  };

  // Tarih formatını döndür
  const getFormattedDateRange = () => {
    const dateRange = calculateDateRange(selectedPeriod, currentDate);

    if (selectedPeriod === "weekly") {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      return `${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}, ${endDate.getFullYear()}`;
    } else if (selectedPeriod === "monthly") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (selectedPeriod === "yearly") {
      return currentDate.getFullYear().toString();
    }

    return currentDate.toLocaleDateString();
  };

  // Chart data formatla (InsightsScreen için)
  const getChartData = (dataType) => {
    if (!dashboardData) return [];

    switch (dataType) {
      case "calories":
        return calorieData?.chart || [];
      case "weight":
        return weightData?.chart || [];
      case "water":
        return waterData?.chart || [];
      case "nutrition":
        return nutritionData?.chart || [];
      default:
        return [];
    }
  };

  // Günleri al (chart için)
  const getChartDays = () => {
    if (!dashboardData || !dashboardData.calories?.chart) {
      // Fallback - son 7 günü oluştur
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.getDate().toString());
      }
      return days;
    }

    return dashboardData.calories.chart.map((item) => item.day);
  };

  // Güvenli değer erişimi
  const getSafeValue = (path, defaultValue = 0) => {
    try {
      const keys = path.split(".");
      let value = dashboardData;

      for (const key of keys) {
        if (value && typeof value === "object" && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }

      return value !== null && value !== undefined ? value : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  };

  // Cache'e kaydet
  const saveDashboardCache = async (data) => {
    try {
      const cacheData = {
        data: data,
        period: selectedPeriod,
        date: currentDate.toISOString(),
        cachedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `insightsCache_${user?.id}`,
        JSON.stringify(cacheData)
      );
      console.log("InsightsContext: Data cached successfully");
    } catch (error) {
      console.error("InsightsContext: Cache save error:", error);
    }
  };

  // Cache'den yükle
  const loadFromCache = async () => {
    try {
      const cacheKey = `insightsCache_${user?.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);

        // Cache yaşını kontrol et (1 saat)
        const cacheAge = new Date() - new Date(parsed.cachedAt);
        if (cacheAge < 60 * 60 * 1000) {
          setDashboardData(parsed.data);
          setCalorieData(parsed.data.calories);
          setWeightData(parsed.data.weight);
          setWaterData(parsed.data.water);
          setNutritionData(parsed.data.nutrition);
          setBmiData(parsed.data.bmi);

          console.log("InsightsContext: Data loaded from cache");
        } else {
          console.log("InsightsContext: Cache expired");
        }
      } else {
        console.log("InsightsContext: No cache found");
      }
    } catch (error) {
      console.error("InsightsContext: Cache load error:", error);
    }
  };

  // Cache'i temizle
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(`insightsCache_${user?.id}`);
      console.log("InsightsContext: Cache cleared");
    } catch (error) {
      console.error("InsightsContext: Cache clear error:", error);
    }
  };

  // Refresh data
  const refreshData = async () => {
    console.log("InsightsContext: Refreshing data...");
    await clearCache();
    await loadInsightsDashboard();
  };

  const value = {
    // State'ler
    loading,
    error,
    selectedPeriod,
    currentDate,
    dashboardData,
    calorieData,
    weightData,
    waterData,
    nutritionData,
    bmiData,

    // Fonksiyonlar
    loadInsightsDashboard,
    changePeriod,
    changeDate,
    refreshData,
    clearCache,

    // Utility fonksiyonlar
    getFormattedDateRange,
    getChartData,
    getSafeValue,
    getChartDays,
    calculateDateRange,
  };

  return (
    <InsightsContext.Provider value={value}>
      {children}
    </InsightsContext.Provider>
  );
};

export const useInsights = () => {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error("useInsights must be used within an InsightsProvider");
  }
  return context;
};
