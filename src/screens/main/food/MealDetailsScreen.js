import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMeals } from "../../../context/MealsContext";

const MealDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mealType } = route.params;

  // Context'ten state ve fonksiyonları alın
  const { mealFoods, deleteFood } = useMeals();

  const [totalCalories, setTotalCalories] = useState(0);
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    // Context'ten ilgili öğün yemeklerini al
    const currentFoods = mealFoods[mealType] || [];
    setFoods(currentFoods);

    // Toplam kaloriyi hesapla
    const total = currentFoods.reduce((sum, food) => sum + food.calories, 0);
    setTotalCalories(total);
  }, [mealFoods, mealType]);

  const handleDeleteFood = (foodId) => {
    Alert.alert(
      "Delete Food",
      "Sure you want to delete this food log?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            // Context'teki deleteFood fonksiyonunu çağır
            deleteFood(foodId, mealType);
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddFood = () => {
    // Navigate to FoodSelectionScreen with current meal type
    navigation.navigate("FoodSelection", {
      mealType: mealType,
    });
  };

  // Yemek öğeleri için yardımcı fonksiyon: Emoji/ikon seçimi
  const getFoodIcon = (foodName) => {
    const name = foodName.toLowerCase();

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

    // Varsayılan: İlk harf
    return foodName.charAt(0).toUpperCase();
  };

  const renderFoodItem = ({ item }) => {
    // İkon veya ilk harf
    const iconContent =
      typeof getFoodIcon(item.name) === "string" &&
      getFoodIcon(item.name).length === 1 ? (
        <Text style={styles.foodIconText}>{getFoodIcon(item.name)}</Text>
      ) : (
        <Text style={styles.foodIconEmoji}>{getFoodIcon(item.name)}</Text>
      );

    return (
      <View style={styles.foodItem}>
        <View style={styles.foodItemLeft}>
          <View style={styles.foodIcon}>{iconContent}</View>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodDetails}>
              {item.calories} kcal
              {item.weight ? `, ${item.weight} gr` : ""}
              {item.carbs ? ` • ${item.carbs}g carb` : ""}
              {item.protein ? ` • ${item.protein}g protein` : ""}
              {item.fat ? ` • ${item.fat}g fat` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.foodItemRight}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              // Yemek detaylarına yönlendir
              navigation.navigate("FoodDetails", { food: item });
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteFood(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.headerTouchable}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.headerTitle}>{mealType}</Text>
          <View style={styles.headerRight} />
        </View>
      </TouchableOpacity>

      {/* Total calories */}
      <View style={styles.totalCaloriesContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{totalCalories} kcal</Text>
      </View>

      {/* Foods list */}
      <FlatList
        data={foods}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food items added yet</Text>
          </View>
        }
      />

      {/* Add button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerTouchable: {
    paddingTop: 50, // Başlığı aşağıya taşımak için üst boşluk eklendi
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16, // Daha fazla dikey boşluk eklendi
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
  totalCaloriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 80,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  foodIconText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
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
  foodDetails: {
    fontSize: 12,
    color: "#999",
  },
  foodItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  successMessage: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    backgroundColor: "#f6ffed",
    borderColor: "#b7eb8f",
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    borderRadius: 8,
  },
  successText: {
    color: "#52c41a",
    marginLeft: 8,
    fontSize: 14,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#A1CE50",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MealDetailsScreen;
