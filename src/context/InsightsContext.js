// src/context/InsightsContext.js - Direct Fix
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const InsightsContext = createContext();
const API_URL = "http://10.0.2.2:3001/api";

export const InsightsProvider = ({ children }) => {
  const { user, getToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [calorieData, setCalorieData] = useState(null);
  const [weightData, setWeightData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [bmiData, setBmiData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      loadInsightsDashboard();
    }
  }, [user?.id, isAuthenticated, authLoading, selectedPeriod, currentDate]);

  const loadInsightsDashboard = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) throw new Error("No token");

      const dateRange = calculateDateRange(selectedPeriod, currentDate);
      const apiUrl = `${API_URL}/insights/dashboard?period=${selectedPeriod}&startDate=${dateRange.start}&endDate=${dateRange.end}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      if (data.success && data.data) {
        setDashboardData(data.data);
        setCalorieData(data.data.calories);
        setWeightData(data.data.weight);
        setWaterData(data.data.water);
        setNutritionData(data.data.nutrition);
        setBmiData(data.data.bmi);
      } else {
        throw new Error(data.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const changePeriod = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    setCurrentDate(new Date());
  };

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

  const getFormattedDateRange = () => {
    try {
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
    } catch (err) {
      return "Invalid Date";
    }
  };

  const getChartDays = () => {
    if (calorieData?.chart && calorieData.chart.length > 0) {
      return calorieData.chart.map(
        (item) => item.day || item.date?.split("-")[2] || ""
      );
    }

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.getDate().toString());
    }
    return days;
  };

  const getSafeValue = (path, defaultValue = 0) => {
    try {
      if (!dashboardData) return defaultValue;

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

  const refreshData = async () => {
    await loadInsightsDashboard();
  };

  const value = {
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
    isAuthenticated,
    authLoading,
    hasUser: !!user?.id,
    loadInsightsDashboard,
    changePeriod,
    changeDate,
    refreshData,
    getFormattedDateRange,
    getSafeValue,
    getChartDays,
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
