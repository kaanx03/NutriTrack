// src/services/NutritionService.js - Complete Enhanced Version with Database Recent Foods
import AuthService from "./AuthService";

const API_URL = "http://10.0.2.2:3001/api";

class NutritionService {
  // Genel API çağrı helper'ı
  async request(path, options = {}) {
    try {
      const url = `${API_URL}${path}`;
      console.log(`NutritionService - Making request to: ${url}`);

      const config = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };

      // Token'ı ekle
      if (AuthService.token) {
        config.headers.Authorization = `Bearer ${AuthService.token}`;
      }

      if (options.body && typeof options.body === "object") {
        config.body = JSON.stringify(options.body);
        console.log("Request body:", config.body);
      }

      const response = await fetch(url, config);
      console.log(`NutritionService - Response status: ${response.status}`);

      let result;
      try {
        result = await response.json();
        console.log("Response data:", result);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        const message =
          result.error || result.details || `HTTP Error: ${response.status}`;
        console.error("API Error:", message, "Details:", result);
        throw new Error(message);
      }

      return result;
    } catch (error) {
      console.error("NutritionService request error:", error);
      throw error;
    }
  }

  // ====== DAILY NUTRITION API'S ======

  // Günlük beslenme verilerini al
  async getDailyNutrition(date) {
    try {
      const formattedDate = this.formatDate(date);
      const result = await this.request(`/nutrition/daily/${formattedDate}`);
      return result.data;
    } catch (error) {
      console.error("Get daily nutrition error:", error);
      throw error;
    }
  }

  // Günlük hedefleri güncelle
  async updateDailyGoals(date, goals) {
    try {
      const formattedDate = this.formatDate(date);
      const result = await this.request(
        `/nutrition/daily/${formattedDate}/goals`,
        {
          method: "PUT",
          body: goals,
        }
      );
      return result.data;
    } catch (error) {
      console.error("Update daily goals error:", error);
      throw error;
    }
  }

  // ====== FOOD API'S ======

  // Yemek ekleme
  async addFood(foodData) {
    try {
      const result = await this.request("/nutrition/food", {
        method: "POST",
        body: foodData,
      });
      return result.data;
    } catch (error) {
      console.error("Add food error:", error);
      throw error;
    }
  }

  // Yemek silme - ID TYPE FIXED VERSION
  async deleteFood(entryId) {
    try {
      console.log("=== NutritionService DELETE FOOD START ===");
      console.log(
        "Delete food with entry ID:",
        entryId,
        "Type:",
        typeof entryId
      );

      // Entry ID validation
      if (!entryId || entryId === "undefined" || entryId === "null") {
        throw new Error("Invalid entry ID provided for deletion");
      }

      // ID'yi integer'a çevir ve validate et
      let cleanEntryId;
      if (typeof entryId === "number") {
        cleanEntryId = entryId;
      } else {
        cleanEntryId = parseInt(entryId, 10);
      }

      if (isNaN(cleanEntryId) || cleanEntryId <= 0) {
        throw new Error(
          `Invalid entry ID format: ${entryId}. Must be a positive integer.`
        );
      }

      console.log(
        "Sending delete request with ID:",
        cleanEntryId,
        "Type:",
        typeof cleanEntryId
      );

      const result = await this.request(`/nutrition/food/${cleanEntryId}`, {
        method: "DELETE",
      });

      console.log("=== NutritionService DELETE FOOD SUCCESS ===");
      console.log("Delete result:", result);

      return result;
    } catch (error) {
      console.error("=== NutritionService DELETE FOOD ERROR ===");
      console.error("Error details:", {
        entryId,
        entryIdType: typeof entryId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Favori yemekleri al
  async getFavoriteFoods() {
    try {
      const result = await this.request("/food/favorites");
      return result.data;
    } catch (error) {
      console.error("Get favorite foods error:", error);
      return [];
    }
  }

  // Yemeği favorilere ekle
  async addToFavorites(foodData) {
    try {
      const result = await this.request("/food/favorites", {
        method: "POST",
        body: foodData,
      });
      return result.data;
    } catch (error) {
      console.error("Add to favorites error:", error);
      throw error;
    }
  }

  // Favorilerden çıkar
  async removeFromFavorites(foodId) {
    try {
      const result = await this.request(`/food/favorites/${foodId}`, {
        method: "DELETE",
      });
      return result;
    } catch (error) {
      console.error("Remove from favorites error:", error);
      throw error;
    }
  }

  // Custom foods al
  async getCustomFoods() {
    try {
      const result = await this.request("/food/custom");
      return result.data;
    } catch (error) {
      console.error("Get custom foods error:", error);
      return [];
    }
  }

  // Custom food ekle
  async addCustomFood(foodData) {
    try {
      const result = await this.request("/food/custom", {
        method: "POST",
        body: foodData,
      });
      return result.data;
    } catch (error) {
      console.error("Add custom food error:", error);
      throw error;
    }
  }

  // Custom food sil
  async deleteCustomFood(foodId) {
    try {
      const result = await this.request(`/food/custom/${foodId}`, {
        method: "DELETE",
      });
      return result;
    } catch (error) {
      console.error("Delete custom food error:", error);
      throw error;
    }
  }

  // ====== RECENT FOODS API'S - DATABASE ENTEGRASYONU ======

  // Recent foods al - DATABASE'DEN
  async getRecentFoods() {
    try {
      console.log("Fetching recent foods from database...");
      const result = await this.request("/food/recent");
      console.log("Recent foods fetched successfully:", result.data);
      return result.data || [];
    } catch (error) {
      console.error("Get recent foods error:", error);
      return [];
    }
  }

  // Recent foods'a ekle - DATABASE'E KAYDET
  async addToRecentFoods(foodData) {
    try {
      console.log("Adding food to recent foods database:", foodData);

      const result = await this.request("/food/recent", {
        method: "POST",
        body: {
          foodId: foodData.id || foodData.foodId,
          foodName: foodData.name || foodData.foodName,
          caloriesPer100g: foodData.calories || foodData.caloriesPer100g || 0,
          proteinPer100g: foodData.protein || foodData.proteinPer100g || 0,
          carbsPer100g: foodData.carbs || foodData.carbsPer100g || 0,
          fatPer100g: foodData.fat || foodData.fatPer100g || 0,
          isCustomFood: foodData.isCustomFood || false,
        },
      });

      console.log("Food added to recent foods successfully:", result.data);
      return result.data;
    } catch (error) {
      console.error("Add to recent foods error:", error);
      // Hata olsa bile devam et - recent foods kritik değil
      return null;
    }
  }

  // Recent foods'u temizle - DATABASE'DEN GÜVENLİ OLARAK
  async clearRecentFoods() {
    try {
      console.log("Clearing recent foods from database (safe version)");

      const result = await this.request("/food/recent", {
        method: "DELETE",
      });

      console.log("Backend recent foods cleared successfully:", result);
      return result;
    } catch (error) {
      console.error("Error clearing recent foods from database:", error);

      return {
        success: false,
        message: "Failed to clear recent foods from database",
        error: error.message,
        backendCleared: false,
      };
    }
  }

  // Belirli recent food'u sil - DATABASE'DEN
  async removeFromRecentFoods(foodId) {
    try {
      console.log("Removing food from recent foods database:", foodId);

      const result = await this.request(`/food/recent/${foodId}`, {
        method: "DELETE",
      });

      console.log("Food removed from recent foods successfully:", result);
      return result;
    } catch (error) {
      console.error("Remove from recent foods error:", error);
      throw error;
    }
  }

  // ====== ACTIVITY API'S - ENHANCED ======

  // Aktivite ekleme - ENHANCED
  async addActivity(activityData) {
    try {
      console.log("Adding activity with data:", activityData);

      // Veri validasyonu
      if (
        !activityData.activityName ||
        !activityData.durationMinutes ||
        !activityData.caloriesBurned
      ) {
        throw new Error(
          "Missing required activity fields: activityName, durationMinutes, caloriesBurned"
        );
      }

      // Backend'in beklediği format
      const backendData = {
        activityName: String(activityData.activityName).trim(),
        activityId: activityData.activityId || `activity_${Date.now()}`,
        durationMinutes: parseInt(activityData.durationMinutes) || 30,
        caloriesBurned: parseFloat(activityData.caloriesBurned) || 0,
        intensity: activityData.intensity?.toLowerCase() || "moderate",
        date: this.formatDate(activityData.date || new Date()),
      };

      console.log("Formatted activity data for backend:", backendData);

      const result = await this.request("/nutrition/activity", {
        method: "POST",
        body: backendData,
      });
      return result.data;
    } catch (error) {
      console.error("Add activity error:", error);
      throw error;
    }
  }

  // Aktivite güncelleme - NEW
  async updateActivity(activityId, updateData) {
    try {
      console.log("Updating activity:", activityId, updateData);

      const backendData = {
        activityName: updateData.activityName || updateData.name,
        durationMinutes: parseInt(
          updateData.durationMinutes || updateData.duration
        ),
        caloriesBurned: parseFloat(
          updateData.caloriesBurned || updateData.calories
        ),
        intensity: (updateData.intensity || "moderate").toLowerCase(),
      };

      const result = await this.request(`/nutrition/activity/${activityId}`, {
        method: "PUT",
        body: backendData,
      });
      return result.data;
    } catch (error) {
      console.error("Update activity error:", error);
      throw error;
    }
  }

  // Aktivite silme - NEW
  async deleteActivity(activityId) {
    try {
      console.log("Deleting activity:", activityId);
      const result = await this.request(`/nutrition/activity/${activityId}`, {
        method: "DELETE",
      });
      return result;
    } catch (error) {
      console.error("Delete activity error:", error);
      throw error;
    }
  }

  // Günlük aktivite kayıtlarını al (belirli tarih için) - NEW
  async getDailyActivities(date) {
    try {
      const formattedDate = this.formatDate(date);
      console.log("Getting daily activities for date:", formattedDate);

      const result = await this.request(`/activity-logs?date=${formattedDate}`);
      return result.data;
    } catch (error) {
      console.error("Get daily activities error:", error);
      return [];
    }
  }

  // Favori aktiviteleri al
  async getFavoriteActivities() {
    try {
      const result = await this.request("/activity/favorites");
      return result.data;
    } catch (error) {
      console.error("Get favorite activities error:", error);
      return [];
    }
  }

  // Aktiviteyi favorilere ekle
  async addActivityToFavorites(activityData) {
    try {
      const result = await this.request("/activity/favorites", {
        method: "POST",
        body: activityData,
      });
      return result.data;
    } catch (error) {
      console.error("Add activity to favorites error:", error);
      throw error;
    }
  }

  // Favorilerden aktivite çıkar
  async removeActivityFromFavorites(activityId) {
    try {
      const result = await this.request(`/activity/favorites/${activityId}`, {
        method: "DELETE",
      });
      return result;
    } catch (error) {
      console.error("Remove activity from favorites error:", error);
      throw error;
    }
  }

  // Custom activities al
  async getCustomActivities() {
    try {
      const result = await this.request("/activity/custom");
      return result.data;
    } catch (error) {
      console.error("Get custom activities error:", error);
      return [];
    }
  }

  // Custom activity ekle
  async addCustomActivity(activityData) {
    try {
      const result = await this.request("/activity/custom", {
        method: "POST",
        body: activityData,
      });
      return result.data;
    } catch (error) {
      console.error("Add custom activity error:", error);
      throw error;
    }
  }

  // Custom activity güncelle - NEW
  async updateCustomActivity(activityId, updateData) {
    try {
      const result = await this.request(`/activity/custom/${activityId}`, {
        method: "PUT",
        body: updateData,
      });
      return result.data;
    } catch (error) {
      console.error("Update custom activity error:", error);
      throw error;
    }
  }

  // Custom activity sil - NEW
  async deleteCustomActivity(activityId) {
    try {
      const result = await this.request(`/activity/custom/${activityId}`, {
        method: "DELETE",
      });
      return result;
    } catch (error) {
      console.error("Delete custom activity error:", error);
      throw error;
    }
  }

  // Aktivite arama - NEW
  async searchActivities(query, category = "all", limit = 20) {
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        category,
        limit: limit.toString(),
      });

      const result = await this.request(`/activity/search?${params}`);
      return result.data;
    } catch (error) {
      console.error("Search activities error:", error);
      return { custom: [], favorites: [], sample: [] };
    }
  }

  // Yakın zamanda kullanılan aktiviteleri al - NEW
  async getRecentActivities(limit = 10) {
    try {
      const result = await this.request(`/activity/recent?limit=${limit}`);
      return result.data;
    } catch (error) {
      console.error("Get recent activities error:", error);
      return [];
    }
  }

  // Aktivite istatistiklerini al - NEW
  async getActivityStats(period = 30) {
    try {
      const result = await this.request(`/activity/stats?period=${period}`);
      return result.data;
    } catch (error) {
      console.error("Get activity stats error:", error);
      return null;
    }
  }

  // Aktivite kategorilerini al - NEW
  async getActivityCategories() {
    try {
      const result = await this.request("/activity/categories");
      return result.data;
    } catch (error) {
      console.error("Get activity categories error:", error);
      return [];
    }
  }

  // Haftalık/aylık aktivite özeti al - NEW
  async getActivitySummary(startDate, endDate, period = "week") {
    try {
      const params = new URLSearchParams({
        period,
        ...(startDate && { startDate: this.formatDate(startDate) }),
        ...(endDate && { endDate: this.formatDate(endDate) }),
      });

      const result = await this.request(`/activity-logs/summary?${params}`);
      return result.data;
    } catch (error) {
      console.error("Get activity summary error:", error);
      return null;
    }
  }

  // ====== WATER TRACKING API'S ======

  // Su tüketimi ekleme
  async addWater(amount, date) {
    try {
      const result = await this.request("/nutrition/water", {
        method: "POST",
        body: {
          amount,
          date: this.formatDate(date),
        },
      });
      return result.data;
    } catch (error) {
      console.error("Add water error:", error);
      throw error;
    }
  }

  // Su kayıtlarını al
  async getWaterLogs(date) {
    try {
      const formattedDate = this.formatDate(date);
      const result = await this.request(
        `/tracker/water/daily/${formattedDate}`
      );
      return result.data;
    } catch (error) {
      console.error("Get water logs error:", error);
      return { logs: [], summary: { totalConsumed: 0, dailyGoal: 2500 } };
    }
  }

  // ====== SETTINGS API'S ======

  // Kullanıcı ayarlarını al
  async getUserSettings() {
    try {
      const result = await this.request("/settings");
      return result.data;
    } catch (error) {
      console.error("Get user settings error:", error);
      return null;
    }
  }

  // Kalori hedefini güncelle
  async updateCalorieGoal(calories) {
    try {
      const result = await this.request("/settings/calorie", {
        method: "PUT",
        body: {
          calorie_intake_goal: calories,
        },
      });
      return result.data;
    } catch (error) {
      console.error("Update calorie goal error:", error);
      throw error;
    }
  }

  // ====== HISTORY & INSIGHTS API'S ======

  // Beslenme geçmişini al
  async getNutritionHistory(period = "7", endDate) {
    try {
      const params = new URLSearchParams({
        period: period.toString(),
        ...(endDate && { endDate: this.formatDate(endDate) }),
      });

      const result = await this.request(`/nutrition/history?${params}`);
      return result.data;
    } catch (error) {
      console.error("Get nutrition history error:", error);
      return [];
    }
  }

  // ====== HELPER METHODS ======

  // Tarih formatı helper'ı (YYYY-MM-DD)
  formatDate(date) {
    if (!date) {
      date = new Date();
    }

    if (typeof date === "string") {
      // Eğer zaten doğru formattaysa döndür
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      date = new Date(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // Backend verisini frontend formatına çevir
  transformBackendFood(backendFood) {
    return {
      id: backendFood.id?.toString() || Date.now().toString(),
      name: backendFood.food_name || "Unknown Food",
      calories: Math.round(backendFood.total_calories || 0),
      carbs: Math.round((backendFood.total_carbs || 0) * 10) / 10,
      protein: Math.round((backendFood.total_protein || 0) * 10) / 10,
      fat: Math.round((backendFood.total_fat || 0) * 10) / 10,
      weight: backendFood.serving_size || 100,
      portionSize: backendFood.serving_size || 100,
      portionUnit: "gram (g)",
      mealType: this.capitalizeMealType(backendFood.meal_type),
    };
  }

  // Backend recent food verisini frontend formatına çevir - NEW
  transformBackendRecentFood(backendFood) {
    return {
      id:
        backendFood.food_id ||
        backendFood.id?.toString() ||
        Date.now().toString(),
      name: backendFood.food_name || "Unknown Food",
      calories: Math.round(backendFood.calories_per_100g || 0),
      protein: Math.round((backendFood.protein_per_100g || 0) * 10) / 10,
      carbs: Math.round((backendFood.carbs_per_100g || 0) * 10) / 10,
      fat: Math.round((backendFood.fat_per_100g || 0) * 10) / 10,
      isCustomFood: backendFood.is_custom_food || false,
      lastAccessed: backendFood.last_accessed,
      createdAt: backendFood.created_at,
    };
  }

  // Backend aktivite verisini frontend formatına çevir - ENHANCED
  transformBackendActivity(backendActivity) {
    return {
      id: backendActivity.id?.toString() || Date.now().toString(),
      name: backendActivity.activity_name || "Unknown Activity",
      calories: Math.round(backendActivity.calories_burned || 0),
      duration: backendActivity.duration_minutes || 30,
      mins: backendActivity.duration_minutes || 30, // ActivityContext için
      type: backendActivity.category || "Cardio",
      intensity: this.capitalizeFirst(backendActivity.intensity || "moderate"),
      addedAt: backendActivity.created_at || new Date().toISOString(),
      backendId: backendActivity.id,
      isCustomActivity: backendActivity.is_custom_activity || false,
    };
  }

  // Backend favorite activity verisini frontend formatına çevir - NEW
  transformBackendFavoriteActivity(backendFavorite) {
    return {
      id: backendFavorite.activity_id?.toString() || Date.now().toString(),
      name: backendFavorite.activity_name || "Unknown Activity",
      calories: Math.round((backendFavorite.calories_per_minute || 0) * 30), // 30 dakika için
      mins: 30, // Default duration
      duration: 30,
      type: "Cardio",
      intensity: "Moderate",
      isCustomActivity: backendFavorite.is_custom_activity || false,
      addedAt: backendFavorite.created_at || new Date().toISOString(),
      backendId: backendFavorite.id,
    };
  }

  // Backend custom activity verisini frontend formatına çevir - NEW
  transformBackendCustomActivity(backendCustom) {
    return {
      id: backendCustom.id?.toString() || Date.now().toString(),
      name: backendCustom.activity_name || "Unknown Activity",
      calories: Math.round((backendCustom.calories_per_minute || 0) * 30), // 30 dakika için
      mins: 30, // Default duration
      duration: 30,
      type: backendCustom.category || "Custom",
      intensity: "Moderate",
      description: backendCustom.description || "",
      isPersonal: true,
      isCustomActivity: true,
      addedAt: backendCustom.created_at || new Date().toISOString(),
      backendId: backendCustom.id,
    };
  }

  // Meal type'ı capitalize et
  capitalizeMealType(mealType) {
    if (!mealType) return "Dinner";
    return mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase();
  }

  // String'in ilk harfini büyük yap - NEW
  capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Frontend food verisini backend formatına çevir
  formatFoodForBackend(food, mealType, date) {
    return {
      mealType: mealType.toLowerCase(),
      foodName: food.name,
      foodId: food.id,
      caloriesPer100g: food.calories || 0,
      proteinPer100g: food.protein || 0,
      carbsPer100g: food.carbs || 0,
      fatPer100g: food.fat || 0,
      servingSize: food.portionSize || food.weight || 100,
      date: this.formatDate(date),
    };
  }

  // Frontend aktivite verisini backend formatına çevir - ENHANCED
  formatActivityForBackend(activity, date) {
    return {
      activityName: String(
        activity.name || activity.activityName || "Unknown Activity"
      ).trim(),
      activityId:
        activity.id || activity.activityId || `activity_${Date.now()}`,
      durationMinutes: parseInt(
        activity.duration || activity.durationMinutes || 30
      ),
      caloriesBurned: parseFloat(
        activity.calories || activity.caloriesBurned || 0
      ),
      intensity: String(activity.intensity || "moderate").toLowerCase(),
      date: this.formatDate(date),
      isCustomActivity: activity.isCustomActivity || false,
    };
  }

  // Favorite activity için backend format - NEW
  formatFavoriteActivityForBackend(activity) {
    return {
      activityId: activity.id || `activity_${Date.now()}`,
      activityName: activity.name || "Unknown Activity",
      caloriesPerMinute: (activity.calories || 0) / (activity.duration || 30),
      isCustomActivity: activity.isCustomActivity || false,
    };
  }

  // Custom activity için backend format - NEW
  formatCustomActivityForBackend(activity) {
    return {
      activityName: activity.name || "Unknown Activity",
      caloriesPerMinute: (activity.calories || 0) / (activity.duration || 30),
      category: activity.type || "Custom",
      description: activity.description || "",
    };
  }
}

// Singleton instance
const nutritionService = new NutritionService();
export default nutritionService;
