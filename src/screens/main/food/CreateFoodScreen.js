// src/screens/main/CreateFoodScreen.js
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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";

const CreateFoodScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addPersonalFood } = useMeals();

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

  // Food icons/emojis - these would typically be stored elsewhere
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
      // Optional but preferred
      selectedIcon !== null &&
      carbs.trim() !== "" &&
      protein.trim() !== "" &&
      fat.trim() !== ""
    );
  };

  // Handle saving the food
  const handleSave = () => {
    if (isFormValid()) {
      const newFood = {
        id: Date.now().toString(),
        name: foodName.trim(),
        calories: parseInt(calories, 10),
        carbs: parseInt(carbs, 10) || 0,
        protein: parseInt(protein, 10) || 0,
        fat: parseInt(fat, 10) || 0,
        weight: parseInt(serving, 10) || 0,
        unit: unit,
        icon: selectedIcon?.emoji || "🍽️",
        isPersonal: true, // Flag to identify personal foods
      };

      // Add to personal foods in the context
      addPersonalFood(newFood);

      // Navigate back to the food selection screen with the Personal tab active
      navigation.navigate("FoodSelection", { activeTab: "Personal" });
    } else {
      // Could add an alert here for validation
      console.log("Please fill out all required fields");
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
            <Text style={styles.formLabel}>Food Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Pasta, Sandwich, etc."
              value={foodName}
              onChangeText={setFoodName}
            />
          </View>

          {/* Serving and Unit Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Serving</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={serving}
                onChangeText={setServing}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
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
              <Text style={styles.formLabel}>Calories (kcal)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 10"
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>
          </View>

          {/* Protein and Fat Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Protein (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 5"
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Fat (g)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 3"
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, !isFormValid() && styles.addButtonDisabled]}
        onPress={handleSave}
        disabled={!isFormValid()}
      >
        <Text style={styles.addButtonText}>Add</Text>
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
              placeholder="Search"
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
