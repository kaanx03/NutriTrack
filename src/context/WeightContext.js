// src/context/WeightContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSignUp } from "./SignUpContext";
import { useAuth } from "./AuthContext";

const WeightContext = createContext();

const API_URL = "http://10.0.2.2:3001/api"; // Backend URL'inizi buraya yazın

export const WeightProvider = ({ children }) => {
  const { formData, updateFormData } = useSignUp();
  const { user, getToken } = useAuth();

  // State'ler
  const [currentWeight, setCurrentWeight] = useState(80.0);
  const [goalWeight, setGoalWeight] = useState(75.0);
  const [height, setHeight] = useState(175.0);
  const [weightHistory, setWeightHistory] = useState([]);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState("");
  const [initialWeight, setInitialWeight] = useState(80.0);
  const [loading, setLoading] = useState(false);

  // Kullanıcı değiştiğinde weight verilerini yükle
  useEffect(() => {
    if (user?.id) {
      loadUserWeightData();
      loadWeightHistory();
    }
  }, [user]);

  // FormData'dan başlangıç değerlerini al (sadece signup sırasında)
  useEffect(() => {
    if (formData && !user?.id) {
      // Kilo bilgisi varsa kullan
      if (formData.weight) {
        const weight = parseFloat(formData.weight);
        setCurrentWeight(weight);

        // İlk kez ayarlanıyorsa initial weight'i de ayarla
        if (initialWeight === 80.0) {
          setInitialWeight(weight);
        }
      }

      // Boy bilgisi varsa kullan
      if (formData.height) {
        const heightValue = parseFloat(formData.height);
        setHeight(heightValue);
      }
    }
  }, [formData, user]);

  // Weight veya height değiştiğinde BMI'yi yeniden hesapla
  useEffect(() => {
    const bmiValue = calculateBMI(currentWeight, height);
    setBmi(Math.round(bmiValue * 10) / 10);
    setBmiCategory(getBMICategory(bmiValue));
  }, [currentWeight, height]);

  // Kullanıcının weight verilerini backend'den yükle
  const loadUserWeightData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = await getToken();

      // User bilgilerini al
      const userResponse = await fetch(`${API_URL}/user/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userData = await userResponse.json();

      if (userData.success) {
        const user = userData.data;

        setCurrentWeight(user.weight || 80.0);
        setHeight(user.height || 175.0);

        // İlk kez yükleniyorsa initial weight'i ayarla
        if (initialWeight === 80.0) {
          setInitialWeight(user.weight || 80.0);
        }
      }

      // Hedef weight'i al
      const targetResponse = await fetch(`${API_URL}/user/daily-targets`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const targetData = await targetResponse.json();

      if (targetData.success && targetData.data.goal_weight) {
        setGoalWeight(targetData.data.goal_weight);
      }
    } catch (error) {
      console.error("Weight verileri yüklenirken hata:", error);
      // Local cache'den yükle
      await loadFromLocalCache();
    } finally {
      setLoading(false);
    }
  };

  // Weight geçmişini yükle
  const loadWeightHistory = async (period = 90) => {
    if (!user?.id) return;

    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/tracker/weight?limit=${period}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        const history = data.data.map((log) => ({
          date: log.logged_date,
          weight: parseFloat(log.weight_kg),
          bmi: log.bmi ? parseFloat(log.bmi) : null,
          notes: log.notes,
        }));

        setWeightHistory(history);

        // İlk weight kaydını initial weight olarak ayarla
        if (history.length > 0 && initialWeight === 80.0) {
          const firstRecord = history[history.length - 1]; // En eski kayıt
          setInitialWeight(firstRecord.weight);
        }
      }
    } catch (error) {
      console.error("Weight geçmişi yüklenirken hata:", error);
    }
  };

  // BMI hesaplama fonksiyonu
  const calculateBMI = (weight, heightInCm) => {
    const heightInMeters = heightInCm / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // BMI kategorisi belirleme fonksiyonu
  const getBMICategory = (bmiValue) => {
    if (bmiValue < 16.0) return "Very Severely Underweight";
    if (bmiValue >= 16.0 && bmiValue < 17.0) return "Severely Underweight";
    if (bmiValue >= 17.0 && bmiValue < 18.5) return "Underweight";
    if (bmiValue >= 18.5 && bmiValue < 25.0) return "Normal";
    if (bmiValue >= 25.0 && bmiValue < 30.0) return "Overweight";
    if (bmiValue >= 30.0 && bmiValue < 35.0) return "Obese Class I";
    if (bmiValue >= 35.0 && bmiValue < 40.0) return "Obese Class II";
    return "Obese Class III";
  };

  // BMI renk kodları
  const getBMIColor = (bmiValue) => {
    if (bmiValue < 16.0) return "#3F51B2";
    if (bmiValue >= 16.0 && bmiValue < 17.0) return "#1A96F0";
    if (bmiValue >= 17.0 && bmiValue < 18.5) return "#00A9F1";
    if (bmiValue >= 18.5 && bmiValue < 25.0) return "#4AAF57";
    if (bmiValue >= 25.0 && bmiValue < 30.0) return "#FFC02D";
    if (bmiValue >= 30.0 && bmiValue < 35.0) return "#FF981F";
    if (bmiValue >= 35.0 && bmiValue < 40.0) return "#FF5726";
    return "#F54336";
  };

  // Kilo güncelleme fonksiyonu
  const updateWeight = async (newWeight, notes = "") => {
    const weight = parseFloat(newWeight);
    if (!weight || isNaN(weight) || weight <= 0 || weight > 500) {
      throw new Error("Geçerli bir kilo değeri giriniz (1-500 kg arası)");
    }

    try {
      // Optimistic update
      const previousWeight = currentWeight;
      setCurrentWeight(weight);

      if (user?.id) {
        // Backend'e kaydet
        const token = await getToken();

        const response = await fetch(`${API_URL}/tracker/weight`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weight: weight,
            date: new Date().toISOString().split("T")[0],
            notes: notes,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Weight history'e ekle
          const newEntry = {
            date: data.data.logged_date,
            weight: parseFloat(data.data.weight_kg),
            bmi: data.data.bmi ? parseFloat(data.data.bmi) : null,
            notes: data.data.notes,
          };

          setWeightHistory((prev) => [newEntry, ...prev.slice(0, 29)]); // Son 30 kayıt

          // Local cache'e kaydet
          await saveToLocalCache();

          console.log("Kilo başarıyla kaydedildi");
        } else {
          // Hata durumunda geri al
          setCurrentWeight(previousWeight);
          throw new Error(data.error || "Kilo kaydedilemedi");
        }
      } else {
        // FormData'yı da güncelle (signup sırasında)
        updateFormData("weight", newWeight.toString());
      }
    } catch (error) {
      console.error("Kilo güncelleme hatası:", error);
      // Hata durumunda geri al
      setCurrentWeight(currentWeight);
      throw error;
    }
  };

  // Boy güncelleme fonksiyonu
  const updateHeight = async (newHeight) => {
    const heightValue = parseFloat(newHeight);
    if (
      !heightValue ||
      isNaN(heightValue) ||
      heightValue <= 0 ||
      heightValue > 300
    ) {
      throw new Error("Geçerli bir boy değeri giriniz (1-300 cm arası)");
    }

    try {
      // Optimistic update
      const previousHeight = height;
      setHeight(heightValue);

      if (user?.id) {
        // Backend'e kaydet
        const token = await getToken();

        const response = await fetch(`${API_URL}/user/profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            height: heightValue,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          // Hata durumunda geri al
          setHeight(previousHeight);
          throw new Error(data.error || "Boy güncellenemedi");
        }
      } else {
        // FormData'yı da güncelle (signup sırasında)
        updateFormData("height", newHeight.toString());
      }
    } catch (error) {
      console.error("Boy güncelleme hatası:", error);
      // Hata durumunda geri al
      setHeight(height);
      throw error;
    }
  };

  // Hedef kilo güncelleme fonksiyonu
  const updateGoalWeight = async (newGoalWeight) => {
    const goal = parseFloat(newGoalWeight);
    if (!goal || isNaN(goal) || goal <= 0 || goal > 500) {
      throw new Error("Geçerli bir hedef kilo değeri giriniz (1-500 kg arası)");
    }

    try {
      // Optimistic update
      const previousGoal = goalWeight;
      setGoalWeight(goal);

      if (user?.id) {
        // Backend'e kaydet
        const token = await getToken();

        const response = await fetch(`${API_URL}/user/daily-targets`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goal_weight: goal,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          // Hata durumunda geri al
          setGoalWeight(previousGoal);
          throw new Error(data.error || "Hedef kilo güncellenemedi");
        }
      }
    } catch (error) {
      console.error("Hedef kilo güncelleme hatası:", error);
      // Hata durumunda geri al
      setGoalWeight(goalWeight);
      throw error;
    }
  };

  // Kilo değişimi hesaplama
  const getWeightChange = () => {
    if (initialWeight && currentWeight) {
      const change = currentWeight - initialWeight;
      return {
        value: Math.abs(change).toFixed(1),
        isPositive: change > 0,
        isNegative: change < 0,
        percentage: Math.abs((change / initialWeight) * 100).toFixed(1),
      };
    }
    return {
      value: "0.0",
      isPositive: false,
      isNegative: false,
      percentage: "0.0",
    };
  };

  // Hedefe olan mesafe
  const getGoalProgress = () => {
    if (goalWeight && currentWeight && initialWeight) {
      const totalDistance = Math.abs(goalWeight - initialWeight);
      const currentProgress = Math.abs(currentWeight - initialWeight);
      const percentage =
        totalDistance > 0 ? (currentProgress / totalDistance) * 100 : 0;

      return {
        percentage: Math.min(percentage, 100),
        remaining: Math.abs(goalWeight - currentWeight).toFixed(1),
        isAchieved: Math.abs(goalWeight - currentWeight) <= 0.5,
      };
    }
    return { percentage: 0, remaining: "0.0", isAchieved: false };
  };

  // Weight istatistikleri al
  const getWeightStats = async (period = 90) => {
    if (!user?.id) return null;

    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/tracker/weight/stats?period=${period}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      }
    } catch (error) {
      console.error("Weight istatistikleri yüklenirken hata:", error);
    }

    return null;
  };

  // Insights için haftalık veri
  const getWeightDataForInsights = () => {
    if (weightHistory.length === 0) {
      // Fake data for demo if no history
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const weight = currentWeight + (Math.random() - 0.5) * 2;
        last7Days.push(Math.max(40, Math.min(200, weight))); // 40-200 kg arası
      }
      return last7Days;
    }

    // Son 7 günün verilerini oluştur
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Weight history'den o tarihe ait veriyi bul
      const historyEntry = weightHistory.find(
        (entry) => entry.date === dateStr
      );
      const weight = historyEntry ? historyEntry.weight : currentWeight;

      last7Days.push(weight);
    }

    return last7Days;
  };

  // Local cache'e kaydet
  const saveToLocalCache = async () => {
    try {
      const cacheData = {
        currentWeight,
        goalWeight,
        height,
        initialWeight,
        weightHistory,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `weightCache_${user?.id}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error("Weight cache kaydetme hatası:", error);
    }
  };

  // Local cache'den yükle
  const loadFromLocalCache = async () => {
    try {
      const cacheKey = `weightCache_${user?.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setCurrentWeight(parsed.currentWeight || 80.0);
        setGoalWeight(parsed.goalWeight || 75.0);
        setHeight(parsed.height || 175.0);
        setInitialWeight(parsed.initialWeight || 80.0);
        setWeightHistory(parsed.weightHistory || []);
        console.log("Weight verileri local cache'den yüklendi");
      }
    } catch (error) {
      console.error("Weight cache yükleme hatası:", error);
    }
  };

  const value = {
    // State'ler
    currentWeight,
    goalWeight,
    height,
    bmi,
    bmiCategory,
    initialWeight,
    weightHistory,
    loading,

    // Fonksiyonlar
    updateWeight,
    updateHeight,
    updateGoalWeight,
    loadUserWeightData,
    loadWeightHistory,
    getWeightStats,

    // Hesaplama fonksiyonları
    calculateBMI,
    getBMICategory,
    getBMIColor,
    getWeightChange,
    getGoalProgress,
    getWeightDataForInsights,
  };

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
};

export const useWeight = () => {
  const context = useContext(WeightContext);
  if (!context) {
    throw new Error("useWeight must be used within a WeightProvider");
  }
  return context;
};
