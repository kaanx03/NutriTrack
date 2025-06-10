// src/context/MealsContext.js - Tamamen Yeni Sürüm
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
  favoriteFoods: [],
  recentFoods: [],
  personalFoods: [],
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

  // Kalori hedefi güncelleme fonksiyonu
  const updateCalorieGoal = (newCalories) => {
    setState((prevState) => {
      // Makro besin hedeflerini yeni kalori miktarına göre hesapla
      const carbsGrams = Math.round((newCalories * 0.5) / 4); // 1g carbs = 4 kcal
      const proteinGrams = Math.round((newCalories * 0.25) / 4); // 1g protein = 4 kcal
      const fatGrams = Math.round((newCalories * 0.25) / 9); // 1g fat = 9 kcal

      // Öğün kalori dağılımını güncelle
      const breakfast = Math.round(newCalories * 0.3);
      const lunch = Math.round(newCalories * 0.3);
      const dinner = Math.round(newCalories * 0.3);
      const snack = Math.round(newCalories * 0.1);

      // Kalan kaloriyi yeniden hesapla
      const newCaloriesLeft = newCalories - prevState.consumedCalories;

      return {
        ...prevState,
        calorieData: {
          calories: newCalories,
          carbs: carbsGrams,
          protein: proteinGrams,
          fat: fatGrams,
        },
        caloriesLeft: Math.max(0, newCaloriesLeft),
        meals: [
          {
            type: "Breakfast",
            consumed: prevState.meals[0].consumed,
            total: breakfast,
          },
          {
            type: "Lunch",
            consumed: prevState.meals[1].consumed,
            total: lunch,
          },
          {
            type: "Dinner",
            consumed: prevState.meals[2].consumed,
            total: dinner,
          },
          {
            type: "Snack",
            consumed: prevState.meals[3].consumed,
            total: snack,
          },
        ],
      };
    });
  };

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

    const foodId = id || Date.now().toString();

    setState((prevState) => {
      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );
      if (mealIndex === -1) return prevState;

      const updatedMeals = [...prevState.meals];
      updatedMeals[mealIndex].consumed += calories;

      const newConsumedCalories = prevState.consumedCalories + calories;
      const newCaloriesLeft = Math.max(
        0,
        prevState.calorieData.calories - newConsumedCalories
      );

      const newConsumedNutrients = {
        carbs:
          Math.round((prevState.consumedNutrients.carbs + carbs) * 10) / 10,
        protein:
          Math.round((prevState.consumedNutrients.protein + protein) * 10) / 10,
        fat: Math.round((prevState.consumedNutrients.fat + fat) * 10) / 10,
      };

      const newFood = {
        id: foodId,
        name,
        calories,
        carbs,
        protein,
        fat,
        weight: portionSize || weight,
        portionSize: portionSize || weight,
        portionUnit: portionUnit || "gram (g)",
        mealType,
      };

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

  // Porsiyon güncelleme fonksiyonu
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
      const mealFoods = prevState.mealFoods[mealType] || [];
      const foodIndex = mealFoods.findIndex((food) => food.id === foodId);

      if (foodIndex === -1) return prevState;

      const oldFood = mealFoods[foodIndex];
      const oldCalories = oldFood.calories;
      const oldCarbs = oldFood.carbs || 0;
      const oldProtein = oldFood.protein || 0;
      const oldFat = oldFood.fat || 0;

      const caloriesDiff = newCalories - oldCalories;
      const carbsDiff = newCarbs - oldCarbs;
      const proteinDiff = newProtein - oldProtein;
      const fatDiff = newFat - oldFat;

      const updatedFood = {
        ...oldFood,
        calories: newCalories,
        carbs: newCarbs,
        protein: newProtein,
        fat: newFat,
        portionSize: newPortionSize,
        portionUnit: newPortionUnit,
        weight: newPortionSize,
      };

      const updatedMealFoods = [...mealFoods];
      updatedMealFoods[foodIndex] = updatedFood;

      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );

      const updatedMeals = [...prevState.meals];
      if (mealIndex !== -1) {
        updatedMeals[mealIndex].consumed += caloriesDiff;
      }

      const newConsumedCalories = prevState.consumedCalories + caloriesDiff;
      const newCaloriesLeft = Math.max(
        0,
        prevState.calorieData.calories - newConsumedCalories
      );

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
      const deletedFood = prevState.mealFoods[mealType].find(
        (food) => food.id === foodId
      );
      if (!deletedFood) return prevState;

      const mealIndex = prevState.meals.findIndex(
        (meal) => meal.type === mealType
      );
      if (mealIndex === -1) return prevState;

      const updatedMeals = [...prevState.meals];
      updatedMeals[mealIndex].consumed -= deletedFood.calories;

      const newConsumedCalories =
        prevState.consumedCalories - deletedFood.calories;
      const newCaloriesLeft =
        prevState.calorieData.calories - newConsumedCalories;

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

  // Favori yemek ekleme/çıkarma
  const toggleFavorite = (food) => {
    setState((prevState) => {
      const isFavorite = prevState.favoriteFoods.some(
        (item) => item.id === food.id
      );

      if (isFavorite) {
        return {
          ...prevState,
          favoriteFoods: prevState.favoriteFoods.filter(
            (item) => item.id !== food.id
          ),
        };
      } else {
        return {
          ...prevState,
          favoriteFoods: [...prevState.favoriteFoods, food],
        };
      }
    });
  };

  // Son görüntülenen yemek ekleme
  const addToRecent = (food) => {
    setState((prevState) => {
      const filteredRecents = prevState.recentFoods.filter(
        (item) => item.id !== food.id
      );

      const updatedRecents = [food, ...filteredRecents].slice(0, 10);

      return {
        ...prevState,
        recentFoods: updatedRecents,
      };
    });
  };

  // Kişisel yemek ekleme
  const addPersonalFood = (food) => {
    setState((prevState) => {
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

  // Kişisel yemek silme
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
        updateFoodPortion,
        updateCalorieGoal,
      }}
    >
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = () => useContext(MealsContext);
