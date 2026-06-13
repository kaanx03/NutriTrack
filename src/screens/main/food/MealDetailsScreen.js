// src/screens/main/food/MealDetailsScreen.js - FIXED DELETE FUNCTION
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";
import NutritionService from "../../../services/NutritionService";
import { showToast } from "../../../components/AppToast";
import { COLORS } from "../../../theme";

const MealDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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

  // "Save as meal" modalı
  const [saveMealVisible, setSaveMealVisible] = useState(false);
  const [saveMealName, setSaveMealName] = useState("");
  const [savingMeal, setSavingMeal] = useState(false);

  const openSaveMealModal = () => {
    const shortDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    setSaveMealName(`${mealType} – ${shortDate}`);
    setSaveMealVisible(true);
  };

  const handleSaveMeal = async () => {
    if (!saveMealName.trim()) {
      showToast("Please enter a meal name", "error");
      return;
    }
    try {
      setSavingMeal(true);
      const items = foods.map((f) => ({
        name: f.name,
        calories: f.calories || 0,
        carbs: f.carbs || 0,
        protein: f.protein || 0,
        fat: f.fat || 0,
        portionSize: f.portionSize || f.weight || 100,
        portionUnit: f.portionUnit || "gram (g)",
        icon: f.icon,
      }));
      await NutritionService.saveMealTemplate({
        name: saveMealName.trim(),
        mealType,
        items,
      });
      setSaveMealVisible(false);
      showToast("Meal saved — find it in the Meals tab", "success");
    } catch (error) {
      showToast("Failed to save meal", "error");
    } finally {
      setSavingMeal(false);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFoodId, setDeletingFoodId] = useState(null); // Hangi yemek silinirken loading göstermek için

  // Meal data'yı güncelleyen ana fonksiyon
  const updateMealData = useCallback(() => {

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

  }, [mealFoods, mealType]);

  // İlk yükleme ve context değişiklikleri
  useEffect(() => {
    updateMealData();
  }, [updateMealData]);

  // Ekran focus olduğunda verileri yenile
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [mealType, currentDate])
  );

  // Refresh handler with backend sync
  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Backend'den güncel verileri al
      await refreshData();

      // Local state'i güncelle
      updateMealData();

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

              // Context'teki deleteFood fonksiyonunu çağır (backend entegrasyonu dahil)
              await deleteFood(foodId, mealType);


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
    // Navigate to FoodSelectionScreen with current meal type
    navigation.navigate("FoodSelection", {
      mealType: mealType,
      currentDate: currentDate.toISOString(),
    });
  };

  // Handle edit food (navigate to details)
  const handleEditFood = (food) => {
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
            <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
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
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
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
        <Ionicons name="restaurant-outline" size={48} color={COLORS.borderStrong} />
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mealType}</Text>
        <View style={styles.headerActions}>
          {foods.length > 0 && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={openSaveMealModal}
              hitSlop={{ top: 15, bottom: 15, left: 8, right: 8 }}
            >
              <Ionicons name="bookmark-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            hitSlop={{ top: 15, bottom: 15, left: 8, right: 15 }}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            ) : (
              <Ionicons name="refresh-outline" size={24} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
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
              colors={[COLORS.success]}
              tintColor={COLORS.success}
            />
          }
          showsVerticalScrollIndicator={false}
          extraData={deletingFoodId} // Re-render when deleting state changes
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { bottom: Math.max(insets.bottom, 16) }]}
        onPress={handleAddFood}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={COLORS.surface} />
        <Text style={styles.addButtonText}>Add Food</Text>
      </TouchableOpacity>

      {/* Save-as-meal modalı */}
      <Modal
        visible={saveMealVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveMealVisible(false)}
      >
        <View style={styles.saveMealOverlay}>
          <View style={styles.saveMealCard}>
            <Text style={styles.saveMealTitle}>Save Meal</Text>
            <Text style={styles.saveMealSubtitle}>
              Save these {foods.length} food(s) as a reusable meal
            </Text>
            <TextInput
              style={styles.saveMealInput}
              value={saveMealName}
              onChangeText={setSaveMealName}
              placeholder="Meal name"
              autoFocus
            />
            <View style={styles.saveMealButtons}>
              <TouchableOpacity
                style={styles.saveMealCancel}
                onPress={() => setSaveMealVisible(false)}
                disabled={savingMeal}
              >
                <Text style={styles.saveMealCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveMealConfirm}
                onPress={handleSaveMeal}
                disabled={savingMeal}
              >
                {savingMeal ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Text style={styles.saveMealConfirmText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveMealOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  saveMealCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  saveMealTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  saveMealSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  saveMealInput: {
    borderWidth: 1,
    borderColor: COLORS.disabled,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  saveMealButtons: {
    flexDirection: "row",
    marginTop: 16,
  },
  saveMealCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.border,
    marginRight: 8,
  },
  saveMealCancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  saveMealConfirm: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.success,
    marginLeft: 8,
  },
  saveMealConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.surface,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
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
    color: COLORS.textPrimary,
  },
  summaryDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryMainValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.success,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  customBadge: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "normal",
  },
  foodDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  nutritionalDetails: {
    fontSize: 12,
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default MealDetailsScreen;
