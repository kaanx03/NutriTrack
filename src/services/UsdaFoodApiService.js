// src/services/UsdaFoodApiService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// USDA FoodData Central API
const API_KEY = "us3UM2r2ieNXFzuDq7UDSEcuzi7mKnKNEb3IgEoK"; // API anahtarınız
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
      // Sorgu çok uzunsa kesme (API bazen uzun sorgularda iyi çalışmıyor)
      if (cleanedQuery.length > 30) {
        cleanedQuery = cleanedQuery.substring(0, 30);
      }

      // Sorgunun API'de daha iyi çalışması için hazırlık
      cleanedQuery = cleanedQuery.replace(/\s+/g, " "); // Fazla boşlukları tek boşlukla değiştir

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
        // Sorguyu tekil kelimeye indirgeme (örn. "ground beef" yerine sadece "beef")
        const mainKeyword = cleanedQuery.split(" ").pop();
        foods = await this.fetchFromApi(mainKeyword, pageSize, pageNumber);
      }

      // Hala sonuç yoksa, Deneme 3: Sorguyu başka bir şekilde dene
      if (foods.length === 0) {
        console.log(`Still no results, trying broader query`);
        // Sorguyu daha geniş yap (sadece ilk kelime)
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

  // Yeni API çağrı metodu
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

  // Get foods by meal type (using search terms associated with meal types)
  async getFoodsByMealType(mealType, pageSize = 20, pageNumber = 1) {
    try {
      // Define search terms for each meal type
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

      // Saflaştırılmış arama terimi
      const cleanSearchTerm = searchTerm.substring(0, 50); // Terimi kısaltabilirsiniz

      return this.searchFoods(cleanSearchTerm, pageSize, pageNumber);
    } catch (error) {
      console.error(`Error getting foods for meal type ${mealType}:`, error);
      return [];
    }
  }

  // Transform search results to our app format
  transformSearchResults(apiData) {
    if (!apiData.foods || !Array.isArray(apiData.foods)) {
      return [];
    }

    // Kullanılmış ID'leri takip etmek için bir set oluştur
    const usedIds = new Set();

    return apiData.foods.map((food, index) => {
      // Her yemek için besin değerlerini al
      let calories = this.findNutrientValue(food.foodNutrients, "Energy");
      let protein = this.findNutrientValue(food.foodNutrients, "Protein");
      let carbs = this.findNutrientValue(
        food.foodNutrients,
        "Carbohydrate, by difference"
      );
      let fat = this.findNutrientValue(food.foodNutrients, "Total lipid (fat)");

      // Eğer kalori 0 ise, API'den gelen diğer alanları dene
      if (calories <= 0 && food.foodMeasures && food.foodMeasures.length > 0) {
        const measure = food.foodMeasures[0];
        calories = measure.calories || 0;
      }

      // Eğer hala kalori 0 ise ve FDC puanı varsa (bazı USDA öğeleri bu şekilde gelir)
      if (calories <= 0 && food.fdcScore) {
        // Yaklaşık değer hesapla:
        // Protein: 4 kcal/g, Karbonhidrat: 4 kcal/g, Yağ: 9 kcal/g
        calories = protein * 4 + carbs * 4 + fat * 9;
      }

      // Minimum bir değer sağla
      calories = calories <= 0 ? 100 : calories; // 0 kalori olamaz, varsayılan değer koy
      protein = protein <= 0 ? (calories * 0.05) / 4 : protein; // %5 protein
      carbs = carbs <= 0 ? (calories * 0.6) / 4 : carbs; // %60 karbonhidrat
      fat = fat <= 0 ? (calories * 0.35) / 9 : fat; // %35 yağ

      // Determine serving size - standardize to grams where possible
      const servingSize = food.servingSize || 100;
      const servingUnit = food.servingSizeUnit || "g";

      // Benzersiz ID oluştur
      let uniqueId = food.fdcId ? food.fdcId.toString() : `food_${index}`;

      // ID çakışmalarını önle
      if (usedIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${index}`;
      }

      // ID'yi kullanılmış olarak işaretle
      usedIds.add(uniqueId);

      return {
        id: uniqueId,
        name: food.description,
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        weight: servingSize,
        portionSize: servingSize,
        portionUnit: servingUnit === "g" ? "gram (g)" : servingUnit,
        mealType: this.inferMealType(food.description),
      };
    });
  }

  // Transform food details to our app format
  transformFoodDetails(food) {
    if (!food) {
      return null;
    }

    // Find nutrient values with updated method
    let calories = this.findNutrientValue(food.foodNutrients, "Energy");
    let protein = this.findNutrientValue(food.foodNutrients, "Protein");
    let carbs = this.findNutrientValue(
      food.foodNutrients,
      "Carbohydrate, by difference"
    );
    let fat = this.findNutrientValue(food.foodNutrients, "Total lipid (fat)");

    // Fallback values if needed
    calories = calories <= 0 ? 100 : calories;
    protein = protein <= 0 ? (calories * 0.05) / 4 : protein;
    carbs = carbs <= 0 ? (calories * 0.6) / 4 : carbs;
    fat = fat <= 0 ? (calories * 0.35) / 9 : fat;

    // Determine serving size
    const servingSize = food.servingSize || 100;
    const servingUnit = food.servingSizeUnit || "g";

    // Benzersiz ID oluştur
    const uniqueId = food.fdcId
      ? food.fdcId.toString()
      : `food_detail_${Date.now()}`;

    return {
      id: uniqueId,
      name: food.description,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      weight: servingSize,
      portionSize: servingSize,
      portionUnit: servingUnit === "g" ? "gram (g)" : servingUnit,
      mealType: this.inferMealType(food.description),
    };
  }

  // Helper method to find nutrient value from foodNutrients array - UPDATED
  findNutrientValue(foodNutrients, nutrientName) {
    if (!foodNutrients || !Array.isArray(foodNutrients)) {
      return 0;
    }

    // USDA API'nin nutrient ID'lerini biliyoruz
    const NUTRIENT_IDS = {
      Energy: [1008, 2047, 2048, 208], // Kalori için birden fazla ID olabilir (kcal)
      Protein: [1003, 203],
      "Carbohydrate, by difference": [1005, 205],
      "Total lipid (fat)": [1004, 204],
    };

    // İlgili besin değerinin ID'lerini al
    const nutrientIds = NUTRIENT_IDS[nutrientName] || [];

    // ID'lere göre ara
    const nutrient = foodNutrients.find(
      (n) =>
        (n.nutrientId && nutrientIds.includes(parseInt(n.nutrientId))) ||
        (n.nutrient &&
          n.nutrient.id &&
          nutrientIds.includes(parseInt(n.nutrient.id)))
    );

    if (nutrient) {
      // Değeri birkaç olası yerden alabilir
      const value =
        nutrient.value ||
        nutrient.amount ||
        (nutrient.nutrient && nutrient.nutrient.value) ||
        0;

      return value;
    }

    // Alternatif: İsme göre ara (eğer ID ile bulunamazsa)
    const byName = foodNutrients.find(
      (n) =>
        (n.nutrientName && n.nutrientName.includes(nutrientName)) ||
        (n.nutrient &&
          n.nutrient.name &&
          n.nutrient.name.includes(nutrientName)) ||
        (n.name && n.name.includes(nutrientName))
    );

    if (byName) {
      return byName.value || byName.amount || 0;
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

    // Default to Dinner if we can't infer
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
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
        // Cache expired, remove it
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
