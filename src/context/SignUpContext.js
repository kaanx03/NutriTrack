import React, { createContext, useState, useContext } from "react";

// 1. Create context
const SignUpContext = createContext();

// 2. Create provider component
export const SignUpProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "male", // Default to male to avoid undefined
    birthDate: "", // Tam tarih string için
    day: "", // Gün komponenti
    month: "", // Ay komponenti
    year: "", // Yıl komponenti
    height: "",
    weight: "",
    activityLevel: "3", // Default to moderate activity
  });

  // 3. Update function
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

      return newData;
    });
  };

  return (
    <SignUpContext.Provider value={{ formData, updateFormData }}>
      {children}
    </SignUpContext.Provider>
  );
};

// 4. Shortcut for using the context
export const useSignUp = () => useContext(SignUpContext);

export default SignUpContext;
