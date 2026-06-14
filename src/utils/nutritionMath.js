// src/utils/nutritionMath.js
// Kalori / makro / BMI hesapları — TEK kaynak (saf fonksiyonlar, test edilir).
// Daha önce LoginScreen + SignUpScreen10 içinde birebir kopyalanmıştı ve BMI
// WeightContext içindeydi; buraya çıkarıldı.

const ACTIVITY_MULTIPLIERS = {
  1: 1.2, // Sedentary
  2: 1.375, // Light
  3: 1.55, // Moderate
  4: 1.725, // Very active
  5: 1.9, // Extra active
};

// Doğum tarihinden yaş (tam yıl).
export const calculateAge = (birthDate) => {
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// BMR — Mifflin-St Jeor.
export const calculateBMR = (weight, height, age, gender) => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender && gender.toLowerCase() === "male" ? base + 5 : base - 161;
};

// Günlük kalori + makro hedefleri. Makro dağılımı: %50 carbs, %30 protein, %20 fat
// (LoginScreen/SignUpScreen10 ile birebir aynı).
export const calculateCaloriesAndMacros = (
  weight,
  height,
  age,
  gender,
  activityLevel
) => {
  const bmr = calculateBMR(weight, height, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const calories = Math.round(bmr * multiplier);
  return {
    bmr: Math.round(bmr),
    calories,
    carbs: Math.round((calories * 0.5) / 4),
    protein: Math.round((calories * 0.3) / 4),
    fat: Math.round((calories * 0.2) / 9),
  };
};

// BMI = kg / m^2.
export const calculateBMI = (weight, heightInCm) => {
  if (!weight || !heightInCm) return 0;
  const h = heightInCm / 100;
  return weight / (h * h);
};

// BMI kategorisi (WeightContext ile birebir aynı eşikler).
export const getBMICategory = (bmi) => {
  if (bmi < 16.0) return "Very Severely Underweight";
  if (bmi < 17.0) return "Severely Underweight";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Overweight";
  if (bmi < 35.0) return "Obese Class I";
  if (bmi < 40.0) return "Obese Class II";
  return "Obese Class III";
};
