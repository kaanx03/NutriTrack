// src/services/UsdaFoodApiService.js - FIXED VERSION FOR DATA CONSISTENCY
import AsyncStorage from "@react-native-async-storage/async-storage";

// USDA FoodData Central API
const API_KEY = "us3UM2r2ieNXFzuDq7UDSEcuzi7mKnKNEb3IgEoK";
const API_URL = "https://api.nal.usda.gov/fdc/v1";

// Cache expiry time (24 hours in milliseconds)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

class UsdaFoodApiService {
  // Search foods by query
  async searchFoods(query, pageSize = 20, pageNumber = 1) {
    try {
      // Arama sorgusunu hazırla
      let cleanedQuery = query.trim();

      // Boş sorgu kontrolü
      if (!cleanedQuery) {
        return [];
      }

      // API'nin daha iyi sonuç vermesi için sorguyu iyileştir
      if (cleanedQuery.length > 30) {
        cleanedQuery = cleanedQuery.substring(0, 30);
      }

      cleanedQuery = cleanedQuery.replace(/\s+/g, " ");

      // Check cache first
      const cacheKey = `usda_search_${cleanedQuery}_${pageSize}_${pageNumber}`;
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        console.log(
          `Using cache for "${cleanedQuery}": ${cachedData.length} results`
        );
        return cachedData;
      }

      // Deneme 1: Doğrudan sorgu
      let foods = await this.fetchFromApi(cleanedQuery, pageSize, pageNumber);

      // Sonuç yoksa, Deneme 2: Sorguyu farklı şekilde yap
      if (foods.length === 0 && cleanedQuery.includes(" ")) {
        console.log(
          `No results for "${cleanedQuery}", trying alternative query`
        );
        const mainKeyword = cleanedQuery.split(" ").pop();
        foods = await this.fetchFromApi(mainKeyword, pageSize, pageNumber);
      }

      // Hala sonuç yoksa, Deneme 3: Sorguyu başka bir şekilde dene
      if (foods.length === 0) {
        console.log(`Still no results, trying broader query`);
        const firstWord = cleanedQuery.split(" ")[0];
        foods = await this.fetchFromApi(firstWord, pageSize, pageNumber);
      }

      // Sonuçları cache'e kaydet (sonuç varsa)
      if (foods.length > 0) {
        await this.saveToCache(cacheKey, foods);
      }

      return foods;
    } catch (error) {
      console.error("Error searching foods:", error.message);
      return [];
    }
  }

  // API çağrı metodu
  async fetchFromApi(query, pageSize, pageNumber) {
    try {
      const url = `${API_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&pageSize=${pageSize}&pageNumber=${pageNumber}`;

      console.log(`Searching API for: "${query}"`);

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`API error (${response.status}) for query "${query}"`);
        return [];
      }

      const data = await response.json();

      if (!data.foods || data.foods.length === 0) {
        console.log(`API returned no foods for "${query}"`);
        return [];
      }

      console.log(`API found ${data.foods.length} results for "${query}"`);
      return this.transformSearchResults(data);
    } catch (error) {
      console.error(`API fetch error for "${query}": ${error.message}`);
      return [];
    }
  }

  // Get food details by ID
  async getFoodDetails(fdcId) {
    try {
      // Check cache first
      const cacheKey = `usda_food_${fdcId}`;
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) return cachedData;

      // If not in cache, make API call
      const url = `${API_URL}/food/${fdcId}?api_key=${API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();

      // Transform data to our app format
      const foodDetails = this.transformFoodDetails(data);

      // Save to cache
      await this.saveToCache(cacheKey, foodDetails);

      return foodDetails;
    } catch (error) {
      console.error("Error getting food details:", error);
      return null;
    }
  }

  // Get foods by meal type
  async getFoodsByMealType(mealType, pageSize = 20, pageNumber = 1) {
    try {
      let searchTerm;
      switch (mealType.toLowerCase()) {
        case "breakfast":
          searchTerm = "breakfast cereal eggs yogurt";
          break;
        case "lunch":
          searchTerm = "lunch sandwich salad soup";
          break;
        case "dinner":
          searchTerm = "dinner chicken rice pasta";
          break;
        case "snack":
          searchTerm = "snack fruit nuts yogurt";
          break;
        default:
          searchTerm = mealType;
      }

      const cleanSearchTerm = searchTerm.substring(0, 50);

      return this.searchFoods(cleanSearchTerm, pageSize, pageNumber);
    } catch (error) {
      console.error(`Error getting foods for meal type ${mealType}:`, error);
      return [];
    }
  }

  // FIXED - Transform search results to ensure data consistency
  transformSearchResults(apiData) {
    if (!apiData.foods || !Array.isArray(apiData.foods)) {
      return [];
    }

    const usedIds = new Set();

    return apiData.foods
      .map((food, index) => {
        try {
          // STANDARDIZED NUTRITION CALCULATION
          // Always calculate per 100g to maintain consistency
          const nutritionPer100g = this.calculateNutritionPer100g(food);

          // Ensure minimum values (some foods have 0 calories which is unrealistic)
          const calories = Math.max(nutritionPer100g.calories, 1);
          const protein = Math.max(nutritionPer100g.protein, 0);
          const carbs = Math.max(nutritionPer100g.carbs, 0);
          const fat = Math.max(nutritionPer100g.fat, 0);

          // STANDARDIZED SERVING SIZE - Always use 100g as base
          const baseServingSize = 100;
          const baseUnit = "gram (g)";

          // Generate unique ID
          let uniqueId = food.fdcId
            ? food.fdcId.toString()
            : `food_${Date.now()}_${index}`;

          if (usedIds.has(uniqueId)) {
            uniqueId = `${uniqueId}_${index}`;
          }
          usedIds.add(uniqueId);

          // Store ORIGINAL API data for consistency checking
          const result = {
            id: uniqueId,
            fdcId: food.fdcId, // Keep original FDC ID for reference
            name: food.description || "Unknown Food",

            // STANDARDIZED VALUES (always per 100g)
            calories: Math.round(calories),
            protein: Math.round(protein * 10) / 10,
            carbs: Math.round(carbs * 10) / 10,
            fat: Math.round(fat * 10) / 10,

            // CONSISTENT SERVING INFO
            weight: baseServingSize,
            portionSize: baseServingSize,
            portionUnit: baseUnit,

            // METADATA
            mealType: this.inferMealType(food.description || ""),
            source: "USDA",

            // STORE ORIGINAL DATA for reference/debugging
            _originalData: {
              fdcId: food.fdcId,
              description: food.description,
              servingSize: food.servingSize,
              servingSizeUnit: food.servingSizeUnit,
              nutrients: food.foodNutrients
                ? food.foodNutrients.slice(0, 10)
                : [], // Store first 10 nutrients for debugging
            },
          };

          console.log(
            `Transformed food: ${result.name} - ${result.calories} kcal per ${result.weight}g`
          );

          return result;
        } catch (error) {
          console.error(`Error transforming food at index ${index}:`, error);
          return null;
        }
      })
      .filter((food) => food !== null); // Remove failed transformations
  }

  // NEW - Calculate nutrition per 100g consistently
  calculateNutritionPer100g(food) {
    try {
      // Get raw nutrient values from USDA data
      const rawCalories = this.findNutrientValue(food.foodNutrients, "Energy");
      const rawProtein = this.findNutrientValue(food.foodNutrients, "Protein");
      const rawCarbs = this.findNutrientValue(
        food.foodNutrients,
        "Carbohydrate, by difference"
      );
      const rawFat = this.findNutrientValue(
        food.foodNutrients,
        "Total lipid (fat)"
      );

      // USDA API typically returns values per 100g, but let's verify
      // If serving size is different than 100g, we need to adjust
      const servingSize = food.servingSize || 100;
      const adjustmentFactor = 100 / servingSize;

      // Calculate per 100g values
      let caloriesPer100g = rawCalories * adjustmentFactor;
      let proteinPer100g = rawProtein * adjustmentFactor;
      let carbsPer100g = rawCarbs * adjustmentFactor;
      let fatPer100g = rawFat * adjustmentFactor;

      // Validation: Ensure values are reasonable
      if (caloriesPer100g <= 0 || caloriesPer100g > 900) {
        // If calories seem wrong, estimate from macros
        caloriesPer100g =
          proteinPer100g * 4 + carbsPer100g * 4 + fatPer100g * 9;
      }

      // Final validation and defaults
      caloriesPer100g = Math.max(caloriesPer100g, 1); // Minimum 1 calorie
      proteinPer100g = Math.max(proteinPer100g, 0);
      carbsPer100g = Math.max(carbsPer100g, 0);
      fatPer100g = Math.max(fatPer100g, 0);

      // If still unreasonable, use food type-based estimates
      if (caloriesPer100g > 900 || isNaN(caloriesPer100g)) {
        const estimatedNutrition = this.estimateNutritionByFoodType(
          food.description || ""
        );
        caloriesPer100g = estimatedNutrition.calories;
        proteinPer100g = estimatedNutrition.protein;
        carbsPer100g = estimatedNutrition.carbs;
        fatPer100g = estimatedNutrition.fat;
      }

      return {
        calories: caloriesPer100g,
        protein: proteinPer100g,
        carbs: carbsPer100g,
        fat: fatPer100g,
      };
    } catch (error) {
      console.error("Error calculating nutrition per 100g:", error);
      // Return default values
      return {
        calories: 150,
        protein: 5,
        carbs: 20,
        fat: 5,
      };
    }
  }

  // NEW - Estimate nutrition based on food type when API data is unreliable
  estimateNutritionByFoodType(description) {
    const lowerDesc = description.toLowerCase();

    // Meat and protein foods
    if (
      lowerDesc.includes("chicken") ||
      lowerDesc.includes("beef") ||
      lowerDesc.includes("fish") ||
      lowerDesc.includes("egg")
    ) {
      return { calories: 200, protein: 25, carbs: 2, fat: 10 };
    }

    // Dairy
    if (
      lowerDesc.includes("cheese") ||
      lowerDesc.includes("milk") ||
      lowerDesc.includes("yogurt")
    ) {
      return { calories: 150, protein: 10, carbs: 8, fat: 8 };
    }

    // Grains and starches
    if (
      lowerDesc.includes("bread") ||
      lowerDesc.includes("rice") ||
      lowerDesc.includes("pasta") ||
      lowerDesc.includes("cereal")
    ) {
      return { calories: 250, protein: 8, carbs: 50, fat: 2 };
    }

    // Fruits
    if (
      lowerDesc.includes("fruit") ||
      lowerDesc.includes("apple") ||
      lowerDesc.includes("banana") ||
      lowerDesc.includes("orange")
    ) {
      return { calories: 60, protein: 1, carbs: 15, fat: 0.2 };
    }

    // Vegetables
    if (
      lowerDesc.includes("vegetable") ||
      lowerDesc.includes("carrot") ||
      lowerDesc.includes("broccoli") ||
      lowerDesc.includes("spinach")
    ) {
      return { calories: 25, protein: 2, carbs: 5, fat: 0.2 };
    }

    // Nuts and seeds
    if (
      lowerDesc.includes("nuts") ||
      lowerDesc.includes("seeds") ||
      lowerDesc.includes("almond")
    ) {
      return { calories: 600, protein: 20, carbs: 10, fat: 50 };
    }

    // Default for unknown foods
    return { calories: 150, protein: 5, carbs: 20, fat: 5 };
  }

  // FIXED - Transform food details to match search results format
  transformFoodDetails(food) {
    if (!food) {
      return null;
    }

    try {
      // Use the same calculation method as search results
      const nutritionPer100g = this.calculateNutritionPer100g(food);

      const calories = Math.max(nutritionPer100g.calories, 1);
      const protein = Math.max(nutritionPer100g.protein, 0);
      const carbs = Math.max(nutritionPer100g.carbs, 0);
      const fat = Math.max(nutritionPer100g.fat, 0);

      // CONSISTENT with search results - always 100g base
      const baseServingSize = 100;
      const baseUnit = "gram (g)";

      const uniqueId = food.fdcId
        ? food.fdcId.toString()
        : `food_detail_${Date.now()}`;

      const result = {
        id: uniqueId,
        fdcId: food.fdcId,
        name: food.description || "Unknown Food",

        // SAME VALUES as in search results
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,

        // CONSISTENT SERVING INFO
        weight: baseServingSize,
        portionSize: baseServingSize,
        portionUnit: baseUnit,

        mealType: this.inferMealType(food.description || ""),
        source: "USDA",

        // Additional details for food details screen
        cholesterol:
          this.findNutrientValue(food.foodNutrients, "Cholesterol") || 0,
        sodium: this.findNutrientValue(food.foodNutrients, "Sodium, Na") || 0,
        calcium: this.findNutrientValue(food.foodNutrients, "Calcium, Ca") || 0,
        iron: this.findNutrientValue(food.foodNutrients, "Iron, Fe") || 0,

        _originalData: {
          fdcId: food.fdcId,
          description: food.description,
          nutrients: food.foodNutrients ? food.foodNutrients.slice(0, 15) : [],
        },
      };

      console.log(
        `Food details: ${result.name} - ${result.calories} kcal per ${result.weight}g (CONSISTENT)`
      );

      return result;
    } catch (error) {
      console.error("Error transforming food details:", error);
      return null;
    }
  }

  // IMPROVED - Helper method to find nutrient value
  findNutrientValue(foodNutrients, nutrientName) {
    if (!foodNutrients || !Array.isArray(foodNutrients)) {
      return 0;
    }

    // USDA API nutrient ID mapping (more comprehensive)
    const NUTRIENT_IDS = {
      Energy: [1008, 2047, 2048, 208], // kcal
      Protein: [1003, 203],
      "Carbohydrate, by difference": [1005, 205],
      "Total lipid (fat)": [1004, 204],
      Cholesterol: [1253, 601],
      "Sodium, Na": [1093, 307],
      "Calcium, Ca": [1087, 301],
      "Iron, Fe": [1089, 303],
    };

    const nutrientIds = NUTRIENT_IDS[nutrientName] || [];

    // Try to find by ID first
    let nutrient = foodNutrients.find((n) => {
      const nutrientId = n.nutrientId || (n.nutrient && n.nutrient.id);
      return nutrientId && nutrientIds.includes(parseInt(nutrientId));
    });

    if (nutrient) {
      const value =
        nutrient.value ||
        nutrient.amount ||
        (nutrient.nutrient && nutrient.nutrient.value) ||
        0;
      return parseFloat(value) || 0;
    }

    // Try to find by name as fallback
    nutrient = foodNutrients.find((n) => {
      const name =
        n.nutrientName || (n.nutrient && n.nutrient.name) || n.name || "";
      return name.toLowerCase().includes(nutrientName.toLowerCase());
    });

    if (nutrient) {
      const value = nutrient.value || nutrient.amount || 0;
      return parseFloat(value) || 0;
    }

    return 0;
  }

  // Try to infer meal type from food description
  inferMealType(description) {
    const lowerDesc = description.toLowerCase();

    if (
      lowerDesc.includes("breakfast") ||
      lowerDesc.includes("cereal") ||
      lowerDesc.includes("yogurt") ||
      lowerDesc.includes("eggs") ||
      lowerDesc.includes("toast") ||
      lowerDesc.includes("pancake") ||
      lowerDesc.includes("coffee") ||
      lowerDesc.includes("juice")
    ) {
      return "Breakfast";
    }

    if (
      lowerDesc.includes("lunch") ||
      lowerDesc.includes("sandwich") ||
      lowerDesc.includes("soup") ||
      lowerDesc.includes("salad")
    ) {
      return "Lunch";
    }

    if (
      lowerDesc.includes("dinner") ||
      lowerDesc.includes("rice") ||
      lowerDesc.includes("pasta") ||
      lowerDesc.includes("chicken") ||
      lowerDesc.includes("beef") ||
      lowerDesc.includes("fish") ||
      lowerDesc.includes("pork")
    ) {
      return "Dinner";
    }

    if (
      lowerDesc.includes("snack") ||
      lowerDesc.includes("chips") ||
      lowerDesc.includes("nuts") ||
      lowerDesc.includes("fruit") ||
      lowerDesc.includes("cookie") ||
      lowerDesc.includes("candy") ||
      lowerDesc.includes("chocolate")
    ) {
      return "Snack";
    }

    return "Dinner";
  }

  // Cache methods
  async saveToCache(key, data) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }

  async getFromCache(key) {
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      if (cachedItem) {
        const { data, timestamp } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
        await AsyncStorage.removeItem(key);
      }
      return null;
    } catch (error) {
      console.error("Error getting from cache:", error);
      return null;
    }
  }
}

// Create a singleton instance
const usdaFoodApiService = new UsdaFoodApiService();
export default usdaFoodApiService;
