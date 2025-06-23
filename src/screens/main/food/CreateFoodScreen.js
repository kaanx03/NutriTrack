// src/screens/main/CreateFoodScreen.js - Backend Integration
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";
import NutritionService from "../../../services/NutritionService";

const CreateFoodScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addPersonalFood, refreshData } = useMeals();

  // Form state
  const [foodName, setFoodName] = useState("");
  const [serving, setServing] = useState("");
  const [unit, setUnit] = useState("gram (g)");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(null);

  // UI state
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Unit options
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

  // Food icons/emojis
  const foodIcons = [
    { id: 1, emoji: "🍔", name: "burger" },
    { id: 2, emoji: "🍕", name: "pizza" },
    { id: 3, emoji: "🍗", name: "chicken" },
    { id: 4, emoji: "🥗", name: "salad" },
    { id: 5, emoji: "🍎", name: "apple" },
    { id: 6, emoji: "🍌", name: "banana" },
    { id: 7, emoji: "🥑", name: "avocado" },
    { id: 8, emoji: "🍊", name: "orange" },
    { id: 9, emoji: "🍇", name: "grapes" },
    { id: 10, emoji: "🥕", name: "carrot" },
    { id: 11, emoji: "🥦", name: "broccoli" },
    { id: 12, emoji: "🍞", name: "bread" },
    { id: 13, emoji: "🥪", name: "sandwich" },
    { id: 14, emoji: "🥩", name: "steak" },
    { id: 15, emoji: "🍤", name: "shrimp" },
    { id: 16, emoji: "🍹", name: "cocktail" },
    { id: 17, emoji: "🥤", name: "soda" },
    { id: 18, emoji: "🍚", name: "rice" },
    { id: 19, emoji: "🍜", name: "noodles" },
    { id: 20, emoji: "🥐", name: "croissant" },
    { id: 21, emoji: "🧁", name: "cupcake" },
    { id: 22, emoji: "🍦", name: "ice cream" },
    { id: 23, emoji: "🍫", name: "chocolate" },
    { id: 24, emoji: "🥞", name: "pancakes" },
    { id: 25, emoji: "🥚", name: "egg" },
    { id: 26, emoji: "🥓", name: "bacon" },
    { id: 27, emoji: "🍯", name: "honey" },
    { id: 28, emoji: "🍪", name: "cookie" },
    { id: 29, emoji: "🍩", name: "donut" },
    { id: 30, emoji: "🌮", name: "taco" },
  ];

  // Filter icons based on search query
  const filteredIcons = iconSearchQuery
    ? foodIcons.filter((icon) =>
        icon.name.toLowerCase().includes(iconSearchQuery.toLowerCase())
      )
    : foodIcons;

  // Validate form
  const isFormValid = () => {
    return (
      foodName.trim() !== "" &&
      serving.trim() !== "" &&
      calories.trim() !== "" &&
      parseFloat(calories) > 0 &&
      parseFloat(serving) > 0
    );
  };

  // Handle saving the food with backend integration
  const handleSave = async () => {
    if (!isFormValid()) {
      Alert.alert(
        "Validation Error",
        "Please fill out all required fields with valid values."
      );
      return;
    }

    try {
      setIsLoading(true);

      // Prepare custom food data for backend
      const customFoodData = {
        foodName: foodName.trim(),
        caloriesPer100g: parseFloat(calories),
        proteinPer100g: parseFloat(protein) || 0,
        carbsPer100g: parseFloat(carbs) || 0,
        fatPer100g: parseFloat(fat) || 0,
        servingSize: parseFloat(serving),
        description: `Custom food created with ${
          selectedIcon?.emoji || "🍽️"
        } icon`,
      };

      console.log("Creating custom food with data:", customFoodData);

      // Save to backend - SADECE BU İSTEK YAPILACAK
      const savedFood = await NutritionService.addCustomFood(customFoodData);
      console.log("Custom food saved to backend:", savedFood);

      // Backend'den gelen veriyi frontend formatına çevir
      const newFood = {
        id: savedFood.id?.toString() || Date.now().toString(),
        name: savedFood.food_name || foodName.trim(),
        calories:
          parseFloat(savedFood.calories_per_100g) || parseFloat(calories),
        carbs: parseFloat(savedFood.carbs_per_100g) || parseFloat(carbs) || 0,
        protein:
          parseFloat(savedFood.protein_per_100g) || parseFloat(protein) || 0,
        fat: parseFloat(savedFood.fat_per_100g) || parseFloat(fat) || 0,
        weight: parseFloat(savedFood.serving_size) || parseFloat(serving),
        portionSize: parseFloat(savedFood.serving_size) || parseFloat(serving),
        portionUnit: unit,
        icon: selectedIcon?.emoji || "🍽️",
        isPersonal: true,
        isCustomFood: true,
        backendId: savedFood.id,
      };

      // SADECE CONTEXT'E EKLE - Backend'e tekrar istek GÖNDERME
      // addPersonalFood yerine sadece context'i güncelle
      console.log(
        "Adding food to context only (no backend request):",
        newFood.name
      );

      // MealsContext'teki setPersonalFoods'u direkt kullan
      // veya refreshData() ile personal foods'u yenile
      await refreshData();

      Alert.alert("Success", "Custom food created successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to food selection with Personal tab active
            navigation.navigate("FoodSelection", {
              activeTab: "Personal",
              refreshPersonal: true,
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating custom food:", error);

      // Handle specific error cases
      if (error.message && error.message.includes("Food already exists")) {
        // Eğer duplicate error ise, muhtemelen yemek oluşturulmuştur
        // Personal foods'u yenile ve kontrol et
        try {
          await refreshData();
          Alert.alert(
            "Food Created",
            "Your custom food has been created successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("FoodSelection", {
                    activeTab: "Personal",
                    refreshPersonal: true,
                  });
                },
              },
            ]
          );
        } catch (refreshError) {
          Alert.alert(
            "Food Already Exists",
            "A food with this name already exists. Please use a different name or edit the existing food.",
            [{ text: "OK", style: "default" }]
          );
        }
      } else {
        Alert.alert(
          "Error",
          "Failed to create custom food. Please try again.",
          [{ text: "OK", style: "default" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render icon selector grid
  const renderIconItem = ({ item }) => (
    <TouchableOpacity
      style={styles.iconItem}
      onPress={() => {
        setSelectedIcon(item);
        setShowIconSelector(false);
      }}
    >
      <Text style={styles.iconEmoji}>{item.emoji}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Food</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Food Icon */}
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.iconSelector}
            onPress={() => setShowIconSelector(true)}
            disabled={isLoading}
          >
            {selectedIcon ? (
              <Text style={styles.selectedIconEmoji}>{selectedIcon.emoji}</Text>
            ) : (
              <Ionicons name="add" size={40} color="#A1CE50" />
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Food Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Food Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Pasta, Sandwich, etc."
              value={foodName}
              onChangeText={setFoodName}
              editable={!isLoading}
            />
          </View>

          {/* Serving and Unit Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Serving Size *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={serving}
                onChangeText={setServing}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                disabled={isLoading}
              >
                <Text style={styles.dropdownText}>{unit}</Text>
                <Ionicons
                  name={showUnitDropdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#666"
                />
              </TouchableOpacity>

              {showUnitDropdown && (
                <View style={styles.dropdownMenu}>
                  {unitOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setUnit(option);
                        setShowUnitDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Calories and Carbs Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Calories (per 100g) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 250"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 30"
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Protein and Fat Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Protein (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 15"
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Fat (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 8"
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              * Required fields. Nutrition values are per 100g of the food.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          (!isFormValid() || isLoading) && styles.addButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!isFormValid() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.addButtonText}>Create Food</Text>
        )}
      </TouchableOpacity>

      {/* Icon Selector Modal */}
      <Modal
        visible={showIconSelector}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowIconSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Icon</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIconSelector(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search icons"
              value={iconSearchQuery}
              onChangeText={setIconSearchQuery}
            />
          </View>

          <FlatList
            data={filteredIcons}
            renderItem={renderIconItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={5}
            contentContainerStyle={styles.iconGrid}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
  },
  iconSelector: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedIconEmoji: {
    fontSize: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dropdownSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownMenu: {
    position: "absolute",
    top: 74,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    zIndex: 1000,
    elevation: 3,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
  },
  helpContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  addButton: {
    margin: 20,
    backgroundColor: "#A1CE50",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 20,
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  iconGrid: {
    padding: 10,
  },
  iconItem: {
    width: "20%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  iconEmoji: {
    fontSize: 30,
  },
});

export default CreateFoodScreen;
