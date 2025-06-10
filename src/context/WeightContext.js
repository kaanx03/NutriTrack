// src/context/WeightContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSignUp } from "./SignUpContext";

const WeightContext = createContext();

export const WeightProvider = ({ children }) => {
  const { formData, updateFormData } = useSignUp();

  // State'ler
  const [currentWeight, setCurrentWeight] = useState(80.0);
  const [goalWeight, setGoalWeight] = useState(75.0);
  const [height, setHeight] = useState(175.0);
  const [weightHistory, setWeightHistory] = useState([]);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState("");
  const [initialWeight, setInitialWeight] = useState(80.0);

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

  // FormData'dan başlangıç değerlerini al
  useEffect(() => {
    if (formData) {
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
  }, [formData]);

  // Weight veya height değiştiğinde BMI'yi yeniden hesapla
  useEffect(() => {
    const bmiValue = calculateBMI(currentWeight, height);
    setBmi(Math.round(bmiValue * 10) / 10);
    setBmiCategory(getBMICategory(bmiValue));
  }, [currentWeight, height]);

  // Kilo güncelleme fonksiyonu
  const updateWeight = (newWeight) => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      setCurrentWeight(weight);

      // FormData'yı da güncelle
      updateFormData("weight", newWeight.toString());

      // Weight history'e ekle (tarih ile birlikte)
      const today = new Date().toISOString().split("T")[0];
      setWeightHistory((prev) => {
        const filtered = prev.filter((entry) => entry.date !== today);
        return [...filtered, { date: today, weight: weight }].slice(-30); // Son 30 kayıt
      });
    }
  };

  // Boy güncelleme fonksiyonu
  const updateHeight = (newHeight) => {
    const heightValue = parseFloat(newHeight);
    if (!isNaN(heightValue) && heightValue > 0) {
      setHeight(heightValue);

      // FormData'yı da güncelle
      updateFormData("height", newHeight.toString());
    }
  };

  // Hedef kilo güncelleme fonksiyonu
  const updateGoalWeight = (newGoalWeight) => {
    const goal = parseFloat(newGoalWeight);
    if (!isNaN(goal) && goal > 0) {
      setGoalWeight(goal);
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

  // Insights için haftalık veri
  const getWeightDataForInsights = () => {
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
      const weight = historyEntry
        ? historyEntry.weight
        : currentWeight + (Math.random() - 0.5) * 2; // Fake data for demo

      last7Days.push(weight);
    }

    return last7Days;
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

    // Fonksiyonlar
    updateWeight,
    updateHeight,
    updateGoalWeight,

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
