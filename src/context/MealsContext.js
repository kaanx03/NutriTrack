// src/context/MealsContext.js - Complete Enhanced Backend Integration with Recent Foods Database
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSignUp } from "./SignUpContext";
import { useAuth } from "./AuthContext";
import NutritionService from "../services/NutritionService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Başlangıç değerleri
const initialState = {
  consumedCalories: 0,
  caloriesLeft: 2800,
  burnedCalories: 0,
  meals: [
    { type: "Breakfast", consumed: 0, total: 840 },
    { type: "Lunch", consumed: 0, total: 840 },
    { type: "Dinner", consumed: 0, total: 840 },
    { type: "Snack", consumed: 0, total: 280 },
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
    carbs: 350,
    protein: 175,
    fat: 78,
  },
  favoriteFoods: [],
  recentFoods: [],
  personalFoods: [],
  isLoading: false,
  lastSyncDate: null,
};

const MealsContext = createContext(initialState);

export const MealsProvider = ({ children }) => {
  const { formData } = useSignUp();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState(initialState);
  const [currentDate, setCurrentDate] = useState(new Date());

  // SignUp verilerine göre kalori hedeflerini güncelleme.
  // SSOT: backend (user_daily_targets) tek kaynaktır. SignUp Mifflin değeri
  // yalnızca backend henüz yüklenmediyse (lastSyncDate yok) geçici tohum olarak
  // kullanılır; loadDailyData çalıştıktan sonra ASLA üzerine yazmaz — yoksa
  // calorieData.calories iki yazıcı arasında gidip gelir (2990 ↔ 2974 yarışı).
  useEffect(() => {
    if (formData && formData.calculatedPlan && !state.lastSyncDate) {
      const { dailyCalories, macros } = formData.calculatedPlan;
      updateCalorieGoalsFromSignup(dailyCalories, macros);
    }
  }, [formData]);

  // Tarih değiştiğinde backend'den veri çek — yalnızca giriş yapıldıysa
  // (login öncesi token yok → gereksiz 401 hatalarını önler)
  useEffect(() => {
    if (!isAuthenticated) return;
    const dateString = NutritionService.formatDate(currentDate);
    if (state.lastSyncDate !== dateString) {
      loadDailyData(currentDate);
    }
  }, [currentDate, isAuthenticated]);

  // SignUp verilerinden kalori hedeflerini güncelle
  const updateCalorieGoalsFromSignup = (dailyCalories, macros) => {
    const breakfast = Math.round(dailyCalories * 0.3);
    const lunch = Math.round(dailyCalories * 0.3);
    const dinner = Math.round(dailyCalories * 0.3);
    const snack = Math.round(dailyCalories * 0.1);

    setState((prevState) => ({
      ...prevState,
      caloriesLeft: dailyCalories - prevState.consumedCalories,
      calorieData: {
        calories: dailyCalories,
        carbs: macros.carbs,
        protein: macros.protein,
        fat: macros.fat,
      },
      meals: [
        {
          type: "Breakfast",
          consumed: prevState.meals[0]?.consumed || 0,
          total: breakfast,
        },
        {
          type: "Lunch",
          consumed: prevState.meals[1]?.consumed || 0,
          total: lunch,
        },
        {
          type: "Dinner",
          consumed: prevState.meals[2]?.consumed || 0,
          total: dinner,
        },
        {
          type: "Snack",
          consumed: prevState.meals[3]?.consumed || 0,
          total: snack,
        },
      ],
    }));
  };

  // Backend'den günlük veriyi yükle
  const loadDailyData = async (date) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      const dailyData = await NutritionService.getDailyNutrition(date);

      // Backend verisini frontend formatına çevir
      const transformedData = transformBackendDailyData(dailyData);

      setState((prevState) => ({
        ...prevState,
        ...transformedData,
        isLoading: false,
        lastSyncDate: NutritionService.formatDate(date),
      }));

    } catch (error) {
      console.error("Error loading daily data:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  // Backend verisini frontend formatına çevir
  const transformBackendDailyData = (dailyData) => {
    const { summary, foodEntries = [], activityEntries = [] } = dailyData;

    // Öğünlere göre yemekleri grupla
    const mealFoods = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    };

    let totalConsumedCalories = 0;
    let totalConsumedNutrients = { carbs: 0, protein: 0, fat: 0 };
    let mealTotals = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snack: 0,
    };

    // Food entries'leri işle
    foodEntries.forEach((entry) => {
      const transformedFood = NutritionService.transformBackendFood(entry);
      const mealType = transformedFood.mealType;

      if (mealFoods[mealType]) {
        mealFoods[mealType].push(transformedFood);
        mealTotals[mealType] += transformedFood.calories;
        totalConsumedCalories += transformedFood.calories;
        totalConsumedNutrients.carbs += transformedFood.carbs;
        totalConsumedNutrients.protein += transformedFood.protein;
        totalConsumedNutrients.fat += transformedFood.fat;
      }
    });

    // Activity entries'lerden toplam yakılan kaloriyi hesapla
    const totalBurnedCalories = activityEntries.reduce((total, activity) => {
      return total + (activity.calories_burned || 0);
    }, 0);

    // Öğün hedeflerini güncelle
    const dailyCalorieGoal =
      summary?.goals?.calories || state.calorieData.calories;
    const meals = [
      {
        type: "Breakfast",
        consumed: mealTotals.Breakfast,
        total: Math.round(dailyCalorieGoal * 0.3),
      },
      {
        type: "Lunch",
        consumed: mealTotals.Lunch,
        total: Math.round(dailyCalorieGoal * 0.3),
      },
      {
        type: "Dinner",
        consumed: mealTotals.Dinner,
        total: Math.round(dailyCalorieGoal * 0.3),
      },
      {
        type: "Snack",
        consumed: mealTotals.Snack,
        total: Math.round(dailyCalorieGoal * 0.1),
      },
    ];

    return {
      consumedCalories: totalConsumedCalories,
      caloriesLeft: Math.max(0, dailyCalorieGoal - totalConsumedCalories),
      burnedCalories: totalBurnedCalories,
      meals,
      mealFoods,
      consumedNutrients: {
        carbs: Math.round(totalConsumedNutrients.carbs * 10) / 10,
        protein: Math.round(totalConsumedNutrients.protein * 10) / 10,
        fat: Math.round(totalConsumedNutrients.fat * 10) / 10,
      },
      calorieData: {
        calories: dailyCalorieGoal,
        carbs: summary?.goals?.carbs || state.calorieData.carbs,
        protein: summary?.goals?.protein || state.calorieData.protein,
        fat: summary?.goals?.fat || state.calorieData.fat,
      },
    };
  };

  const changeDate = (newDate) => {
    setCurrentDate(newDate);
  };

  // Kalori hedefi güncelleme fonksiyonu
  const updateCalorieGoal = async (newCalories) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      // Backend'e kalori hedefini güncelle
      await NutritionService.updateCalorieGoal(newCalories);

      // Local state'i güncelle
      const carbsGrams = Math.round((newCalories * 0.5) / 4);
      const proteinGrams = Math.round((newCalories * 0.25) / 4);
      const fatGrams = Math.round((newCalories * 0.25) / 9);

      const breakfast = Math.round(newCalories * 0.3);
      const lunch = Math.round(newCalories * 0.3);
      const dinner = Math.round(newCalories * 0.3);
      const snack = Math.round(newCalories * 0.1);

      setState((prevState) => ({
        ...prevState,
        calorieData: {
          calories: newCalories,
          carbs: carbsGrams,
          protein: proteinGrams,
          fat: fatGrams,
        },
        caloriesLeft: Math.max(0, newCalories - prevState.consumedCalories),
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
        isLoading: false,
      }));

    } catch (error) {
      console.error("Error updating calorie goal:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
      throw error;
    }
  };

  // Yemek ekleme fonksiyonu - UPDATED with Recent Foods Database Integration
  const addFood = async (selectedFood) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));
      const { mealType } = selectedFood;

      // Backend formatına çevir
      const backendFoodData = NutritionService.formatFoodForBackend(
        selectedFood,
        mealType,
        currentDate
      );

      // Backend'e gönder
      const savedFood = await NutritionService.addFood(backendFoodData);

      // Recent foods'a ekle (background'da, hata olursa devam et)
      try {
        await NutritionService.addToRecentFoods(selectedFood);
        setTimeout(() => {
          loadRecentFoods().catch(() => {});
        }, 500);
      } catch (recentError) {
        // Recent foods hatası critical değil, devam et
      }

      // Local state'i güncelle
      const foodId = savedFood.id || Date.now().toString();
      const {
        name,
        calories,
        carbs = 0,
        protein = 0,
        fat = 0,
        weight,
        portionSize,
        portionUnit,
      } = selectedFood;

      setState((prevState) => {
        const mealIndex = prevState.meals.findIndex(
          (meal) => meal.type === mealType
        );
        if (mealIndex === -1) return { ...prevState, isLoading: false };

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
            Math.round((prevState.consumedNutrients.protein + protein) * 10) /
            10,
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
          backendId: savedFood.id,
          icon: selectedFood.icon,
          isPersonal: selectedFood.isPersonal,
          isCustomFood: selectedFood.isCustomFood,
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
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error adding food:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
      throw error;
    }
  };

  // Yemek silme fonksiyonu (Backend ile senkronize) - ID TYPE FIXED VERSION
  const deleteFood = async (foodId, mealType) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      // Mevcut state'i kontrol et
      if (!state.mealFoods[mealType]) {
        setState((prevState) => ({ ...prevState, isLoading: false }));
        throw new Error(`Meal type ${mealType} not found`);
      }

      // Local state'ten yemeği bul - ID tipini dikkate alarak
      const foodToDelete = state.mealFoods[mealType]?.find((food) => {
        const foodIdStr = food.id?.toString();
        const searchIdStr = foodId?.toString();
        return foodIdStr === searchIdStr || food.id === foodId;
      });

      if (!foodToDelete) {
        setState((prevState) => ({ ...prevState, isLoading: false }));
        throw new Error("Food not found in meal");
      }

      // Backend'den silme işlemi - ID TİP DÜZELTMESİ
      let backendDeleteSuccess = false;
      try {
        // Backend ID'si varsa onu kullan, yoksa normal ID'yi kullan
        let backendId = foodToDelete.backendId || foodToDelete.id;

        if (backendId) {
          const backendIdInt = parseInt(backendId, 10);

          if (isNaN(backendIdInt)) {
            throw new Error("Invalid backend ID format");
          }

          await NutritionService.deleteFood(backendIdInt);
          backendDeleteSuccess = true;
        }
      } catch (backendError) {
        console.error("Backend delete error:", backendError);
      }

      // Local state'i güncelle
      setState((prevState) => {
        const mealIndex = prevState.meals.findIndex(
          (meal) => meal.type === mealType
        );

        if (mealIndex === -1) {
          return { ...prevState, isLoading: false };
        }

        // Kalori ve besin değerlerini hesapla
        const deletedCalories = parseFloat(foodToDelete.calories) || 0;
        const deletedCarbs = parseFloat(foodToDelete.carbs) || 0;
        const deletedProtein = parseFloat(foodToDelete.protein) || 0;
        const deletedFat = parseFloat(foodToDelete.fat) || 0;

        // Güncellenmiş öğünler array'i oluştur
        const updatedMeals = [...prevState.meals];
        updatedMeals[mealIndex] = {
          ...updatedMeals[mealIndex],
          consumed: Math.max(
            0,
            updatedMeals[mealIndex].consumed - deletedCalories
          ),
        };

        // Yeni toplam kalori hesapla
        const newConsumedCalories = Math.max(
          0,
          prevState.consumedCalories - deletedCalories
        );
        const newCaloriesLeft =
          prevState.calorieData.calories - newConsumedCalories;

        // Yeni besin değerleri hesapla
        const newConsumedNutrients = {
          carbs: Math.max(
            0,
            Math.round(
              (prevState.consumedNutrients.carbs - deletedCarbs) * 10
            ) / 10
          ),
          protein: Math.max(
            0,
            Math.round(
              (prevState.consumedNutrients.protein - deletedProtein) * 10
            ) / 10
          ),
          fat: Math.max(
            0,
            Math.round((prevState.consumedNutrients.fat - deletedFat) * 10) / 10
          ),
        };

        // Güncellenmiş meal foods listesi oluştur
        const updatedMealFoods = {
          ...prevState.mealFoods,
          [mealType]: prevState.mealFoods[mealType].filter((food) => {
            const foodIdStr = food.id?.toString();
            const searchIdStr = foodId?.toString();
            return foodIdStr !== searchIdStr && food.id !== foodId;
          }),
        };

        return {
          ...prevState,
          meals: updatedMeals,
          consumedCalories: newConsumedCalories,
          caloriesLeft: newCaloriesLeft,
          consumedNutrients: newConsumedNutrients,
          mealFoods: updatedMealFoods,
          isLoading: false,
        };
      });

      // Backend'den veriyi yenile (opsiyonel, güvenlik için)
      if (backendDeleteSuccess) {
        setTimeout(async () => {
          try {
            await refreshData();
          } catch (refreshError) {
            // non-critical
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Delete food error:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
      throw error;
    }
  };

  // Favori yemekleri yükle
  // Favori yemekleri yükle - ENHANCED VERSION with STATE UPDATE
  const loadFavoriteFoods = async () => {
    try {
      const favorites = await NutritionService.getFavoriteFoods();

      // Backend verisini frontend formatına çevir
      const transformedFavorites = favorites.map((favorite) => ({
        id: favorite.food_id || favorite.id,
        food_id: favorite.food_id, // Backend compatibility
        name: favorite.food_name || favorite.foodName,
        calories: Math.round(
          favorite.calories_per_100g || favorite.caloriesPer100g || 0
        ),
        protein:
          Math.round(
            (favorite.protein_per_100g || favorite.proteinPer100g || 0) * 10
          ) / 10,
        carbs:
          Math.round(
            (favorite.carbs_per_100g || favorite.carbsPer100g || 0) * 10
          ) / 10,
        fat:
          Math.round((favorite.fat_per_100g || favorite.fatPer100g || 0) * 10) /
          10,
        weight: 100,
        portionSize: 100,
        portionUnit: "gram (g)",
        isCustomFood: favorite.is_custom_food || favorite.isCustomFood || false,
        backendId: favorite.id,
        created_at: favorite.created_at,
      }));

      setState((prevState) => ({
        ...prevState,
        favoriteFoods: [...transformedFavorites],
      }));

      return transformedFavorites;
    } catch (error) {
      console.error("Error loading favorite foods:", error);

      // Hata durumunda boş array ile state'i güncelle
      setState((prevState) => ({
        ...prevState,
        favoriteFoods: [],
      }));

      return [];
    }
  };

  // Favoriye ekle/çıkar - ENHANCED VERSION with STATE FIX
  const toggleFavorite = async (food) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      const isFavorite = state.favoriteFoods.some(
        (item) => item.id === food.id || item.food_id === food.id
      );

      if (isFavorite) {
        await NutritionService.removeFromFavorites(food.id);

        setState((prevState) => ({
          ...prevState,
          favoriteFoods: prevState.favoriteFoods.filter(
            (item) => item.id !== food.id && item.food_id !== food.id
          ),
          isLoading: false,
        }));
      } else {
        const favoriteData = {
          foodId: food.id,
          foodName: food.name,
          caloriesPer100g: food.calories || 0,
          proteinPer100g: food.protein || 0,
          carbsPer100g: food.carbs || 0,
          fatPer100g: food.fat || 0,
          isCustomFood: food.isPersonal || food.isCustomFood || false,
        };

        const savedFavorite = await NutritionService.addToFavorites(
          favoriteData
        );

        const newFavoriteFood = {
          ...food,
          food_id: food.id,
          backendId: savedFavorite.id,
          is_custom_food: favoriteData.isCustomFood,
        };

        setState((prevState) => ({
          ...prevState,
          favoriteFoods: [...prevState.favoriteFoods, newFavoriteFood],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
      throw error;
    }
  };

  // Custom foods yükle
  const loadPersonalFoods = async () => {
    try {
      const customFoods = await NutritionService.getCustomFoods();

      // Backend formatından frontend formatına çevir
      const transformedFoods = customFoods.map((food) => ({
        id: food.id?.toString() || Date.now().toString(),
        name: food.food_name || food.foodName,
        calories: Math.round(food.calories_per_100g || 0),
        protein: Math.round((food.protein_per_100g || 0) * 10) / 10,
        carbs: Math.round((food.carbs_per_100g || 0) * 10) / 10,
        fat: Math.round((food.fat_per_100g || 0) * 10) / 10,
        weight: food.serving_size || 100,
        portionSize: food.serving_size || 100,
        portionUnit: "gram (g)",
        isPersonal: true,
        isCustomFood: true,
        backendId: food.id,
        description: food.description,
      }));

      setState((prevState) => ({
        ...prevState,
        personalFoods: transformedFoods,
      }));

      return transformedFoods;
    } catch (error) {
      console.error("Error loading personal foods:", error);
      return [];
    }
  };

  // Recent foods yükle - DATABASE INTEGRATION
  const loadRecentFoods = async () => {
    try {
      const backendRecentFoods = await NutritionService.getRecentFoods();

      // Backend verisini frontend formatına çevir
      const transformedRecentFoods = backendRecentFoods
        .filter(
          (food) =>
            food.food_name &&
            food.food_name.trim() !== "" &&
            food.food_id &&
            food.food_id.trim() !== "" &&
            food.calories_per_100g !== null &&
            food.calories_per_100g !== undefined &&
            food.calories_per_100g >= 0
        )
        .map((food) => ({
          id: food.food_id,
          name: food.food_name.trim(),
          calories: Math.round(parseFloat(food.calories_per_100g) || 0),
          protein:
            Math.round((parseFloat(food.protein_per_100g) || 0) * 10) / 10,
          carbs: Math.round((parseFloat(food.carbs_per_100g) || 0) * 10) / 10,
          fat: Math.round((parseFloat(food.fat_per_100g) || 0) * 10) / 10,
          weight: 100,
          portionSize: 100,
          portionUnit: "gram (g)",
          isCustomFood: food.is_custom_food || false,
          lastAccessed: food.last_accessed,
          createdAt: food.created_at,
        }))
        .slice(0, 10); // En fazla 10 tane

      setState((prevState) => ({
        ...prevState,
        recentFoods: transformedRecentFoods,
      }));

      // Local storage'ı da güncelle (backward compatibility için)
      try {
        await AsyncStorage.setItem(
          "@recent_foods",
          JSON.stringify(transformedRecentFoods)
        );
      } catch (storageError) {
        // non-critical
      }

      return transformedRecentFoods;
    } catch (error) {
      console.error("Error loading recent foods from database:", error);

      // Fallback to local storage if database fails
      try {
        const storedRecents = await AsyncStorage.getItem("@recent_foods");
        if (storedRecents) {
          const localRecentFoods = JSON.parse(storedRecents);

          setState((prevState) => ({
            ...prevState,
            recentFoods: localRecentFoods.slice(0, 10),
          }));

          return localRecentFoods;
        }
      } catch (storageError) {
        // local storage fallback failed
      }

      return [];
    }
  };

  // Recent'a yemek ekleme - DEPRECATED (artık addFood içinde otomatik yapılıyor)
  const addToRecent = async (food) => {
    try {

      setState((prevState) => {
        const filteredRecents = prevState.recentFoods.filter(
          (item) => item.id !== food.id
        );
        const updatedRecents = [
          { ...food, lastUsed: new Date().toISOString() },
          ...filteredRecents,
        ].slice(0, 10);

        AsyncStorage.setItem(
          "@recent_foods",
          JSON.stringify(updatedRecents)
        ).catch(() => {});

        return {
          ...prevState,
          recentFoods: updatedRecents,
        };
      });
    } catch (error) {
      console.error("Error adding to recent foods:", error);
    }
  };

  // Recent foods'u temizle - DATABASE + LOCAL STORAGE
  const clearRecentFoods = async () => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      try {
        await NutritionService.clearRecentFoods();
      } catch (backendError) {
        console.error("Backend clear recent foods error:", backendError);
      }

      try {
        await AsyncStorage.removeItem("@recent_foods");
      } catch (storageError) {
        // non-critical
      }

      setState((prevState) => ({
        ...prevState,
        recentFoods: [],
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error("Clear recent foods error:", error);

      setState((prevState) => ({
        ...prevState,
        recentFoods: [],
        isLoading: false,
      }));

      try {
        await AsyncStorage.removeItem("@recent_foods");
      } catch (storageError) {
        // non-critical
      }

      throw error;
    }
  };

  // Kişisel yemek ekleme
  const addPersonalFood = async (food) => {
    try {
      const customFoodData = {
        foodName: food.name,
        caloriesPer100g: food.calories,
        proteinPer100g: food.protein || 0,
        carbsPer100g: food.carbs || 0,
        fatPer100g: food.fat || 0,
        servingSize: food.portionSize || 100,
        description: food.description || "",
      };

      const savedFood = await NutritionService.addCustomFood(customFoodData);

      setState((prevState) => {
        const existingIndex = prevState.personalFoods.findIndex(
          (item) => item.id === food.id
        );
        let updatedPersonalFoods;

        if (existingIndex >= 0) {
          updatedPersonalFoods = [...prevState.personalFoods];
          updatedPersonalFoods[existingIndex] = {
            ...food,
            backendId: savedFood.id,
          };
        } else {
          updatedPersonalFoods = [
            ...prevState.personalFoods,
            { ...food, backendId: savedFood.id },
          ];
        }

        return {
          ...prevState,
          personalFoods: updatedPersonalFoods,
        };
      });

      return savedFood;
    } catch (error) {
      console.error("Error adding personal food:", error);
      throw error;
    }
  };

  // Kişisel yemek silme
  const deletePersonalFood = async (foodId) => {
    try {
      const foodToDelete = state.personalFoods.find(
        (food) => food.id === foodId
      );

      if (foodToDelete && foodToDelete.backendId) {
        await NutritionService.deleteCustomFood(foodToDelete.backendId);
      }

      setState((prevState) => ({
        ...prevState,
        personalFoods: prevState.personalFoods.filter(
          (food) => food.id !== foodId
        ),
      }));
    } catch (error) {
      console.error("Error deleting personal food:", error);
      throw error;
    }
  };

  // Porsiyon güncelleme fonksiyonu
  const updateFoodPortion = async (
    foodId,
    mealType,
    newPortionSize,
    newPortionUnit,
    newCalories,
    newCarbs,
    newProtein,
    newFat
  ) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      setState((prevState) => {
        const mealFoods = prevState.mealFoods[mealType] || [];
        const foodIndex = mealFoods.findIndex((food) => food.id === foodId);

        if (foodIndex === -1) return { ...prevState, isLoading: false };

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
            Math.round((prevState.consumedNutrients.carbs + carbsDiff) * 10) /
            10,
          protein:
            Math.round(
              (prevState.consumedNutrients.protein + proteinDiff) * 10
            ) / 10,
          fat:
            Math.round((prevState.consumedNutrients.fat + fatDiff) * 10) / 10,
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
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error updating food portion:", error);
      setState((prevState) => ({ ...prevState, isLoading: false }));
      throw error;
    }
  };

  // Tüm veriyi yenile
  const refreshData = async () => {
    try {
      await loadDailyData(currentDate);
      await Promise.all([
        loadFavoriteFoods(),
        loadPersonalFoods(),
        loadRecentFoods(),
      ]);
    } catch (error) {
      console.error("Error refreshing meals data:", error);
      throw error;
    }
  };

  // Liste verilerini yükle — yalnızca giriş yapıldıktan sonra.
  // Günlük veri [currentDate] effect'i tarafından zaten yüklenir.
  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      loadFavoriteFoods(),
      loadPersonalFoods(),
      loadRecentFoods(),
    ]).catch(() => {});
  }, [isAuthenticated]);

  const contextValue = {
    ...state,
    currentDate,
    changeDate,
    addFood,
    deleteFood,
    toggleFavorite,
    addToRecent,
    clearRecentFoods,
    addPersonalFood,
    deletePersonalFood,
    updateFoodPortion,
    updateCalorieGoal,
    loadDailyData,
    loadFavoriteFoods,
    loadPersonalFoods,
    loadRecentFoods,
    refreshData,
  };

  return (
    <MealsContext.Provider value={contextValue}>
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = () => useContext(MealsContext);
