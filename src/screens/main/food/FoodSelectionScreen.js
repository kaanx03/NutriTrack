// src/screens/main/food/FoodSelectionScreen.js - FINAL CLEAN VERSION WITH ALL FIXES
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";
import usdaFoodApiService from "../../../services/UsdaFoodApiService";
import NutritionService from "../../../services/NutritionService";

// Popüler yemek önerileri
const popularFoodSuggestions = {
  breakfast: ["eggs", "cereal", "toast", "yogurt", "oatmeal"],
  lunch: ["sandwich", "salad", "soup", "wrap", "pizza"],
  dinner: ["chicken", "rice", "pasta", "fish", "beef"],
  snack: ["fruit", "nuts", "chips", "yogurt", "cheese"],
};

const FoodSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Context'ten tüm gerekli state ve fonksiyonları al
  const {
    addFood,
    favoriteFoods,
    recentFoods,
    personalFoods,
    mealFoods,
    updateFoodPortion,
    loadFavoriteFoods,
    loadPersonalFoods,
    loadRecentFoods,
    clearRecentFoods,
    refreshData,
  } = useMeals();

  // Get mealType from route params, default to "Dinner" if not provided
  const { mealType = "Dinner", activeTab = "Recent" } = route.params || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  const [showMealTypeMenu, setShowMealTypeMenu] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // API ile ilgili state'ler
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const searchTimeout = useRef(null);

  // Mevcut öğünde bulunan yemekleri tut
  const [existingMealFoods, setExistingMealFoods] = useState([]);

  // FoodDetailsScreen'den gelen porsiyon bilgisi
  const [selectedPortion, setSelectedPortion] = useState(null);

  // Quick Log state variables
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [quickLogName, setQuickLogName] = useState("");
  const [quickLogCalories, setQuickLogCalories] = useState("");
  const [quickLogMealType, setQuickLogMealType] = useState(mealType);

  // Backend loading states
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Mevcut öğündeki yiyecekleri al
  useEffect(() => {
    const currentMealFoods = mealFoods[mealType] || [];
    setExistingMealFoods(currentMealFoods);
  }, [mealFoods, mealType]);

  // Close keyboard and menu when tapping outside
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showMealTypeMenu) {
        Keyboard.dismiss();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [showMealTypeMenu]);

  // Recent foods'u temizleme fonksiyonu
  const handleClearRecent = async () => {
    Alert.alert(
      "Clear Recent Foods",
      "Are you sure you want to clear all recent foods?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Frontend'te hemen sıfırla (kullanıcı deneyimi için)
              setFoodItems([]);

              // Backend'den recent foods'u temizle (background'da)
              try {
                await NutritionService.clearRecentFoods();
              } catch (backendError) {
                // Non-critical error
              }

              // Context üzerinden recent foods'u temizle
              try {
                await clearRecentFoods();
              } catch (contextError) {
                // Non-critical error
              }
            } catch (error) {
              // Hata durumunda eski veriyi geri yükle
              loadFoods(true);
              Alert.alert(
                "Error",
                "Failed to clear recent foods. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Backend'den yemekleri yükle
  const loadFoods = async (refresh = false) => {
    if (isLoading || (!hasMoreItems && !refresh)) return;

    try {
      setIsLoading(true);

      // Reset page if refreshing
      const page = refresh ? 0 : currentPage;
      let results = [];

      // Eğer arama yapılıyorsa
      if (isSearching && searchQuery.length > 0) {
        results = await usdaFoodApiService.searchFoods(
          searchQuery,
          20,
          page + 1
        );
      }
      // Arama yapılmıyorsa, sekme ve öğün tipine göre yükle
      else {
        switch (localActiveTab) {
          case "Recent":
            setIsLoadingRecent(true);
            try {
              // Backend'den recent foods'u al
              const backendRecentFoods =
                await NutritionService.getRecentFoods();

              // Context'teki recent foods ile birleştir
              const contextRecentFoods = recentFoods || [];

              // Her iki kaynaktan unique foods oluştur
              const allRecentFoods = [...contextRecentFoods];

              backendRecentFoods.forEach((backendFood) => {
                // Boş veya geçersiz kayıtları filtrele
                if (
                  !backendFood.food_name ||
                  !backendFood.food_id ||
                  backendFood.food_name.trim() === "" ||
                  backendFood.food_id.trim() === "" ||
                  backendFood.calories_per_100g === null ||
                  backendFood.calories_per_100g === undefined ||
                  isNaN(parseFloat(backendFood.calories_per_100g))
                ) {
                  return;
                }

                const exists = allRecentFoods.find(
                  (food) =>
                    food.id === backendFood.food_id ||
                    food.name === backendFood.food_name
                );

                if (!exists) {
                  // Backend food'u frontend formatına çevir
                  const transformedFood = {
                    id: backendFood.food_id,
                    name: backendFood.food_name.trim(),
                    calories: Math.round(
                      parseFloat(backendFood.calories_per_100g) || 0
                    ),
                    protein:
                      Math.round(
                        (parseFloat(backendFood.protein_per_100g) || 0) * 10
                      ) / 10,
                    carbs:
                      Math.round(
                        (parseFloat(backendFood.carbs_per_100g) || 0) * 10
                      ) / 10,
                    fat:
                      Math.round(
                        (parseFloat(backendFood.fat_per_100g) || 0) * 10
                      ) / 10,
                    weight: 100,
                    portionSize: 100,
                    portionUnit: "gram (g)",
                    isCustomFood: backendFood.is_custom_food || false,
                  };

                  // Final validation before adding
                  if (
                    transformedFood.name &&
                    transformedFood.name.length > 0 &&
                    transformedFood.calories >= 0
                  ) {
                    allRecentFoods.push(transformedFood);
                  }
                }
              });

              // Boş kayıtları filtrele
              results = allRecentFoods
                .filter(
                  (food) =>
                    food.name &&
                    food.name.trim() !== "" &&
                    food.name.length > 1 &&
                    food.id &&
                    food.id.toString().trim() !== "" &&
                    food.calories !== null &&
                    food.calories !== undefined &&
                    food.calories >= 0 &&
                    !isNaN(food.calories)
                )
                .slice(0, 20);
            } catch (error) {
              // Fallback to context data
              results = recentFoods.slice(0, 20);
            } finally {
              setIsLoadingRecent(false);
            }
            break;

          case "Favorites":
            setIsLoadingFavorites(true);
            try {
              // Backend'den favorites'ları yükle
              await loadFavoriteFoods();
              results = favoriteFoods.slice(0, 20);
            } catch (error) {
              results = favoriteFoods.slice(0, 20);
            } finally {
              setIsLoadingFavorites(false);
            }
            break;

          case "Personal":
            setIsLoadingPersonal(true);
            try {
              // Backend'den custom foods'u yükle
              await loadPersonalFoods();
              results = personalFoods.slice(0, 20);
            } catch (error) {
              results = personalFoods.slice(0, 20);
            } finally {
              setIsLoadingPersonal(false);
            }
            break;

          default:
            results = [];
        }
      }

      // Sonuçları state'e ekle
      if (refresh) {
        setFoodItems(results);
      } else {
        setFoodItems((prev) => [...prev, ...results]);
      }

      // Sayfalama durumunu güncelle
      setCurrentPage(page + 1);
      setHasMoreItems(results.length === 20);
    } catch (error) {
      Alert.alert(
        "Loading Error",
        "Failed to load foods. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Tab veya öğün tipi değiştiğinde yemekleri yükle
  useEffect(() => {
    loadFoods(true);
  }, [localActiveTab, mealType]);

  // Context verileri değiştiğinde ilgili tab'ı yenile - ENHANCED VERSION
  useEffect(() => {
    if (localActiveTab === "Favorites") {
      // Favorites'ları frontend formatına çevir
      const formattedFavorites = favoriteFoods.map((favorite) => ({
        id: favorite.food_id || favorite.id,
        name: favorite.food_name || favorite.name,
        calories: Math.round(
          favorite.calories_per_100g || favorite.calories || 0
        ),
        protein:
          Math.round(
            (favorite.protein_per_100g || favorite.protein || 0) * 10
          ) / 10,
        carbs:
          Math.round((favorite.carbs_per_100g || favorite.carbs || 0) * 10) /
          10,
        fat: Math.round((favorite.fat_per_100g || favorite.fat || 0) * 10) / 10,
        weight: 100,
        portionSize: 100,
        portionUnit: "gram (g)",
        isCustomFood: favorite.is_custom_food || favorite.isCustomFood || false,
      }));

      setFoodItems(formattedFavorites);
    }
  }, [favoriteFoods, localActiveTab]);

  // Personal foods için de aynı mantık
  useEffect(() => {
    if (localActiveTab === "Personal") {
      setFoodItems(personalFoods.slice(0, 20));
    }
  }, [personalFoods, localActiveTab]);

  // Recent foods için de aynı mantık
  useEffect(() => {
    if (localActiveTab === "Recent") {
      setFoodItems(recentFoods.slice(0, 20));
    }
  }, [recentFoods, localActiveTab]);

  // Seçilen porsiyon için orijinal yemeği bulma fonksiyonu
  const findOriginalFood = (foodId) => {
    // Tüm yemek kaynaklarında ara
    const allFoodSources = [
      ...foodItems,
      ...recentFoods,
      ...favoriteFoods,
      ...personalFoods,
    ];

    return allFoodSources.find((food) => food.id === foodId);
  };

  // Total calories hesaplama fonksiyonu
  const calculateTotalCalories = (foods) => {
    const total = foods.reduce((sum, food) => {
      const calories = parseFloat(food.calories) || 0;
      return sum + calories;
    }, 0);
    return Math.round(total);
  };

  // Reset selections when screen comes into focus and handle FoodDetailsScreen'den gelen yemekler
  useFocusEffect(
    useCallback(() => {
      setLocalActiveTab(route.params?.activeTab || "Recent");

      // FoodDetailsScreen'den gelen porsiyon bilgisi varsa
      if (route.params?.selectedPortion) {
        const portionInfo = route.params.selectedPortion;
        const isExistingFood = route.params?.isExistingFood;
        const existingFoodId = route.params?.existingFoodId;

        // Eğer yemek zaten öğünde varsa ve FoodDetails'den güncellenmiş halde geliyorsa
        if (isExistingFood && existingFoodId) {
          // Bu durumda FoodDetailsScreen'de zaten güncellendi, ana sayfaya dön
          navigation.navigate("Home");
          return;
        }

        setSelectedPortion(portionInfo);

        // Orijinal yemeği bul
        const originalFood = findOriginalFood(portionInfo.foodId);

        if (originalFood) {
          // Yemeği özelleştirilmiş porsiyon bilgisiyle seç
          const portionedFood = {
            ...originalFood,
            calories: Math.round(
              portionInfo.calculatedCalories ||
                portionInfo.baseCalories ||
                originalFood.calories
            ),
            portionSize: portionInfo.portionSize,
            portionUnit: portionInfo.portionUnit,
            carbs:
              Math.round((portionInfo.carbs || originalFood.carbs || 0) * 10) /
              10,
            protein:
              Math.round(
                (portionInfo.protein || originalFood.protein || 0) * 10
              ) / 10,
            fat:
              Math.round((portionInfo.fat || originalFood.fat || 0) * 10) / 10,
          };

          setSelectedFoods([portionedFood]);
          setTotalCalories(calculateTotalCalories([portionedFood]));
        }

        // Parametre temizliği
        navigation.setParams({
          selectedPortion: null,
          isExistingFood: false,
          existingFoodId: null,
        });
      } else {
        // FoodDetailsScreen'den veri gelmezse, seçili yemekleri kontrol et
        if (selectedFoods.length === 0) {
          setTotalCalories(0);
        } else {
          // Mevcut seçili yemeklerin kalorisini yeniden hesapla
          setTotalCalories(calculateTotalCalories(selectedFoods));
        }
      }

      setSearchQuery("");
      setIsSearching(false);

      // Route params'ta refreshPersonal varsa personal foods'u yenile
      if (route.params?.refreshPersonal) {
        if (localActiveTab === "Personal") {
          loadFoods(true);
        }
        // Parametre temizle
        navigation.setParams({ refreshPersonal: false });
      }

      return () => {};
    }, [
      route.params?.activeTab,
      route.params?.selectedPortion,
      route.params?.isExistingFood,
      route.params?.refreshPersonal,
      selectedFoods,
    ])
  );

  // Handle Quick Log button press
  const handleQuickLogPress = () => {
    setQuickLogMealType(mealType);
    setShowQuickLogModal(true);
  };

  // Handle Quick Log submission with backend integration
  const handleQuickLogSubmit = async () => {
    // Validate inputs
    if (!quickLogName.trim() || !quickLogCalories.trim()) {
      Alert.alert(
        "Validation Error",
        "Please fill in both food name and calories."
      );
      return;
    }

    // Parse calories
    const calories = parseFloat(quickLogCalories);
    if (isNaN(calories) || calories <= 0) {
      Alert.alert("Invalid Calories", "Please enter a valid calorie amount.");
      return;
    }

    try {
      setIsLoading(true);

      // Create new food object for backend
      const quickLogFood = {
        name: quickLogName.trim(),
        calories: Math.round(calories), // Round to whole number
        carbs: Math.round((calories * 0.5) / 4), // 50% carbs assumption
        protein: Math.round((calories * 0.25) / 4), // 25% protein assumption
        fat: Math.round((calories * 0.25) / 9), // 25% fat assumption
        mealType: quickLogMealType,
        portionSize: 100,
        portionUnit: "gram (g)",
        weight: 100,
      };

      // Add food using context function (which handles backend integration)
      await addFood(quickLogFood);

      // Reset form and close modal
      setQuickLogName("");
      setQuickLogCalories("");
      setShowQuickLogModal(false);

      // Show success message
      Alert.alert("Success", "Food logged successfully!", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to log food. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Food button handler
  const handleCreateFoodPress = () => {
    navigation.navigate("CreateFood");
  };

  // Arama yapıldığında durumu güncelle
  const handleSearch = (text) => {
    setSearchQuery(text);

    // Text boş değilse veya minimum karakter sayısını geçtiyse, arama yap
    setIsSearching(text.length >= 2);

    // Arama yapıldığında sayfalama bilgilerini sıfırla
    setCurrentPage(0);
    setHasMoreItems(true);

    // Çok fazla API çağrısı olmaması için arama sorgusu debounce edilir
    if (text.length >= 2) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        loadFoods(true);
      }, 500);
    } else if (text.length === 0) {
      // Arama kutusu boşalınca, mevcut tab'ın verilerini göster
      setIsSearching(false);
      loadFoods(true);
    }
  };

  // Liste sonuna gelindiğinde daha fazla yemek yükle
  const handleEndReached = () => {
    if (!isLoading && hasMoreItems && isSearching) {
      loadFoods();
    }
  };

  // Yenile fonksiyonu
  const handleRefresh = async () => {
    try {
      // Genel refresh
      await refreshData();

      // Mevcut tab'a göre spesifik refresh
      switch (localActiveTab) {
        case "Recent":
          await loadRecentFoods();
          break;
        case "Favorites":
          await loadFavoriteFoods();
          break;
        case "Personal":
          await loadPersonalFoods();
          break;
      }

      // Foods'u yeniden yükle
      await loadFoods(true);
    } catch (error) {
      Alert.alert("Refresh Error", "Failed to refresh data. Please try again.");
    }
  };

  // Yemek zaten öğünde var mı kontrol et
  const isFoodAlreadyInMeal = (foodId) => {
    const exists = existingMealFoods.some((food) => food.id === foodId);
    return exists;
  };

  // Toggle food selection (add/remove from selected foods)
  const toggleFoodSelection = (food) => {
    // Yemek zaten öğünde varsa, seçmeyi engelle
    if (isFoodAlreadyInMeal(food.id)) {
      return;
    }

    // Check if food is already selected
    const foodIndex = selectedFoods.findIndex((item) => item.id === food.id);

    if (foodIndex >= 0) {
      // Food is already selected, so remove it
      const newSelectedFoods = selectedFoods.filter(
        (item) => item.id !== food.id
      );
      setSelectedFoods(newSelectedFoods);

      // Update total calories
      const newTotalCalories = calculateTotalCalories(newSelectedFoods);
      setTotalCalories(newTotalCalories);
      setSelectedPortion(null);
    } else {
      // Food is not selected, so add it
      const foodWithCorrectCalories = {
        ...food,
        calories: Math.round(parseFloat(food.calories) || 0), // Ensure calories is a number
      };

      const newSelectedFoods = [...selectedFoods, foodWithCorrectCalories];
      setSelectedFoods(newSelectedFoods);

      // Update total calories
      const newTotalCalories = calculateTotalCalories(newSelectedFoods);
      setTotalCalories(newTotalCalories);

      // Tek bir yemek seçildiyse porsiyon bilgisini seç
      if (newSelectedFoods.length === 1) {
        setSelectedPortion({
          foodId: food.id,
          portionSize: food.weight || food.portionSize || 100,
          portionUnit: food.portionUnit || "gram (g)",
          calculatedCalories: foodWithCorrectCalories.calories,
          baseCalories: foodWithCorrectCalories.calories,
          baseWeight: food.weight || 100,
        });
      }
    }
  };

  // Handle changing meal type
  const handleChangeMealType = (newMealType) => {
    navigation.setParams({ mealType: newMealType });
    setShowMealTypeMenu(false);

    // Öğün tipi değiştiğinde mevcut öğündeki yemekleri güncelle
    const currentMealFoods = mealFoods[newMealType] || [];
    setExistingMealFoods(currentMealFoods);

    // Seçimleri temizle
    setSelectedFoods([]);
    setTotalCalories(0);
  };

  // Handle add button press with backend integration
  const handleAddButtonPress = async () => {
    if (selectedFoods.length === 0) return;

    try {
      setIsLoading(true);

      // Seçilen tüm yemekleri ayrı ayrı ekle
      for (const food of selectedFoods) {
        const portionSize = food.portionSize || food.weight || 100;
        const portionUnit = food.portionUnit || "gram (g)";

        // Kalori ve makro değerleri doğru hesapla
        const foodCalories = Math.round(parseFloat(food.calories) || 0);
        const foodCarbs =
          Math.round(
            (parseFloat(food.carbs) || Math.round((foodCalories * 0.5) / 4)) *
              10
          ) / 10;
        const foodProtein =
          Math.round(
            (parseFloat(food.protein) ||
              Math.round((foodCalories * 0.25) / 4)) * 10
          ) / 10;
        const foodFat =
          Math.round(
            (parseFloat(food.fat) || Math.round((foodCalories * 0.25) / 9)) * 10
          ) / 10;

        const foodToAdd = {
          ...food,
          mealType,
          calories: foodCalories,
          carbs: foodCarbs,
          protein: foodProtein,
          fat: foodFat,
          portionSize: portionSize,
          portionUnit: portionUnit,
        };

        // Context üzerinden her bir yemeği ayrı ayrı ekle (backend entegrasyonu dahil)
        await addFood(foodToAdd);
      }

      // Success message
      Alert.alert(
        "Success",
        `${selectedFoods.length} food(s) added to ${mealType}!`,
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add foods to meal. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Porsiyon bilgisini formatla
  const formatPortion = (item) => {
    if (item.portionSize && item.portionUnit) {
      if (item.portionUnit === "gram (g)") {
        return `${item.portionSize} gr`;
      } else if (item.portionUnit === "tablespoon") {
        return `${item.portionSize} tbsp`;
      } else if (item.portionUnit === "teaspoon") {
        return `${item.portionSize} tsp`;
      } else if (item.portionUnit === "cup") {
        return `${item.portionSize} cup`;
      } else {
        return `${item.portionSize} ${item.portionUnit}`;
      }
    } else if (item.weight) {
      return `${item.weight} gr`;
    }
    return "100 gr";
  };

  const renderFoodItem = ({ item }) => {
    // Boş item kontrolü
    if (!item || !item.name || item.name.trim() === "" || !item.id) {
      return null; // Boş item'ı render etme
    }

    // Yemek zaten öğünde var mı kontrol et
    const isAlreadyInMeal = isFoodAlreadyInMeal(item.id);

    // Seçili mi kontrol et
    const isSelected =
      isAlreadyInMeal || selectedFoods.some((food) => food.id === item.id);
    const isPersonal = item.isPersonal === true || item.isCustomFood === true;

    // Yemeğin porsiyon bilgisi
    const portionText = formatPortion(item);

    // Kalori değerini doğru göster
    const displayCalories = Math.round(parseFloat(item.calories) || 0);

    return (
      <View style={styles.foodItem}>
        <View style={styles.foodItemLeft}>
          <TouchableOpacity
            style={[
              styles.addButton,
              isSelected && styles.selectedButton,
              isAlreadyInMeal && styles.alreadyInMealButton,
            ]}
            onPress={() => toggleFoodSelection(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isAlreadyInMeal}
          >
            {isSelected ? (
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="add" size={20} color="#A1CE50" />
            )}
          </TouchableOpacity>
          <View style={styles.foodItemInfo}>
            <Text style={styles.foodItemName}>
              {item.name}
              {isPersonal && (
                <Text style={styles.personalBadge}> (Custom)</Text>
              )}
              {isAlreadyInMeal && (
                <Text style={styles.alreadyAddedBadge}> (Already added)</Text>
              )}
            </Text>
            <Text style={styles.foodItemDetails}>
              {displayCalories} kcal, {portionText}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            // Yemek detay sayfasına yönlendir
            navigation.navigate("FoodDetails", {
              food: {
                ...item,
                mealType: mealType,
                calories: displayCalories, // Doğru kalori değerini gönder
              },
            });
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  // Boş liste komponenti
  const EmptyListComponent = () => {
    const tabSpecificLoading =
      (localActiveTab === "Recent" && isLoadingRecent) ||
      (localActiveTab === "Favorites" && isLoadingFavorites) ||
      (localActiveTab === "Personal" && isLoadingPersonal);

    if (tabSpecificLoading) {
      return (
        <View style={styles.emptyListContainer}>
          <ActivityIndicator size="large" color="#A1CE50" />
          <Text style={styles.loadingText}>
            Loading {localActiveTab.toLowerCase()} foods...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyListContainer}>
        {isSearching ? (
          <View>
            <Text style={styles.emptyListText}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={styles.suggestionsTitle}>Try searching for:</Text>
            <View style={styles.suggestionsContainer}>
              {popularFoodSuggestions[mealType.toLowerCase()]?.map(
                (suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => {
                      setSearchQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyListText}>
              {localActiveTab === "Recent"
                ? "Your recent foods will appear here."
                : localActiveTab === "Favorites"
                ? "Your favorite foods will appear here."
                : "Your custom foods will appear here."}
            </Text>
            {localActiveTab === "Personal" && (
              <TouchableOpacity
                style={styles.createFoodPromptButton}
                onPress={handleCreateFoodPress}
              >
                <Text style={styles.createFoodPromptText}>
                  Create Your First Food
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setShowMealTypeMenu(false);
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealTypeSelector}
              onPress={() => setShowMealTypeMenu(!showMealTypeMenu)}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              disabled={isLoading}
            >
              <Text style={styles.mealTypeText}>{mealType}</Text>
              <Ionicons
                name={showMealTypeMenu ? "chevron-up" : "chevron-down"}
                size={18}
                color="#000"
              />
            </TouchableOpacity>

            <View style={styles.spacer} />
          </View>

          {/* Meal Type Dropdown Menu */}
          {showMealTypeMenu && (
            <View style={styles.mealTypeMenu}>
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mealTypeMenuItem,
                    type === mealType && styles.mealTypeMenuItemActive,
                  ]}
                  onPress={() => handleChangeMealType(type)}
                >
                  <Text
                    style={[
                      styles.mealTypeMenuItemText,
                      type === mealType && styles.mealTypeMenuItemTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              value={searchQuery}
              onChangeText={handleSearch}
              editable={!isLoading}
            />

            <TouchableOpacity style={styles.scanButton} disabled={isLoading}>
              <Ionicons name="scan-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Quick Log and Create Food Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={handleQuickLogPress}
              disabled={isLoading}
            >
              <Ionicons name="flash" size={18} color="#333" />
              <Text style={styles.quickLogText}>Quick Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createFoodButton}
              onPress={handleCreateFoodPress}
              disabled={isLoading}
            >
              <Ionicons name="add-circle-outline" size={18} color="#333" />
              <Text style={styles.createFoodText}>Create Food</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs with Clear for Recent */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Recent" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Recent")}
              disabled={isLoading}
            >
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    localActiveTab === "Recent" && styles.activeTabText,
                  ]}
                >
                  Recent
                </Text>
                {/* Clear text - sadece Recent tab aktifken ve yemek varsa */}
                {localActiveTab === "Recent" && recentFoods.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClearRecent}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[
                        styles.clearText,
                        localActiveTab === "Recent" && styles.clearTextActive,
                      ]}
                    >
                      {" • Clear"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Favorites" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Favorites")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Favorites" && styles.activeTabText,
                ]}
              >
                Favorites
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Personal" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Personal")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Personal" && styles.activeTabText,
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Food List */}
          <FlatList
            style={styles.foodList}
            data={foodItems}
            renderItem={renderFoodItem}
            keyExtractor={(item, index) =>
              item.id ? `${item.id}_${index}` : `item_${index}`
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.foodListContent,
              foodItems.length === 0 && styles.emptyListContentContainer,
            ]}
            ListEmptyComponent={EmptyListComponent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshing={isLoading && foodItems.length === 0}
            onRefresh={handleRefresh}
            ListFooterComponent={
              isLoading && foodItems.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#A1CE50" />
                  <Text style={styles.loadingText}>Loading more...</Text>
                </View>
              ) : null
            }
            extraData={[selectedFoods, selectedPortion, existingMealFoods]}
          />

          {/* Selected Foods Summary & Add Button */}
          {selectedFoods.length > 0 && (
            <View style={styles.selectedFoodsSummary}>
              <View style={styles.caloriesCounter}>
                <Text style={styles.totalCalories}>{totalCalories}</Text>
                <Text style={styles.kcalLabel}> kcal</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.addSelectedButton,
                  isLoading && styles.addSelectedButtonDisabled,
                ]}
                onPress={handleAddButtonPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addSelectedButtonText}>
                    {selectedFoods.length === 1
                      ? "Add"
                      : `Add (+${selectedFoods.length})`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Log Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showQuickLogModal}
            onRequestClose={() => setShowQuickLogModal(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowQuickLogModal(false)}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Quick Log</Text>

                    {/* Food Name Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Food Name"
                      value={quickLogName}
                      onChangeText={setQuickLogName}
                      editable={!isLoading}
                    />

                    {/* Calories Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Calories"
                      keyboardType="numeric"
                      value={quickLogCalories}
                      onChangeText={setQuickLogCalories}
                      editable={!isLoading}
                    />

                    {/* Meal Type Selector */}
                    <Text style={styles.mealSelectorLabel}>Meal</Text>
                    <View style={styles.mealTypeSelectorContainer}>
                      {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.mealTypeOption,
                            quickLogMealType === type &&
                              styles.mealTypeOptionActive,
                          ]}
                          onPress={() => setQuickLogMealType(type)}
                          disabled={isLoading}
                        >
                          <Text
                            style={[
                              styles.mealTypeOptionText,
                              quickLogMealType === type &&
                                styles.mealTypeOptionTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Buttons */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowQuickLogModal(false)}
                        disabled={isLoading}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          isLoading && styles.saveButtonDisabled,
                        ]}
                        onPress={handleQuickLogSubmit}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  mealTypeSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    height: 48,
  },
  mealTypeText: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  spacer: {
    width: 48,
  },
  mealTypeMenu: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  mealTypeMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mealTypeMenuItemActive: {
    backgroundColor: "#f5f5f5",
  },
  mealTypeMenuItemText: {
    fontSize: 16,
    color: "#333",
  },
  mealTypeMenuItemTextActive: {
    fontWeight: "600",
    color: "#A1CE50",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#333",
  },
  scanButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
  },
  quickLogButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  createFoodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
  },
  createFoodText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  createFoodPromptButton: {
    marginTop: 16,
    backgroundColor: "#A1CE50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  createFoodPromptText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#A1CE50",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "500",
  },
  clearText: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "400",
    opacity: 0.8,
  },
  clearTextActive: {
    color: "#fff",
    opacity: 0.7,
  },
  foodList: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  foodListContent: {
    padding: 16,
    paddingBottom: 90,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#A1CE50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  selectedButton: {
    backgroundColor: "#A1CE50",
    borderColor: "#A1CE50",
  },
  alreadyInMealButton: {
    backgroundColor: "#cccccc",
    borderColor: "#cccccc",
    opacity: 0.7,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  personalBadge: {
    fontSize: 12,
    color: "#A1CE50",
    fontWeight: "normal",
  },
  alreadyAddedBadge: {
    fontSize: 12,
    color: "#999",
    fontWeight: "normal",
    fontStyle: "italic",
  },
  foodItemDetails: {
    fontSize: 12,
    color: "#999",
  },
  detailsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedFoodsSummary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  caloriesCounter: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  kcalLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  totalCalories: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  addSelectedButton: {
    backgroundColor: "#A1CE50",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  addSelectedButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  addSelectedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
  },
  emptyListText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyListContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingFooter: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 8,
  },
  suggestionButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  suggestionText: {
    color: "#333",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  mealSelectorLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  mealTypeSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mealTypeOption: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    marginBottom: 10,
  },
  mealTypeOptionActive: {
    backgroundColor: "#A1CE50",
  },
  mealTypeOptionText: {
    fontSize: 14,
    color: "#666",
  },
  mealTypeOptionTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#A1CE50",
    width: "48%",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default FoodSelectionScreen;
