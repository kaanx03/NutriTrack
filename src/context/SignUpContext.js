// src/context/SignUpContext.js - Updated with Backend Integration
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Create context
const SignUpContext = createContext();

// 2. Create provider component
export const SignUpProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    // Temel kullanıcı bilgileri
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",

    // Demografik bilgiler
    gender: "male", // Default to male
    birthDate: "", // Tam tarih string için (YYYY-MM-DD)
    day: "", // Gün komponenti
    month: "", // Ay komponenti
    year: "", // Yıl komponenti

    // Fiziksel bilgiler
    height: "",
    weight: "",
    activityLevel: "3", // Default to moderate activity

    // Hesaplanmış plan
    calculatedPlan: null,

    // Ek bilgiler
    goals: [],
    preferences: {},
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 3. AsyncStorage'dan veri yükleme
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      const savedData = await AsyncStorage.getItem("signupFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData((prevData) => ({
          ...prevData,
          ...parsedData,
        }));
        console.log("Loaded form data from storage:", parsedData);
      }
    } catch (error) {
      console.error("Error loading form data:", error);
    } finally {
      setIsDataLoaded(true);
    }
  };

  const saveFormData = async (newData) => {
    try {
      await AsyncStorage.setItem("signupFormData", JSON.stringify(newData));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  // 4. Update function
  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Eğer gün, ay veya yıl güncellendiyse, birleştirilmiş doğum tarihini de güncelle
      if (field === "day" || field === "month" || field === "year") {
        const day = field === "day" ? value : prev.day;
        const month = field === "month" ? value : prev.month;
        const year = field === "year" ? value : prev.year;

        // Tüm değerler varsa, birleştirilmiş tarihi oluştur
        if (day && month && year) {
          newData.birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}`;
        }
      }

      // AsyncStorage'a kaydet
      saveFormData(newData);

      return newData;
    });
  };

  // 5. Bulk update function
  const updateMultipleFields = (updates) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };

      // Doğum tarihini kontrol et
      if (
        updates.day ||
        updates.month ||
        updates.year ||
        prev.day ||
        prev.month ||
        prev.year
      ) {
        const day = updates.day || prev.day;
        const month = updates.month || prev.month;
        const year = updates.year || prev.year;

        if (day && month && year) {
          newData.birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}`;
        }
      }

      // AsyncStorage'a kaydet
      saveFormData(newData);

      return newData;
    });
  };

  // 6. Form validation
  const validateFormData = () => {
    const errors = [];

    // Email validation
    if (!formData.email) {
      errors.push("Email is required");
    } else if (!formData.email.includes("@")) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    // Name validation
    if (!formData.firstName?.trim()) {
      errors.push("First name is required");
    }

    if (!formData.lastName?.trim()) {
      errors.push("Last name is required");
    }

    // Physical info validation
    if (!formData.height || isNaN(formData.height)) {
      errors.push("Please enter a valid height");
    }

    if (!formData.weight || isNaN(formData.weight)) {
      errors.push("Please enter a valid weight");
    }

    // Birth date validation
    if (
      !formData.birthDate &&
      (!formData.day || !formData.month || !formData.year)
    ) {
      errors.push("Please enter your birth date");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 7. Clear form data
  const clearFormData = async () => {
    try {
      await AsyncStorage.removeItem("signupFormData");
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        gender: "male",
        birthDate: "",
        day: "",
        month: "",
        year: "",
        height: "",
        weight: "",
        activityLevel: "3",
        calculatedPlan: null,
        goals: [],
        preferences: {},
      });
      console.log("Form data cleared");
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
  };

  // 8. Get calculated age
  const getCalculatedAge = () => {
    try {
      let birthDate;

      if (formData.birthDate) {
        birthDate = new Date(formData.birthDate);
      } else if (formData.year && formData.month && formData.day) {
        birthDate = new Date(
          parseInt(formData.year),
          parseInt(formData.month) - 1,
          parseInt(formData.day)
        );
      } else {
        return null;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return null;
    }
  };

  // 9. Get form completion percentage
  const getFormCompletionPercentage = () => {
    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "gender",
      "height",
      "weight",
      "activityLevel",
    ];

    const birthDateComplete =
      formData.birthDate || (formData.year && formData.month && formData.day);

    const completedFields =
      requiredFields.filter(
        (field) => formData[field] && formData[field].toString().trim() !== ""
      ).length + (birthDateComplete ? 1 : 0);

    return Math.round((completedFields / (requiredFields.length + 1)) * 100);
  };

  // 10. Format data for backend
  const getBackendFormattedData = () => {
    let formattedBirthDate = formData.birthDate;

    if (
      !formattedBirthDate &&
      formData.year &&
      formData.month &&
      formData.day
    ) {
      formattedBirthDate = `${formData.year}-${formData.month.padStart(
        2,
        "0"
      )}-${formData.day.padStart(2, "0")}`;
    }

    return {
      email: formData.email?.toLowerCase().trim(),
      password: formData.password,
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      phoneNumber: formData.phoneNumber?.trim() || "",
      gender: formData.gender,
      birthDate: formattedBirthDate,
      height: parseInt(formData.height) || null,
      weight: parseFloat(formData.weight) || null,
      activityLevel: parseInt(formData.activityLevel) || 3,
    };
  };

  const contextValue = {
    formData,
    updateFormData,
    updateMultipleFields,
    validateFormData,
    clearFormData,
    getCalculatedAge,
    getFormCompletionPercentage,
    getBackendFormattedData,
    isDataLoaded,
  };

  return (
    <SignUpContext.Provider value={contextValue}>
      {children}
    </SignUpContext.Provider>
  );
};

// 11. Shortcut for using the context
export const useSignUp = () => {
  const context = useContext(SignUpContext);
  if (!context) {
    throw new Error("useSignUp must be used within a SignUpProvider");
  }
  return context;
};

export default SignUpContext;
