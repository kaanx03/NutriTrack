// src/screens/main/food/FoodSelectionScreen.js
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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";
import usdaFoodApiService from "../../../services/UsdaFoodApiService";

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

  // Mevcut öğündeki yiyecekleri al
  useEffect(() => {
    // Context'ten ilgili öğün yemeklerini al
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

  // API'den yemekleri yükle
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
            // Context'te son kullanılan yemekler varsa onları kullan
            if (recentFoods.length > 0) {
              results = recentFoods;
            }
            // Yoksa API'den öğün tipine göre yükle
            else {
              results = await usdaFoodApiService.getFoodsByMealType(
                mealType,
                20,
                page + 1
              );
            }
            break;
          case "Favorites":
            // Favori yemekleri context'ten al
            results = favoriteFoods;
            break;
          case "Personal":
            // Kişisel yemekleri context'ten al
            results = personalFoods;
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
      setHasMoreItems(results.length === 20); // Eğer istenen sayıdan az sonuç geldiyse, sona gelmişiz demektir
    } catch (error) {
      console.error("Yemekleri yüklerken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tab veya öğün tipi değiştiğinde yemekleri yükle
  useEffect(() => {
    loadFoods(true);
  }, [localActiveTab, mealType]);

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
          // Zaten var olan bir yemeğin porsiyon bilgisi güncellenmiş
          // Bu yemeği doğrudan context üzerinden güncelleyebiliriz
          updateFoodPortion(
            existingFoodId,
            route.params.mealType || "Breakfast",
            portionInfo.portionSize,
            portionInfo.portionUnit,
            portionInfo.calculatedCalories,
            portionInfo.carbs,
            portionInfo.protein,
            portionInfo.fat
          );

          // Doğrudan ana sayfaya dön
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
            calories: portionInfo.calculatedCalories,
            portionSize: portionInfo.portionSize,
            portionUnit: portionInfo.portionUnit,
            carbs: portionInfo.carbs,
            protein: portionInfo.protein,
            fat: portionInfo.fat,
            // Diğer değerler orijinal yemekten gelir
          };

          setSelectedFoods([portionedFood]);
          setTotalCalories(portionInfo.calculatedCalories);
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
        }
      }

      setSearchQuery("");
      setIsSearching(false);
      return () => {};
    }, [
      route.params?.activeTab,
      route.params?.selectedPortion,
      route.params?.isExistingFood,
    ])
  );

  // Handle Quick Log button press
  const handleQuickLogPress = () => {
    setQuickLogMealType(mealType); // Set default meal type to current
    setShowQuickLogModal(true);
  };

  // Handle Quick Log submission
  const handleQuickLogSubmit = () => {
    // Validate inputs
    if (!quickLogName.trim() || !quickLogCalories.trim()) {
      // Could add an alert here for better UX
      return;
    }

    // Parse calories
    const calories = parseInt(quickLogCalories, 10);
    if (isNaN(calories) || calories <= 0) {
      // Could add an alert here for invalid calories
      return;
    }

    // Create new food object
    const newFood = {
      id: Date.now().toString(),
      name: quickLogName,
      calories,
      mealType: quickLogMealType,
      // No macro values as specified in requirements
    };

    // Add food using context function
    addFood(newFood);

    // Reset form and close modal
    setQuickLogName("");
    setQuickLogCalories("");
    setShowQuickLogModal(false);

    // Navigate back to home
    navigation.navigate("Home");
  };

  // Create Food button handler
  const handleCreateFoodPress = () => {
    // Create Food sayfasına yönlendir
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
        console.log("Searching for:", text);
        loadFoods(true);
      }, 500);
    } else if (text.length === 0) {
      // Arama kutusu boşalınca, son görüntülenen yemekleri göster
      setIsSearching(false);
      setFoodItems(recentFoods);
    }
  };

  // Liste sonuna gelindiğinde daha fazla yemek yükle
  const handleEndReached = () => {
    if (!isLoading && hasMoreItems) {
      loadFoods();
    }
  };

  // Yenile fonksiyonu
  const handleRefresh = () => {
    loadFoods(true);
  };

  // Yemek zaten öğünde var mı kontrol et
  const isFoodAlreadyInMeal = (foodId) => {
    return existingMealFoods.some((food) => food.id === foodId);
  };

  // Toggle food selection (add/remove from selected foods) - Updated
  const toggleFoodSelection = (food) => {
    // Yemek zaten öğünde varsa, seçmeyi engelle
    if (isFoodAlreadyInMeal(food.id)) {
      return; // Yemek zaten öğünde olduğu için hiçbir şey yapma
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
      const newTotalCalories = newSelectedFoods.reduce(
        (total, item) => total + item.calories,
        0
      );
      setTotalCalories(newTotalCalories);
      setSelectedPortion(null); // Porsiyon seçimini temizle
    } else {
      // Food is not selected, so add it
      const newSelectedFoods = [...selectedFoods, food];
      setSelectedFoods(newSelectedFoods);

      // Update total calories
      const newTotalCalories = newSelectedFoods.reduce(
        (total, item) => total + item.calories,
        0
      );
      setTotalCalories(newTotalCalories);

      // Tek bir yemek seçildiyse ve son seçilen buysa, orijinal porsiyon bilgisini seç
      if (newSelectedFoods.length === 1) {
        setSelectedPortion({
          foodId: food.id,
          portionSize: food.weight,
          portionUnit: food.portionUnit || "gram (g)",
          calculatedCalories: food.calories,
          baseCalories: food.calories,
          baseWeight: food.weight,
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

    // Seçimleri temizle - öğünler arası geçişte seçimler sıfırlanır
    setSelectedFoods([]);
    setTotalCalories(0);
  };

  // Handle add button press
  const handleAddButtonPress = () => {
    if (selectedFoods.length === 0) return;

    // Seçilen tüm yemekleri ayrı ayrı ekle (birleştirmek yerine)
    selectedFoods.forEach((food) => {
      // Porsiyon büyüklüğü ve birimini kullan (varsa)
      const portionSize = food.portionSize || food.weight;
      const portionUnit = food.portionUnit || "gram (g)";

      const foodToAdd = {
        ...food,
        mealType,
        // Varsayılan makro değerleri (eğer yoksa)
        carbs: food.carbs || Math.round((food.calories * 0.5) / 4),
        protein: food.protein || Math.round((food.calories * 0.25) / 4),
        fat: food.fat || Math.round((food.calories * 0.25) / 9),
        // Porsiyon bilgilerini ekle
        portionSize: portionSize,
        portionUnit: portionUnit,
      };

      // Context üzerinden her bir yemeği ayrı ayrı ekle
      addFood(foodToAdd);
    });

    // Ana ekrana dön
    navigation.navigate("Home");
  };

  // Porsiyon bilgisini formatla
  const formatPortion = (item) => {
    if (item.portionSize && item.portionUnit) {
      // Porsiyon bilgisi varsa göster
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
      // Varsayılan ağırlık bilgisini göster
      return `${item.weight} gr`;
    }
    return "";
  };

  const renderFoodItem = ({ item }) => {
    // Yemek zaten öğünde var mı kontrol et
    const isAlreadyInMeal = isFoodAlreadyInMeal(item.id);

    // Seçili mi kontrol et - öğünde zaten varsa veya şu anda seçiliyse
    const isSelected =
      isAlreadyInMeal || selectedFoods.some((food) => food.id === item.id);
    const isPersonal = item.isPersonal === true;

    // Yemeğin porsiyon bilgisi
    const portionText = formatPortion(item);

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
            disabled={isAlreadyInMeal} // Öğünde varsa tıklanamaz yap
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
              {item.calories} kcal, {portionText}
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
                mealType: mealType, // Mevcut öğün tipini ekle
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
  const EmptyListComponent = () => (
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
        <Text style={styles.emptyListText}>
          {localActiveTab === "Recent"
            ? "Your recent foods will appear here."
            : localActiveTab === "Favorites"
            ? "Your favorite foods will appear here."
            : "Your custom foods will appear here. Tap 'Create Food' to add a new food item."}
        </Text>
      )}
    </View>
  );

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
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealTypeSelector}
              onPress={() => setShowMealTypeMenu(!showMealTypeMenu)}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
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
              placeholder="Search"
              value={searchQuery}
              onChangeText={handleSearch}
            />

            {/* Add scan button */}
            <TouchableOpacity style={styles.scanButton}>
              <Ionicons name="scan-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Quick Log and Create Food Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={handleQuickLogPress}
            >
              <Ionicons name="flash" size={18} color="#333" />
              <Text style={styles.quickLogText}>Quick Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createFoodButton}
              onPress={handleCreateFoodPress}
            >
              <Ionicons name="add-circle-outline" size={18} color="#333" />
              <Text style={styles.createFoodText}>Create Food</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Recent" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Recent")}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Recent" && styles.activeTabText,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Favorites" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Favorites")}
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
            refreshing={isLoading}
            onRefresh={handleRefresh}
            ListFooterComponent={
              isLoading && foodItems.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#A1CE50" />
                  <Text style={styles.loadingText}>Loading more...</Text>
                </View>
              ) : null
            }
            extraData={[selectedFoods, selectedPortion, existingMealFoods]} // Değişkenler eklendi
          />

          {/* Selected Foods Summary & Add Button - Only shows if foods are selected */}
          {selectedFoods.length > 0 && (
            <View style={styles.selectedFoodsSummary}>
              <View style={styles.caloriesCounter}>
                <Text style={styles.totalCalories}>{totalCalories}</Text>
                <Text style={styles.kcalLabel}> kcal</Text>
              </View>

              <TouchableOpacity
                style={styles.addSelectedButton}
                onPress={handleAddButtonPress}
              >
                <Text style={styles.addSelectedButtonText}>
                  {selectedFoods.length === 1
                    ? "Add"
                    : `Add(+${selectedFoods.length})`}
                </Text>
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
                    />

                    {/* Calories Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Calories"
                      keyboardType="numeric"
                      value={quickLogCalories}
                      onChangeText={setQuickLogCalories}
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
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleQuickLogSubmit}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
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
    paddingTop: 24, // Increased padding to move content down
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16, // Increased vertical padding
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginTop: 20, // Added margin to push header down
  },
  backButton: {
    width: 48, // Increased touchable area
    height: 48, // Increased touchable area
    justifyContent: "center",
    alignItems: "center",
  },
  mealTypeSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12, // Increased padding for better touchability
    height: 48, // Fixed height for better touchability
  },
  mealTypeText: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  spacer: {
    width: 48, // Match backButton width
  },
  mealTypeMenu: {
    position: "absolute",
    top: 110, // Adjusted position to appear below header
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
    paddingVertical: 14, // Increased for better touchability
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
  tabs: {
    flexDirection: "row",
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "500",
  },
  foodList: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  foodListContent: {
    padding: 16,
    paddingBottom: 90, // Extra padding at bottom for selected foods summary
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
  // Yeni: Öğünde zaten var olan yemekler için buton stili
  alreadyInMealButton: {
    backgroundColor: "#cccccc", // Gri arka plan
    borderColor: "#cccccc",
    opacity: 0.7, // Biraz şeffaf
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
  // Yeni: Öğünde zaten var olan yemekler için badge
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
  addSelectedButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // Boş liste ve arama önerileri stilleri
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
  tryAgainButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignSelf: "center",
  },
  tryAgainText: {
    color: "#666",
    fontSize: 14,
  },

  // Quick Log Modal Styles
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
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default FoodSelectionScreen;
