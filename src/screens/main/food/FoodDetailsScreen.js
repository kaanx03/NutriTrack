// src/screens/main/FoodDetailsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";

const FoodDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { food } = route.params;

  // Context'ten fonksiyonları ve state'i al
  const {
    toggleFavorite,
    addToRecent,
    favoriteFoods,
    mealFoods,
    updateFoodPortion,
  } = useMeals();

  // Check if this food is already in the current meal
  const [isInCurrentMeal, setIsInCurrentMeal] = useState(false);
  const [existingFoodId, setExistingFoodId] = useState(null);

  // State'ler
  const [weightInput, setWeightInput] = useState(
    food.weight ? food.weight.toString() : "100"
  );
  const [selectedUnit, setSelectedUnit] = useState(food.unit || "gram (g)");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    calories: food.calories || 0,
    carbs: food.carbs || 0,
    protein: food.protein || 0,
    fat: food.fat || 0,
    weight: food.weight || 100,
  });

  // Birim seçenekleri
  const unitOptions = [
    "gram (g)",
    "milliliter (ml)",
    "ounce (oz)",
    "cup",
    "tablespoon",
    "teaspoon",
    "piece",
    "slice",
  ];

  // Yiyeceğin favori olup olmadığını kontrol et
  const isFavorite = favoriteFoods.some((item) => item.id === food.id);

  // Sayfa yüklendiğinde son görüntülenenlere ekle ve
  // yemeğin mevcut öğünde olup olmadığını kontrol et
  useEffect(() => {
    addToRecent(food);

    // Check if this food is already in the current meal
    const mealType = food.mealType || "Breakfast";
    const currentMealFoods = mealFoods[mealType] || [];

    // Find if the same food (by ID) is already in the meal
    const existingFood = currentMealFoods.find(
      (item) =>
        // Check by ID (exact match) or by name (similar items)
        item.id === food.id ||
        (item.name === food.name &&
          Math.abs(item.calories - food.calories) < 10) // Allow small calorie differences
    );

    if (existingFood) {
      setIsInCurrentMeal(true);
      setExistingFoodId(existingFood.id);

      // If portion size exists in the existing food, use that
      if (existingFood.portionSize || existingFood.weight) {
        setWeightInput(
          existingFood.portionSize?.toString() ||
            existingFood.weight?.toString() ||
            weightInput
        );
        setSelectedUnit(existingFood.portionUnit || selectedUnit);
      }
    }
  }, []);

  // Besin değerleri
  const caloriesPerUnit = food.calories || 0;
  const carbsPerUnit = food.carbs || 0;
  const proteinPerUnit = food.protein || 0;
  const fatPerUnit = food.fat || 0;
  const weightPerUnit = food.weight || 100;

  // Değerleri hesapla - birimi dikkate alarak
  useEffect(() => {
    let weight = parseFloat(weightInput) || 0;

    // Birim gram değil ise, uygun çevirimleri yapabilirsiniz
    // Örnek bir çevrim mantığı (gerçek çevrim faktörlerini uygulamaya göre ayarlayın)
    let weightInGrams = weight;
    if (selectedUnit === "tablespoon") {
      weightInGrams = weight * 15; // 1 yemek kaşığı yaklaşık 15 gram
    } else if (selectedUnit === "teaspoon") {
      weightInGrams = weight * 5; // 1 çay kaşığı yaklaşık 5 gram
    } else if (selectedUnit === "cup") {
      weightInGrams = weight * 240; // 1 bardak yaklaşık 240 gram
    } else if (selectedUnit === "ounce (oz)") {
      weightInGrams = weight * 28.35; // 1 ons yaklaşık 28.35 gram
    } else if (selectedUnit === "milliliter (ml)") {
      weightInGrams = weight; // 1 ml = 1 g (su için)
    }
    // Diğer birimler için benzer çevrimler eklenebilir

    // Orijinal ürün gram başına değerleri
    const caloriesPerGram = caloriesPerUnit / weightPerUnit;
    const carbsPerGram = carbsPerUnit / weightPerUnit;
    const proteinPerGram = proteinPerUnit / weightPerUnit;
    const fatPerGram = fatPerUnit / weightPerUnit;

    setCalculatedValues({
      calories: Math.round(caloriesPerGram * weightInGrams),
      carbs: Math.round(carbsPerGram * weightInGrams * 10) / 10,
      protein: Math.round(proteinPerGram * weightInGrams * 10) / 10,
      fat: Math.round(fatPerGram * weightInGrams * 10) / 10,
      weight: weight,
      weightInGrams: weightInGrams,
    });
  }, [weightInput, selectedUnit]);

  // Makro besinlerin yüzde değerleri
  const carbsPercentage =
    calculatedValues.calories > 0
      ? (calculatedValues.carbs * 4 * 100) / calculatedValues.calories
      : 0;
  const proteinPercentage =
    calculatedValues.calories > 0
      ? (calculatedValues.protein * 4 * 100) / calculatedValues.calories
      : 0;
  const fatPercentage =
    calculatedValues.calories > 0
      ? (calculatedValues.fat * 9 * 100) / calculatedValues.calories
      : 0;

  const decreaseWeight = () => {
    const currentWeight = parseFloat(weightInput) || 0;
    if (currentWeight >= 10) {
      // En az 10 gram olabilir
      setWeightInput((currentWeight - 10).toString());
    }
  };

  const increaseWeight = () => {
    const currentWeight = parseFloat(weightInput) || 0;
    setWeightInput((currentWeight + 10).toString());
  };

  // Save butonuna basınca yemeği FoodSelectionScreen'e gönder veya direkt güncelle
  const handleSave = () => {
    // Ağırlık değeri geçerli mi kontrol et
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight value.");
      return;
    }

    // Calculate new values
    const newPortionInfo = {
      foodId: food.id,
      name: food.name,
      baseCalories: food.calories,
      baseWeight: food.weight,
      portionSize: weight,
      portionUnit: selectedUnit,
      calculatedCalories: calculatedValues.calories,
      carbs: calculatedValues.carbs,
      protein: calculatedValues.protein,
      fat: calculatedValues.fat,
    };

    // If the food is already in the current meal, update it directly
    if (isInCurrentMeal && existingFoodId) {
      // Update the existing food with new portion size in the context
      updateFoodPortion(
        existingFoodId,
        food.mealType || "Breakfast",
        weight,
        selectedUnit,
        calculatedValues.calories,
        calculatedValues.carbs,
        calculatedValues.protein,
        calculatedValues.fat
      );

      // Show success message
      Alert.alert("Updated", "Food portion has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      // FoodSelectionScreen'e dön ve bilgileri parametre olarak gönder
      navigation.navigate("FoodSelection", {
        selectedPortion: newPortionInfo,
        mealType: food.mealType || "Breakfast",
        isExistingFood: isInCurrentMeal, // Flag to indicate if it's already in meal
        existingFoodId: existingFoodId,
      });
    }
  };

  // Favori durumunu değiştirmek için yeni fonksiyon
  const handleToggleFavorite = () => {
    toggleFavorite(food);
  };

  // Yemek tipine göre ikon belirlemek için yardımcı fonksiyon
  const getFoodIcon = () => {
    const name = (food.name || "").toLowerCase();

    if (name.includes("shrimp")) return "🍤";
    if (name.includes("hamburger") || name.includes("burger")) return "🍔";
    if (name.includes("hot dog")) return "🌭";
    if (name.includes("sushi")) return "🍣";
    if (name.includes("candy")) return "🍬";
    if (name.includes("flatbread")) return "🥙";
    if (name.includes("egg")) return "🥚";
    if (name.includes("cheese") || name.includes("peynir")) return "🧀";
    if (name.includes("chicken")) return "🍗";
    if (name.includes("choco")) return "🍫";
    if (name.includes("oatmeal")) return "🥣";
    return "🍽️";
  };

  // Birim seçme fonksiyonu
  const selectUnit = (unit) => {
    setSelectedUnit(unit);
    setShowUnitDropdown(false);
  };

  // Klavyeyi gizlemek için tüm ekrana TouchableWithoutFeedback ekle
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setShowUnitDropdown(false);
      }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {food.name}
            {isInCurrentMeal && (
              <Text style={styles.inMealBadge}> (Already in meal)</Text>
            )}
          </Text>
          <View style={styles.headerRight}>
            {/* Favori butonu - güncellendi */}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#ff4d4f" : "#000"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                // Burada yemeğin silinmesi için gerekli işlemler yapılabilir
                navigation.goBack();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Food Image/Icon */}
        <View style={styles.foodImageContainer}>
          <Text style={styles.foodEmoji}>{getFoodIcon()}</Text>
        </View>
        {/* Calories Circle */}
        <View style={styles.caloriesCircleContainer}>
          <View style={styles.caloriesCircle}>
            <Text style={styles.caloriesValue}>
              {calculatedValues.calories}
            </Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
          </View>
        </View>
        {/* Nutrition Breakdown */}
        <View style={styles.nutritionContainer}>
          {/* Carbs */}
          <View style={styles.nutritionItem}>
            <View style={styles.nutritionHeader}>
              <View
                style={[styles.macroIndicator, { backgroundColor: "#F54336" }]}
              />
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <Text style={styles.macroValue}>
              {calculatedValues.carbs}g ({Math.round(carbsPercentage)}%)
            </Text>
          </View>

          {/* Protein */}
          <View style={styles.nutritionItem}>
            <View style={styles.nutritionHeader}>
              <View
                style={[styles.macroIndicator, { backgroundColor: "#63A4F4" }]}
              />
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <Text style={styles.macroValue}>
              {calculatedValues.protein}g ({Math.round(proteinPercentage)}%)
            </Text>
          </View>

          {/* Fat */}
          <View style={styles.nutritionItem}>
            <View style={styles.nutritionHeader}>
              <View
                style={[styles.macroIndicator, { backgroundColor: "#FE9820" }]}
              />
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <Text style={styles.macroValue}>
              {calculatedValues.fat}g ({Math.round(fatPercentage)}%)
            </Text>
          </View>
        </View>

        {/* Additional Nutrition Information */}
        <View style={styles.additionalNutritionContainer}>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Cholesterol</Text>
            <Text style={styles.nutritionValue}>
              {(food.cholesterol || 0) *
                (calculatedValues.weightInGrams / weightPerUnit)}
              mg ({food.cholesterolPercent || 0}%)
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sodium</Text>
            <Text style={styles.nutritionValue}>
              {(food.sodium || 0) *
                (calculatedValues.weightInGrams / weightPerUnit)}
              mg ({food.sodiumPercent || 0}%)
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Minerals</Text>
            <Text style={styles.nutritionValue}></Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Calcium</Text>
            <Text style={styles.nutritionValue}>
              {(food.calcium || 0) *
                (calculatedValues.weightInGrams / weightPerUnit)}
              mg ({food.calciumPercent || 0}%)
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Iron</Text>
            <Text style={styles.nutritionValue}>
              {(food.iron || 0) *
                (calculatedValues.weightInGrams / weightPerUnit)}
              mg ({food.ironPercent || 0}%)
            </Text>
          </View>
        </View>

        {/* Weight and Unit Input Section */}
        <View style={styles.weightContainer}>
          <Text style={styles.weightLabel}>Portion</Text>
          <View style={styles.weightSelector}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decreaseWeight}
            >
              <Ionicons name="remove" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={5}
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={increaseWeight}
            >
              <Ionicons name="add" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Unit Dropdown */}
          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowUnitDropdown(!showUnitDropdown)}
          >
            <Text style={styles.unitText}>{selectedUnit}</Text>
            <Ionicons
              name={showUnitDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#666"
            />
          </TouchableOpacity>

          {/* Unit Dropdown Menu */}
          {showUnitDropdown && (
            <View style={styles.unitDropdown}>
              {unitOptions.map((unit, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.unitOption}
                  onPress={() => selectUnit(unit)}
                >
                  <Text style={styles.unitOptionText}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isInCurrentMeal ? "Update" : "Save"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    maxWidth: "60%",
  },
  inMealBadge: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    fontWeight: "normal",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  foodImageContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  foodEmoji: {
    fontSize: 80,
  },
  caloriesCircleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  caloriesCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: "#FE9820",
    justifyContent: "center",
    alignItems: "center",
  },
  caloriesValue: {
    fontSize: 22,
    fontWeight: "600",
  },
  caloriesUnit: {
    fontSize: 14,
    color: "#666",
  },
  nutritionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  nutritionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  nutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 16,
    color: "#333",
  },
  macroValue: {
    fontSize: 16,
    color: "#666",
  },
  additionalNutritionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nutritionLabel: {
    fontSize: 16,
    color: "#666",
  },
  nutritionValue: {
    fontSize: 16,
    color: "#333",
  },
  weightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 24,
    position: "relative",
  },
  weightLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    width: 70,
  },
  weightSelector: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  weightInputContainer: {
    marginHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: 60,
  },
  weightInput: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    padding: 4,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 130,
    justifyContent: "space-between",
  },
  unitText: {
    fontSize: 16,
    color: "#333",
  },
  unitDropdown: {
    position: "absolute",
    top: 70, // weightContainer'ın altına yerleştirilir
    right: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    width: 150,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
  },
  unitOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  unitOptionText: {
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#A1CE50",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FoodDetailsScreen;
