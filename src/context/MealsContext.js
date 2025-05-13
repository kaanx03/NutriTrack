// src/context/MealsContext.js - Güncellenmiş sürüm
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSignUp } from "./SignUpContext";

// Başlangıç değerleri
const initialState = {
  consumedCalories: 0,
  caloriesLeft: 2800,
  burnedCalories: 0,
  meals: [
    { type: "Breakfast", consumed: 0, total: 840 }, // %30
    { type: "Lunch", consumed: 0, total: 840 }, // %30
    { type: "Dinner", consumed: 0, total: 840 }, // %30
    { type: "Snack", consumed: 0, total: 280 }, // %10
  ],
  mealFoods: {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  },
  consumedNutrients: {
    carbs: 0,
    protein: 0,
    fat: 0,
  },
  calorieData: {
    calories: 2800,
    carbs: 350, // 2800 kalorideki yaklaşık karbonhidrat (gram)
    protein: 175, // 2800 kalorideki yaklaşık protein (gram)
    fat: 78, // 2800 kalorideki yaklaşık yağ (gram)
  },
  // Yeni state'ler
  favoriteFoods: [], // Favori yemekleri sakla
  recentFoods: [], // Son görüntülenen yemekleri sakla
  personalFoods: [], // Kullanıcının eklediği yemekleri sakla
};

const MealsContext = createContext(initialState);

export const MealsProvider = ({ children }) => {
  const { formData } = useSignUp();
  const [state, setState] = useState(initialState);

  // SignUp verilerine göre kalori hedeflerini güncelleme
  useEffect(() => {
    if (formData && formData.calculatedPlan) {
      const { dailyCalories, macros } = formData.calculatedPlan;

      const breakfast = Math.round(dailyCalories * 0.3);
      const lunch = Math.round(dailyCalories * 0.3);
      const dinner = Math.round(dailyCalories * 0.3);
      const snack = Math.round(dailyCalories * 0.1);

      setState({
        ...initialState,
        caloriesLeft: dailyCalories,
        calorieData: {
          calories: dailyCalories,
          carbs: macros.carbs,
          protein: macros.protein,
          fat: macros.fat,
        },
        meals: [
          { type: "Breakfast", consumed: 0, total: breakfast },
          { type: "Lunch", consumed: 0, total: lunch },
          { type: "Dinner", consumed: 0, total: dinner },
          { type: "Snack", consumed: 0, total: snack },
        ],
      });
    }
  }, [formData]);

  // Yemek ekleme fonksiyonu
  const addFood = (selectedFood) => {
    const {
      id,
      name,
      calories,
      mealType,
      carbs = 0,
      protein = 0,
      fat = 0,
      weight,
      portionSize,
      portionUnit,
    } = selectedFood;

    // Benzersiz ID oluştur
    const foodId = id || Date.now().toString();

    setState((prevState) => {
      // İlgili öğünü bul
      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );
      if (mealIndex === -1) return prevState;

      // Öğünleri güncelle
      const updatedMeals = [...prevState.meals];
      updatedMeals[mealIndex].consumed += calories;

      // Toplam tüketilen kalori
      const newConsumedCalories = prevState.consumedCalories + calories;

      // Kalan kalori
      const newCaloriesLeft = Math.max(
        0,
        prevState.calorieData.calories - newConsumedCalories
      );

      // Tüketilen besin değerlerini güncelle - sayıları yuvarla
      const newConsumedNutrients = {
        carbs:
          Math.round((prevState.consumedNutrients.carbs + carbs) * 10) / 10,
        protein:
          Math.round((prevState.consumedNutrients.protein + protein) * 10) / 10,
        fat: Math.round((prevState.consumedNutrients.fat + fat) * 10) / 10,
      };

      // Yeni yiyeceği ekle
      const newFood = {
        id: foodId,
        name,
        calories,
        carbs,
        protein,
        fat,
        weight: portionSize || weight, // Porsiyon varsa onu kullan, yoksa weight'i kullan
        portionSize: portionSize || weight,
        portionUnit: portionUnit || "gram (g)",
        mealType, // Öğün bilgisini ekle
      };

      // Mevcut öğün yiyeceklerini güncelle
      const updatedMealFoods = {
        ...prevState.mealFoods,
        [mealType]: [...prevState.mealFoods[mealType], newFood],
      };

      return {
        ...prevState,
        meals: updatedMeals,
        consumedCalories: newConsumedCalories,
        caloriesLeft: newCaloriesLeft,
        consumedNutrients: newConsumedNutrients,
        mealFoods: updatedMealFoods,
      };
    });
  };

  // YENİ: Porsiyon güncelleme fonksiyonu
  const updateFoodPortion = (
    foodId,
    mealType,
    newPortionSize,
    newPortionUnit,
    newCalories,
    newCarbs,
    newProtein,
    newFat
  ) => {
    setState((prevState) => {
      // Yemeği mevcut öğünde bul
      const mealFoods = prevState.mealFoods[mealType] || [];
      const foodIndex = mealFoods.findIndex((food) => food.id === foodId);

      // Yemek bulunamadıysa state'i değiştirme
      if (foodIndex === -1) return prevState;

      // Eski yemek bilgisini al
      const oldFood = mealFoods[foodIndex];
      const oldCalories = oldFood.calories;
      const oldCarbs = oldFood.carbs || 0;
      const oldProtein = oldFood.protein || 0;
      const oldFat = oldFood.fat || 0;

      // Yeni ve eski kalori/makro farkları (ekleme/çıkarma değerleri)
      const caloriesDiff = newCalories - oldCalories;
      const carbsDiff = newCarbs - oldCarbs;
      const proteinDiff = newProtein - oldProtein;
      const fatDiff = newFat - oldFat;

      // Güncellenmiş yemek
      const updatedFood = {
        ...oldFood,
        calories: newCalories,
        carbs: newCarbs,
        protein: newProtein,
        fat: newFat,
        portionSize: newPortionSize,
        portionUnit: newPortionUnit,
        weight: newPortionSize, // weight alanını da güncelle
      };

      // Güncellenmiş yemek listesi
      const updatedMealFoods = [...mealFoods];
      updatedMealFoods[foodIndex] = updatedFood;

      // Öğün indeksini bul
      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );

      // Öğün toplam kalorisini güncelle
      const updatedMeals = [...prevState.meals];
      if (mealIndex !== -1) {
        updatedMeals[mealIndex].consumed += caloriesDiff;
      }

      // Toplam tüketilen ve kalan kaloriyi güncelle
      const newConsumedCalories = prevState.consumedCalories + caloriesDiff;
      const newCaloriesLeft = Math.max(
        0,
        prevState.calorieData.calories - newConsumedCalories
      );

      // Toplam besin maddelerini güncelle - sayıları yuvarla
      const newConsumedNutrients = {
        carbs:
          Math.round((prevState.consumedNutrients.carbs + carbsDiff) * 10) / 10,
        protein:
          Math.round((prevState.consumedNutrients.protein + proteinDiff) * 10) /
          10,
        fat: Math.round((prevState.consumedNutrients.fat + fatDiff) * 10) / 10,
      };

      return {
        ...prevState,
        meals: updatedMeals,
        mealFoods: {
          ...prevState.mealFoods,
          [mealType]: updatedMealFoods,
        },
        consumedCalories: newConsumedCalories,
        caloriesLeft: newCaloriesLeft,
        consumedNutrients: newConsumedNutrients,
      };
    });
  };

  // Yemek silme fonksiyonu
  const deleteFood = (foodId, mealType) => {
    setState((prevState) => {
      // Silinecek yemeği bul
      const deletedFood = prevState.mealFoods[mealType].find(
        (food) => food.id === foodId
      );
      if (!deletedFood) return prevState;

      // Öğün indeksini bul
      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );
      if (mealIndex === -1) return prevState;

      // Öğünleri güncelle
      const updatedMeals = [...prevState.meals];
      updatedMeals[mealIndex].consumed -= deletedFood.calories;

      // Tüketilen kaloriyi güncelle
      const newConsumedCalories =
        prevState.consumedCalories - deletedFood.calories;

      // Kalan kaloriyi güncelle
      const newCaloriesLeft =
        prevState.calorieData.calories - newConsumedCalories;

      // Tüketilen besin değerlerini güncelle - sayıları yuvarla
      const newConsumedNutrients = {
        carbs:
          Math.round(
            (prevState.consumedNutrients.carbs - (deletedFood.carbs || 0)) * 10
          ) / 10,
        protein:
          Math.round(
            (prevState.consumedNutrients.protein - (deletedFood.protein || 0)) *
              10
          ) / 10,
        fat:
          Math.round(
            (prevState.consumedNutrients.fat - (deletedFood.fat || 0)) * 10
          ) / 10,
      };

      // Yiyeceği öğün listesinden kaldır
      const updatedMealFoods = {
        ...prevState.mealFoods,
        [mealType]: prevState.mealFoods[mealType].filter(
          (food) => food.id !== foodId
        ),
      };

      return {
        ...prevState,
        meals: updatedMeals,
        consumedCalories: newConsumedCalories,
        caloriesLeft: newCaloriesLeft,
        consumedNutrients: newConsumedNutrients,
        mealFoods: updatedMealFoods,
      };
    });
  };

  // Egzersiz ekleme
  const addActivity = (calories = 50) => {
    setState((prevState) => ({
      ...prevState,
      burnedCalories: prevState.burnedCalories + calories,
    }));
  };

  // Favori yemek ekleme/çıkarma fonksiyonu
  const toggleFavorite = (food) => {
    setState((prevState) => {
      // Yemek zaten favorilerde mi kontrol et
      const isFavorite = prevState.favoriteFoods.some(
        (item) => item.id === food.id
      );

      if (isFavorite) {
        // Favorilerden çıkar
        return {
          ...prevState,
          favoriteFoods: prevState.favoriteFoods.filter(
            (item) => item.id !== food.id
          ),
        };
      } else {
        // Favorilere ekle
        return {
          ...prevState,
          favoriteFoods: [...prevState.favoriteFoods, food],
        };
      }
    });
  };

  // Son görüntülenen yemek ekleme fonksiyonu
  const addToRecent = (food) => {
    setState((prevState) => {
      // Eğer yemek zaten varsa listeden çıkar (sonra başa eklemek için)
      const filteredRecents = prevState.recentFoods.filter(
        (item) => item.id !== food.id
      );

      // Yemeği listenin başına ekle ve en fazla 10 yemek tut
      const updatedRecents = [food, ...filteredRecents].slice(0, 10);

      return {
        ...prevState,
        recentFoods: updatedRecents,
      };
    });
  };

  // Kişisel yemek ekleme fonksiyonu - YENİ
  const addPersonalFood = (food) => {
    setState((prevState) => {
      // Eğer aynı ID'ye sahip bir yemek varsa güncelle, yoksa ekle
      const existingIndex = prevState.personalFoods.findIndex(
        (item) => item.id === food.id
      );

      let updatedPersonalFoods;
      if (existingIndex >= 0) {
        updatedPersonalFoods = [...prevState.personalFoods];
        updatedPersonalFoods[existingIndex] = food;
      } else {
        updatedPersonalFoods = [...prevState.personalFoods, food];
      }

      return {
        ...prevState,
        personalFoods: updatedPersonalFoods,
      };
    });
  };

  // Kişisel yemek silme fonksiyonu - YENİ
  const deletePersonalFood = (foodId) => {
    setState((prevState) => ({
      ...prevState,
      personalFoods: prevState.personalFoods.filter(
        (food) => food.id !== foodId
      ),
    }));
  };

  return (
    <MealsContext.Provider
      value={{
        ...state,
        addFood,
        deleteFood,
        addActivity,
        toggleFavorite,
        addToRecent,
        addPersonalFood,
        deletePersonalFood,
        updateFoodPortion, // YENİ: updateFoodPortion fonksiyonunu context'e ekle
      }}
    >
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = () => useContext(MealsContext);
