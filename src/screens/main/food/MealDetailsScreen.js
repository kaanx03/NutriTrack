// src/screens/main/food/MealDetailsScreen.js - FIXED DELETE FUNCTION
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";

const MealDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType } = route.params;

  // Context'ten state ve fonksiyonları alın
  const { mealFoods, deleteFood, refreshData, currentDate } = useMeals();

  const [totalCalories, setTotalCalories] = useState(0);
  const [totalNutrients, setTotalNutrients] = useState({
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFoodId, setDeletingFoodId] = useState(null); // Hangi yemek silinirken loading göstermek için

  // Meal data'yı güncelleyen ana fonksiyon
  const updateMealData = useCallback(() => {
    console.log("Updating meal data for:", mealType);

    // Context'ten ilgili öğün yemeklerini al
    const currentFoods = mealFoods[mealType] || [];
    setFoods(currentFoods);

    // Toplam kaloriyi ve besin değerlerini hesapla
    const totals = currentFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        carbs: acc.carbs + (food.carbs || 0),
        protein: acc.protein + (food.protein || 0),
        fat: acc.fat + (food.fat || 0),
      }),
      { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );

    setTotalCalories(Math.round(totals.calories));
    setTotalNutrients({
      carbs: Math.round(totals.carbs * 10) / 10,
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    });

    console.log(`Meal ${mealType} totals:`, totals);
  }, [mealFoods, mealType]);

  // İlk yükleme ve context değişiklikleri
  useEffect(() => {
    updateMealData();
  }, [updateMealData]);

  // Ekran focus olduğunda verileri yenile
  useFocusEffect(
    useCallback(() => {
      console.log("MealDetailsScreen focused, refreshing data");
      handleRefresh();
    }, [mealType, currentDate])
  );

  // Refresh handler with backend sync
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log("Refreshing meal details data");

      // Backend'den güncel verileri al
      await refreshData();

      // Local state'i güncelle
      updateMealData();

      console.log("Meal details data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing meal details:", error);
      Alert.alert(
        "Refresh Error",
        "Failed to refresh meal data. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Handle delete food with enhanced backend integration - FIXED VERSION
  const handleDeleteFood = (foodItem) => {
    const foodId = foodItem.id || foodItem.backendId;
    const foodName = foodItem.name || "Unknown Food";

    console.log("Delete food called with:", {
      foodId,
      foodName,
      mealType,
      backendId: foodItem.backendId,
      fullItem: foodItem,
    });

    Alert.alert(
      "Delete Food",
      `Are you sure you want to delete "${foodName}" from ${mealType}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setDeletingFoodId(foodId); // Loading state için
              console.log("=== STARTING FOOD DELETE PROCESS ===");
              console.log("Deleting food:", {
                id: foodId,
                name: foodName,
                mealType: mealType,
                backendId: foodItem.backendId,
              });

              // Context'teki deleteFood fonksiyonunu çağır (backend entegrasyonu dahil)
              await deleteFood(foodId, mealType);

              console.log("=== FOOD DELETE COMPLETED SUCCESSFULLY ===");

              // Success feedback
              Alert.alert(
                "Deleted",
                `"${foodName}" has been removed from ${mealType}.`,
                [{ text: "OK" }]
              );

              // Local state güncellenmesi context tarafından otomatik yapılacak
              // Ekstra güvenlik için de manuel güncelleme yapalım
              setTimeout(() => {
                updateMealData();
              }, 500);
            } catch (error) {
              console.error("=== FOOD DELETE ERROR ===", error);
              Alert.alert(
                "Delete Error",
                `Failed to delete "${foodName}". Please check your connection and try again.`,
                [{ text: "OK" }]
              );
            } finally {
              setDeletingFoodId(null); // Loading state'i kaldır
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  // Handle add food
  const handleAddFood = () => {
    console.log("Adding food to meal:", mealType);
    // Navigate to FoodSelectionScreen with current meal type
    navigation.navigate("FoodSelection", {
      mealType: mealType,
      currentDate: currentDate.toISOString(),
    });
  };

  // Handle edit food (navigate to details)
  const handleEditFood = (food) => {
    console.log("Editing food:", food.name);
    navigation.navigate("FoodDetails", {
      food: {
        ...food,
        mealType: mealType,
      },
    });
  };

  // Yemek öğeleri için yardımcı fonksiyon: Emoji/ikon seçimi
  const getFoodIcon = (food) => {
    // Eğer food'ta icon varsa onu kullan
    if (food.icon) {
      return food.icon;
    }

    const name = (food.name || "").toLowerCase();

    // Yaygın yemekler için emoji/icon belirle
    if (name.includes("egg") || name.includes("yumurta")) return "🥚";
    if (name.includes("bread") || name.includes("ekmek")) return "🍞";
    if (name.includes("cheese") || name.includes("peynir")) return "🧀";
    if (name.includes("milk") || name.includes("süt")) return "🥛";
    if (name.includes("chicken") || name.includes("tavuk")) return "🍗";
    if (name.includes("fish") || name.includes("balık")) return "🐟";
    if (name.includes("meat") || name.includes("et")) return "🥩";
    if (name.includes("salad") || name.includes("salata")) return "🥗";
    if (name.includes("fruit") || name.includes("meyve")) return "🍎";
    if (name.includes("vegetable") || name.includes("sebze")) return "🥦";
    if (name.includes("rice") || name.includes("pilav")) return "🍚";
    if (name.includes("pasta") || name.includes("makarna")) return "🍝";
    if (name.includes("soup") || name.includes("çorba")) return "🍲";
    if (name.includes("breakfast") || name.includes("kahvaltı")) return "🍳";
    if (name.includes("lunch") || name.includes("öğle")) return "🍱";
    if (name.includes("dinner") || name.includes("akşam")) return "🍽️";
    if (name.includes("snack") || name.includes("atıştırma")) return "🍿";
    if (name.includes("dessert") || name.includes("tatlı")) return "🍰";
    if (name.includes("coffee") || name.includes("kahve")) return "☕";
    if (name.includes("tea") || name.includes("çay")) return "🍵";

    // Varsayılan: Generic food icon
    return "🍽️";
  };

  // Format portion info
  const formatPortionInfo = (food) => {
    const portions = [];

    if (food.portionSize && food.portionUnit) {
      if (food.portionUnit === "gram (g)") {
        portions.push(`${food.portionSize}g`);
      } else {
        portions.push(`${food.portionSize} ${food.portionUnit}`);
      }
    } else if (food.weight) {
      portions.push(`${food.weight}g`);
    }

    return portions.join(", ");
  };

  // Format nutritional info
  const formatNutritionalInfo = (food) => {
    const info = [];

    if (food.carbs > 0) info.push(`${food.carbs}g carb`);
    if (food.protein > 0) info.push(`${food.protein}g protein`);
    if (food.fat > 0) info.push(`${food.fat}g fat`);

    return info.length > 0 ? info.join(" • ") : "";
  };

  const renderFoodItem = ({ item }) => {
    const iconContent = getFoodIcon(item);
    const portionInfo = formatPortionInfo(item);
    const nutritionalInfo = formatNutritionalInfo(item);
    const isDeleting = deletingFoodId === item.id;

    return (
      <View style={styles.foodItem}>
        <TouchableOpacity
          style={styles.foodItemLeft}
          onPress={() => handleEditFood(item)}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          <View style={styles.foodIcon}>
            <Text style={styles.foodIconEmoji}>{iconContent}</Text>
          </View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>
              {item.name}
              {(item.isPersonal || item.isCustomFood) && (
                <Text style={styles.customBadge}> (Custom)</Text>
              )}
            </Text>
            <Text style={styles.foodDetails}>
              {item.calories} kcal
              {portionInfo && ` • ${portionInfo}`}
            </Text>
            {nutritionalInfo && (
              <Text style={styles.nutritionalDetails}>{nutritionalInfo}</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.foodItemRight}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditFood(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
          >
            <Ionicons name="create-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onPress={() => handleDeleteFood(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff4d4f" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="restaurant-outline" size={48} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No foods added yet</Text>
      <Text style={styles.emptyText}>
        Tap the "Add" button below to add foods to your {mealType.toLowerCase()}
      </Text>
      <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddFood}>
        <Text style={styles.emptyAddButtonText}>Add Food</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mealType}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Ionicons name="refresh-outline" size={24} color="#666" />
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Meal Summary</Text>
          <Text style={styles.summaryDate}>
            {currentDate.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.summaryContent}>
          {/* Total Calories */}
          <View style={styles.summaryMainItem}>
            <Text style={styles.summaryLabel}>Total Calories</Text>
            <Text style={styles.summaryMainValue}>{totalCalories} kcal</Text>
          </View>

          {/* Macros */}
          <View style={styles.summaryMacros}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{totalNutrients.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{totalNutrients.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{totalNutrients.fat}g</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Foods List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Foods ({foods.length})</Text>

        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={(item) =>
            item.id?.toString() || `item_${Math.random()}`
          }
          contentContainerStyle={[
            styles.listContent,
            foods.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#A1CE50"]}
              tintColor="#A1CE50"
            />
          }
          showsVerticalScrollIndicator={false}
          extraData={deletingFoodId} // Re-render when deleting state changes
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddFood}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Food</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  refreshButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  summaryDate: {
    fontSize: 14,
    color: "#666",
  },
  summaryContent: {
    alignItems: "center",
  },
  summaryMainItem: {
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryMainValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#A1CE50",
  },
  summaryMacros: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  foodIconEmoji: {
    fontSize: 20,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  customBadge: {
    fontSize: 12,
    color: "#A1CE50",
    fontWeight: "normal",
  },
  foodDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  nutritionalDetails: {
    fontSize: 12,
    color: "#999",
  },
  foodItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: "#A1CE50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#A1CE50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default MealDetailsScreen;
