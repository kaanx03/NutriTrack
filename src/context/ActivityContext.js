// src/context/ActivityContext.js - Complete Backend Integration
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSignUp } from "./SignUpContext";
import NutritionService from "../services/NutritionService";

// Başlangıç değerleri
const initialState = {
  burnedCalories: 0,
  activities: [],
  favoriteActivities: [],
  recentActivities: [],
  personalActivities: [],
  isLoading: false,
  lastSyncDate: null,
  error: null,
};

const ActivityContext = createContext(initialState);

export const ActivityProvider = ({ children }) => {
  const { formData } = useSignUp();
  const [state, setState] = useState(initialState);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Tarih değiştiğinde backend'den veri çek
  useEffect(() => {
    const dateString = NutritionService.formatDate(currentDate);
    if (state.lastSyncDate !== dateString) {
      console.log(
        "ActivityContext - Date changed, loading data for:",
        dateString
      );
      loadDailyActivities(currentDate);
    }
  }, [currentDate]);

  // Component mount olduğunda veri yükle
  useEffect(() => {
    initializeData();
  }, []);

  // Tüm verileri yükle
  const initializeData = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await Promise.all([
        loadDailyActivities(currentDate),
        loadFavoriteActivities(),
        loadPersonalActivities(),
        loadRecentActivities(),
      ]);

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Initialize data error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load activity data",
      }));
    }
  };

  // External date change handler (MealsContext'ten date değişimi geldiğinde)
  const syncWithDate = (newDate) => {
    console.log("ActivityContext - Syncing with new date:", newDate);
    setCurrentDate(newDate);
  };

  // Backend'den günlük aktiviteleri yükle
  const loadDailyActivities = async (date) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log(
        "Loading daily activities for date:",
        NutritionService.formatDate(date)
      );

      // İki yoldan veri al: 1) daily nutrition (genel), 2) activity logs (detaylı)
      const [dailyData, activityLogs] = await Promise.all([
        NutritionService.getDailyNutrition(date).catch(() => ({
          activityEntries: [],
        })),
        NutritionService.getDailyActivities(date).catch(() => []),
      ]);

      // Activity logs öncelikli (daha detaylı)
      let activities = [];

      if (activityLogs && activityLogs.length > 0) {
        activities = activityLogs.map((log) =>
          NutritionService.transformBackendActivity(log)
        );
      } else if (
        dailyData.activityEntries &&
        dailyData.activityEntries.length > 0
      ) {
        activities = dailyData.activityEntries.map((entry) =>
          NutritionService.transformBackendActivity(entry)
        );
      }

      // Toplam yakılan kaloriyi hesapla
      const totalBurnedCalories = activities.reduce((total, activity) => {
        return total + (activity.calories || 0);
      }, 0);

      console.log(
        `ActivityContext - Loaded ${activities.length} activities, total calories: ${totalBurnedCalories}`
      );

      setState((prevState) => ({
        ...prevState,
        activities,
        burnedCalories: totalBurnedCalories,
        isLoading: false,
        lastSyncDate: NutritionService.formatDate(date),
        error: null,
      }));
    } catch (error) {
      console.error("Error loading daily activities:", error);
      setState((prevState) => ({
        ...prevState,
        activities: [],
        burnedCalories: 0,
        isLoading: false,
        error: "Failed to load daily activities",
      }));
    }
  };

  // Favori aktiviteleri yükle
  const loadFavoriteActivities = async () => {
    try {
      console.log("Loading favorite activities...");
      const favorites = await NutritionService.getFavoriteActivities();

      const transformedFavorites = favorites.map((fav) =>
        NutritionService.transformBackendFavoriteActivity(fav)
      );

      setState((prevState) => ({
        ...prevState,
        favoriteActivities: transformedFavorites,
      }));

      console.log(`Loaded ${transformedFavorites.length} favorite activities`);
    } catch (error) {
      console.error("Error loading favorite activities:", error);
    }
  };

  // Kişisel aktiviteleri yükle
  const loadPersonalActivities = async () => {
    try {
      console.log("Loading personal activities...");
      const customActivities = await NutritionService.getCustomActivities();

      const transformedCustom = customActivities.map((custom) =>
        NutritionService.transformBackendCustomActivity(custom)
      );

      setState((prevState) => ({
        ...prevState,
        personalActivities: transformedCustom,
      }));

      console.log(`Loaded ${transformedCustom.length} personal activities`);
    } catch (error) {
      console.error("Error loading personal activities:", error);
    }
  };

  // Yakın zamanda kullanılan aktiviteleri yükle
  const loadRecentActivities = async () => {
    try {
      console.log("Loading recent activities...");
      const recentActivities = await NutritionService.getRecentActivities(10);

      const transformedRecent = recentActivities.map((recent) => ({
        id: recent.activity_id || Date.now().toString(),
        name: recent.activity_name || "Unknown Activity",
        calories: Math.round(recent.avg_calories_per_minute * 30), // 30 dakika için
        mins: 30,
        duration: 30,
        type: "Cardio",
        intensity: "Moderate",
        lastUsed: recent.last_used,
      }));

      setState((prevState) => ({
        ...prevState,
        recentActivities: transformedRecent,
      }));

      console.log(`Loaded ${transformedRecent.length} recent activities`);
    } catch (error) {
      console.error("Error loading recent activities:", error);
    }
  };

  // Tarih değiştirme fonksiyonu
  const changeDate = (newDate) => {
    console.log(
      "ActivityContext - Changing date from",
      currentDate,
      "to",
      newDate
    );
    setCurrentDate(newDate);
  };

  // Reset günlük veriler (tarih değişiminde)
  const resetDailyData = () => {
    setState((prevState) => ({
      ...prevState,
      activities: [],
      burnedCalories: 0,
      lastSyncDate: null,
    }));
  };

  // Aktivite ekleme/güncelleme fonksiyonu (Backend ile senkronize)
  const addActivity = async (activity) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      const {
        id,
        name,
        calories,
        duration = 30,
        type = "Cardio",
        intensity = "Moderate",
      } = activity;

      console.log("ActivityContext - Adding activity:", {
        id,
        name,
        calories,
        duration,
        type,
        intensity,
      });

      // Validasyon
      if (!name || !calories || calories <= 0) {
        throw new Error("Activity name and valid calories are required");
      }

      if (!duration || duration <= 0) {
        throw new Error("Valid duration is required");
      }

      // Backend için format
      const backendActivityData = {
        activityName: String(name).trim(),
        activityId: id || `activity_${Date.now()}`,
        durationMinutes: parseInt(duration),
        caloriesBurned: parseFloat(calories),
        intensity: String(intensity).toLowerCase(),
        date: currentDate,
      };

      console.log(
        "ActivityContext - Formatted data for backend:",
        backendActivityData
      );

      // Backend'e gönder
      const savedActivity = await NutritionService.addActivity(
        backendActivityData
      );
      console.log("Activity added to backend:", savedActivity);

      // Benzersiz ID kullan
      const activityId = savedActivity.id || id || Date.now().toString();

      setState((prevState) => {
        // Eğer aynı ID ile bir aktivite zaten varsa (güncelleme işlemi)
        const existingIndex = prevState.activities.findIndex(
          (act) => act.id === activityId
        );

        if (existingIndex !== -1) {
          // Güncelleme işlemi
          const oldCalories = prevState.activities[existingIndex].calories;
          const caloriesDifference = calories - oldCalories;

          // Yeni aktiviteler dizisi oluştur
          const newActivities = [...prevState.activities];
          newActivities[existingIndex] = {
            ...activity,
            id: activityId,
            name,
            calories,
            duration,
            type,
            intensity,
            addedAt: prevState.activities[existingIndex].addedAt,
            backendId: savedActivity.id,
          };

          return {
            ...prevState,
            burnedCalories: prevState.burnedCalories + caloriesDifference,
            activities: newActivities,
            isLoading: false,
          };
        }

        // Yeni ekleme işlemi
        const newActivity = {
          id: activityId,
          name,
          calories,
          duration,
          type,
          intensity,
          addedAt: new Date().toISOString(),
          backendId: savedActivity.id,
        };

        // Toplam yakılan kalori
        const newBurnedCalories = prevState.burnedCalories + calories;

        return {
          ...prevState,
          burnedCalories: newBurnedCalories,
          activities: [...prevState.activities, newActivity],
          isLoading: false,
        };
      });

      // Recent activities'e ekle
      addToRecentActivity(activity);
    } catch (error) {
      console.error("Error adding activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to add activity",
      }));
      throw error;
    }
  };

  // Aktivite güncelleme fonksiyonu
  const updateActivity = async (activityId, updateData) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log(
        "ActivityContext - Updating activity:",
        activityId,
        updateData
      );

      // Backend'e güncelleme gönder
      const updatedActivity = await NutritionService.updateActivity(
        activityId,
        updateData
      );
      console.log("Activity updated in backend:", updatedActivity);

      setState((prevState) => {
        const activityIndex = prevState.activities.findIndex(
          (act) => act.id === activityId || act.backendId === activityId
        );

        if (activityIndex === -1) {
          return { ...prevState, isLoading: false };
        }

        const oldActivity = prevState.activities[activityIndex];
        const oldCalories = oldActivity.calories;
        const newCalories =
          updateData.calories || updateData.caloriesBurned || oldCalories;
        const caloriesDifference = newCalories - oldCalories;

        const newActivities = [...prevState.activities];
        newActivities[activityIndex] = {
          ...oldActivity,
          ...updateData,
          calories: newCalories,
          name: updateData.name || updateData.activityName || oldActivity.name,
          duration:
            updateData.duration ||
            updateData.durationMinutes ||
            oldActivity.duration,
          intensity: updateData.intensity || oldActivity.intensity,
        };

        return {
          ...prevState,
          activities: newActivities,
          burnedCalories: prevState.burnedCalories + caloriesDifference,
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error updating activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to update activity",
      }));
      throw error;
    }
  };

  // Basit kalori yakma fonksiyonu (belirli bir kalori değeri için)
  const burnCalories = (calories) => {
    setState((prevState) => ({
      ...prevState,
      burnedCalories: prevState.burnedCalories + calories,
    }));
  };

  // Aktivite silme fonksiyonu (Backend ile senkronize)
  const deleteActivity = async (activityId) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log("ActivityContext - Deleting activity:", activityId);

      // Backend'den sil
      await NutritionService.deleteActivity(activityId);
      console.log("Activity deleted from backend");

      setState((prevState) => {
        // Silinecek aktiviteyi bul
        const activityToDelete = prevState.activities.find(
          (activity) =>
            activity.id === activityId || activity.backendId === activityId
        );

        if (!activityToDelete) {
          return { ...prevState, isLoading: false };
        }

        // Yakılan kaloriyi güncelle
        const newBurnedCalories = Math.max(
          0,
          prevState.burnedCalories - activityToDelete.calories
        );

        return {
          ...prevState,
          burnedCalories: newBurnedCalories,
          activities: prevState.activities.filter(
            (activity) =>
              activity.id !== activityId && activity.backendId !== activityId
          ),
          isLoading: false,
        };
      });
    } catch (error) {
      console.error("Error deleting activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to delete activity",
      }));
      throw error;
    }
  };

  // Favori aktivite ekleme/çıkarma fonksiyonu
  const toggleFavoriteActivity = async (activity) => {
    try {
      const isFavorite = state.favoriteActivities.some(
        (item) => item.id === activity.id
      );

      console.log(
        "Toggling favorite activity:",
        activity.name,
        "Currently favorite:",
        isFavorite
      );

      if (isFavorite) {
        // Favorilerden çıkar
        await NutritionService.removeActivityFromFavorites(activity.id);
        setState((prevState) => ({
          ...prevState,
          favoriteActivities: prevState.favoriteActivities.filter(
            (item) => item.id !== activity.id
          ),
        }));
        console.log("Removed from favorites");
      } else {
        // Favorilere ekle
        const favoriteData =
          NutritionService.formatFavoriteActivityForBackend(activity);
        await NutritionService.addActivityToFavorites(favoriteData);
        setState((prevState) => ({
          ...prevState,
          favoriteActivities: [...prevState.favoriteActivities, activity],
        }));
        console.log("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite activity:", error);
    }
  };

  // Son görüntülenen aktivite ekleme fonksiyonu
  const addToRecentActivity = (activity) => {
    setState((prevState) => {
      // Eğer aktivite zaten varsa listeden çıkar (sonra başa eklemek için)
      const filteredRecents = prevState.recentActivities.filter(
        (item) => item.id !== activity.id
      );

      // Aktiviteyi listenin başına ekle ve en fazla 10 aktivite tut
      const updatedRecents = [activity, ...filteredRecents].slice(0, 10);

      return {
        ...prevState,
        recentActivities: updatedRecents,
      };
    });
  };

  // Kişisel aktivite ekleme fonksiyonu
  const addPersonalActivity = async (activity) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log("Adding personal activity:", activity);

      const customActivityData =
        NutritionService.formatCustomActivityForBackend(activity);
      const savedActivity = await NutritionService.addCustomActivity(
        customActivityData
      );

      setState((prevState) => {
        // Eğer aynı ID'ye sahip bir aktivite varsa güncelle, yoksa ekle
        const existingIndex = prevState.personalActivities.findIndex(
          (item) => item.id === activity.id
        );

        let updatedPersonalActivities;
        if (existingIndex >= 0) {
          updatedPersonalActivities = [...prevState.personalActivities];
          updatedPersonalActivities[existingIndex] = {
            ...activity,
            backendId: savedActivity.id,
          };
        } else {
          updatedPersonalActivities = [
            ...prevState.personalActivities,
            { ...activity, backendId: savedActivity.id },
          ];
        }

        return {
          ...prevState,
          personalActivities: updatedPersonalActivities,
          isLoading: false,
        };
      });

      console.log("Personal activity added successfully");
    } catch (error) {
      console.error("Error adding personal activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to add personal activity",
      }));
      throw error;
    }
  };

  // Kişisel aktivite güncelleme fonksiyonu
  const updatePersonalActivity = async (activityId, updateData) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log("Updating personal activity:", activityId, updateData);

      const updatedActivity = await NutritionService.updateCustomActivity(
        activityId,
        updateData
      );

      setState((prevState) => {
        const activityIndex = prevState.personalActivities.findIndex(
          (item) => item.id === activityId || item.backendId === activityId
        );

        if (activityIndex === -1) {
          return { ...prevState, isLoading: false };
        }

        const updatedPersonalActivities = [...prevState.personalActivities];
        updatedPersonalActivities[activityIndex] = {
          ...updatedPersonalActivities[activityIndex],
          ...updateData,
        };

        return {
          ...prevState,
          personalActivities: updatedPersonalActivities,
          isLoading: false,
        };
      });

      console.log("Personal activity updated successfully");
    } catch (error) {
      console.error("Error updating personal activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to update personal activity",
      }));
      throw error;
    }
  };

  // Kişisel aktivite silme fonksiyonu
  const deletePersonalActivity = async (activityId) => {
    try {
      setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

      console.log("Deleting personal activity:", activityId);

      await NutritionService.deleteCustomActivity(activityId);

      setState((prevState) => ({
        ...prevState,
        personalActivities: prevState.personalActivities.filter(
          (activity) =>
            activity.id !== activityId && activity.backendId !== activityId
        ),
        isLoading: false,
      }));

      console.log("Personal activity deleted successfully");
    } catch (error) {
      console.error("Error deleting personal activity:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: "Failed to delete personal activity",
      }));
      throw error;
    }
  };

  // Manual refresh function
  const refreshData = async () => {
    console.log("Refreshing all activity data...");
    await initializeData();
  };

  // Error temizleme
  const clearError = () => {
    setState((prevState) => ({ ...prevState, error: null }));
  };

  const contextValue = {
    ...state,
    currentDate,
    changeDate,
    syncWithDate,
    resetDailyData,
    addActivity,
    updateActivity,
    burnCalories,
    deleteActivity,
    toggleFavoriteActivity,
    addToRecentActivity,
    addPersonalActivity,
    updatePersonalActivity,
    deletePersonalActivity,
    loadDailyActivities,
    loadFavoriteActivities,
    loadPersonalActivities,
    loadRecentActivities,
    refreshData,
    clearError,
  };

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => useContext(ActivityContext);
