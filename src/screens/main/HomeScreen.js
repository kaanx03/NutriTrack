// src/screens/main/HomeScreen.js - Backend Integration
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useMeals } from "../../context/MealsContext";
import { useActivity } from "../../context/ActivityContext";
import CaloriesProgressCircle from "../../components/CaloriesProgressCircle";
import DatePickerModal from "../../components/DatePickerModal";
import Svg, { Circle } from "react-native-svg";
import { COLORS, CHART } from "../../theme";

const HomeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // MealsContext'ten state ve fonksiyonları al
  const {
    meals,
    mealFoods,
    consumedCalories,
    caloriesLeft,
    consumedNutrients,
    calorieData,
    currentDate,
    changeDate,
    addFood,
    refreshData: refreshMealsData,
    isLoading: mealsLoading,
    registerActivitySync,
  } = useMeals();

  // ActivityContext'ten burnedCalories değerini al
  const {
    burnedCalories,
    refreshData: refreshActivityData,
    isLoading: activityLoading,
    syncWithDate,
  } = useActivity();

  // Context senkronizasyonunu kur
  useEffect(() => {
    if (registerActivitySync && syncWithDate) {
      registerActivitySync(syncWithDate);
    }
  }, [registerActivitySync, syncWithDate]);

  // Loading state
  const isLoading = mealsLoading || activityLoading;

  // Ekran focus olduğunda verileri yenile — ama her tab geçişinde değil,
  // son yenilemeden en az 30 sn geçtiyse (gereksiz API çağrılarını önler)
  const lastFocusRefresh = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusRefresh.current > 30000) {
        lastFocusRefresh.current = now;
        handleRefresh();
      }
    }, [currentDate])
  );

  // Seçilen yemekleri işlemek için FoodSelectionScreen'den dönüşte
  useEffect(() => {
    if (route.params?.selectedFood) {
      handleAddFoodFromRoute(route.params.selectedFood);
      navigation.setParams({ selectedFood: undefined });
    }
  }, [route.params?.selectedFood]);

  useEffect(() => {
    if (route.params?.deletedFood) {
      navigation.setParams({ deletedFood: undefined });
    }
  }, [route.params?.deletedFood]);

  // Route'dan gelen yemeği ekleme
  const handleAddFoodFromRoute = async (selectedFood) => {
    try {
      await addFood(selectedFood);
    } catch (error) {
      console.error("Error adding food from route:", error);
      Alert.alert("Error", "Failed to add food. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Her iki context'i de yenile
      await Promise.all([refreshMealsData(), refreshActivityData()]);

    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert(
        "Refresh Error",
        "Failed to refresh data. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Format numbers to fix floating point issues
  const formatMacroValue = (value) => {
    return Math.round(value * 10) / 10;
  };

  const formatDate = () => {
    const today = new Date();
    const isToday =
      today.getDate() === currentDate.getDate() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();

    const options = { month: "short", day: "numeric" };
    const formattedDate = currentDate.toLocaleDateString(undefined, options);

    return isToday ? `Today, ${formattedDate}` : formattedDate;
  };

  const handleDateSelect = (date) => {
    changeDate(date);
    setDatePickerVisible(false);
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    changeDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    changeDate(nextDay);
  };

  const handleAddFood = (mealType) => {
    navigation.navigate("FoodSelection", {
      mealType,
      currentDate: currentDate.toISOString(),
    });
  };

  const viewMealDetails = (mealType) => {
    navigation.navigate("MealDetails", {
      mealType: mealType,
      mealFoods: mealFoods[mealType],
      currentDate: currentDate.toISOString(),
    });
  };

  const handleAddActivity = () => {
    navigation.navigate("ActivitySelection", {
      currentDate: currentDate.toISOString(),
    });
  };

  // Calculate calories progress percentage (consumed/total * 100)
  // 100'ün üzeri değerler kırmızı "aşım" halkası olarak çizilir
  const getCaloriesProgressPercentage = () => {
    if (!calorieData.calories || calorieData.calories <= 0) return 0;
    return Math.round((consumedCalories / calorieData.calories) * 100);
  };

  // Hedef aşıldıysa kaç kalori aşıldığını hesapla
  const overCalories = Math.max(
    0,
    Math.round(consumedCalories - (calorieData.calories || 0))
  );

  // Calculate macro nutrient progress percentage
  const getMacroProgressPercentage = (consumed, target) => {
    if (consumed <= 0 || target <= 0) return 0;
    return Math.min(Math.round((consumed / target) * 100), 100);
  };

  // Create circular progress component for macros
  const MacroProgressCircle = ({
    size = 80,
    strokeWidth = 6,
    progress,
    color,
    children,
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * progress) / 100;

    return (
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            stroke={COLORS.border}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.macroCircleContent}>{children}</View>
        </View>
      </View>
    );
  };

  // Loading component
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.header}>
          <View style={styles.headerPlaceholder}></View>
          <Text style={styles.title}>NutriTrack</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.success} />
          <Text style={styles.loadingText}>Loading your nutrition data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder}></View>
        <Text style={styles.title}>NutriTrack</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.success]}
            tintColor={COLORS.success}
          />
        }
      >
        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Date Navigation */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={goToPreviousDay}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateContainer}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text style={styles.dateText}>{formatDate()}</Text>
              <Image
                source={require("../../../assets/icons/calendar.png")}
                style={styles.calendarIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToNextDay}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Calories Summary */}
          <View style={styles.summaryContainer}>
            {/* Eaten Calories */}
            <View style={styles.summaryItem}>
              <View style={styles.summaryHeader}>
                <Text style={styles.emojiIcon}>🥗</Text>
                <Text style={styles.summaryLabel}>Eaten</Text>
              </View>
              <Text style={styles.summaryValue}>
                {Math.round(consumedCalories)}
              </Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>

            {/* Calories Left */}
            <View style={styles.caloriesLeftContainer}>
              <CaloriesProgressCircle
                size={120}
                strokeWidth={10}
                progress={getCaloriesProgressPercentage()}
                color={COLORS.success}
                overflowColor={COLORS.successDark}
              >
                {overCalories > 0 ? (
                  <>
                    <Text style={[styles.caloriesLeftValue, { color: COLORS.successDark }]}>
                      {overCalories}
                    </Text>
                    <Text style={[styles.caloriesLeftUnit, { color: COLORS.successDark }]}>
                      kcal over
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.caloriesLeftValue}>
                      {Math.round(caloriesLeft)}
                    </Text>
                    <Text style={styles.caloriesLeftUnit}>kcal left</Text>
                  </>
                )}
              </CaloriesProgressCircle>
            </View>

            {/* Burned Calories */}
            <View style={styles.summaryItem}>
              <View style={styles.summaryHeader}>
                <Text style={styles.emojiIcon}>🔥</Text>
                <Text style={styles.summaryLabel}>Burned</Text>
              </View>
              <Text style={styles.summaryValue}>
                {Math.round(burnedCalories)}
              </Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
          </View>

          {/* Eaten Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Eaten</Text>

            {/* Macros */}
            <View style={styles.macrosContainer}>
              {/* Carbs */}
              <View style={styles.macroItem}>
                <MacroProgressCircle
                  size={80}
                  strokeWidth={6}
                  progress={getMacroProgressPercentage(
                    consumedNutrients.carbs,
                    calorieData.carbs
                  )}
                  color={CHART.carbs}
                >
                  <Text style={styles.macroValue}>
                    {formatMacroValue(consumedNutrients.carbs)}
                  </Text>
                  <Text style={styles.macroUnit}>g</Text>
                </MacroProgressCircle>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>

              {/* Protein */}
              <View style={styles.macroItem}>
                <MacroProgressCircle
                  size={80}
                  strokeWidth={6}
                  progress={getMacroProgressPercentage(
                    consumedNutrients.protein,
                    calorieData.protein
                  )}
                  color={COLORS.primary}
                >
                  <Text style={styles.macroValue}>
                    {formatMacroValue(consumedNutrients.protein)}
                  </Text>
                  <Text style={styles.macroUnit}>g</Text>
                </MacroProgressCircle>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>

              {/* Fat */}
              <View style={styles.macroItem}>
                <MacroProgressCircle
                  size={80}
                  strokeWidth={6}
                  progress={getMacroProgressPercentage(
                    consumedNutrients.fat,
                    calorieData.fat
                  )}
                  color={CHART.fat}
                >
                  <Text style={styles.macroValue}>
                    {formatMacroValue(consumedNutrients.fat)}
                  </Text>
                  <Text style={styles.macroUnit}>g</Text>
                </MacroProgressCircle>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Burned Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Burned</Text>

            <View style={styles.burnedContainer}>
              <TouchableOpacity
                style={styles.mealLeftContent}
                onPress={() => navigation.navigate("ActivityLog")}
                activeOpacity={0.7}
              >
                <Image
                  source={require("../../../assets/icons/activity.png")}
                  style={styles.activityIcon}
                />
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>Activity</Text>
                  <Text style={styles.mealCalories}>
                    {Math.round(burnedCalories)} kcal
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addFoodButton, { backgroundColor: COLORS.warning }]}
                onPress={handleAddActivity}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Meals Card */}
        <View style={styles.mealsCard}>
          {meals.map((meal, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.mealItem,
                index === meals.length - 1 && styles.mealItemLast,
              ]}
              activeOpacity={0.7}
              onPress={() => viewMealDetails(meal.type)}
            >
              <View style={styles.mealLeftContent}>
                <Image
                  source={
                    meal.type === "Breakfast"
                      ? require("../../../assets/icons/breakfast.png")
                      : meal.type === "Lunch"
                      ? require("../../../assets/icons/lunch.png")
                      : meal.type === "Dinner"
                      ? require("../../../assets/icons/dinner.png")
                      : require("../../../assets/icons/snack.png")
                  }
                  style={styles.mealIcon}
                />
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{meal.type}</Text>
                  <Text style={styles.mealCalories}>
                    {meal.consumed > 0 ? Math.round(meal.consumed) : "0"} kcal
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addFoodButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddFood(meal.type);
                }}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={currentDate}
        onDateSelect={handleDateSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 80,
    backgroundColor: COLORS.success,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerPlaceholder: {
    width: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.surface,
    fontStyle: "italic",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    marginTop: -60,
  },
  loadingContainer: {
    justifyContent: "center",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  calendarIcon: {
    width: 16,
    height: 16,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryItem: {
    alignItems: "center",
    width: "25%",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  emojiIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  summaryUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  caloriesLeftContainer: {
    width: "50%",
    alignItems: "center",
    position: "relative",
  },
  caloriesLeftValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  caloriesLeftUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  sectionContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  macroItem: {
    alignItems: "center",
  },
  macroCircleContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  macroUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  burnedContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 80,
    paddingVertical: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealItemLast: {
    borderBottomWidth: 0,
  },
  mealLeftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  mealCalories: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  addFoodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: COLORS.surface,
    fontWeight: "300",
    lineHeight: 28,
  },
});

export default HomeScreen;
