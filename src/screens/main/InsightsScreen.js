// src/screens/main/InsightsScreen.js - Improved UI and Date Logic
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle, Rect, Text as SvgText, Path } from "react-native-svg";
import BottomNavigation from "../../components/BottomNavigation";
import { useInsights } from "../../context/InsightsContext";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

const InsightsScreen = () => {
  const navigation = useNavigation();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    refreshAuthState,
  } = useAuth();
  const {
    loading,
    error,
    selectedPeriod,
    calorieData,
    weightData,
    waterData,
    nutritionData,
    bmiData,
    changePeriod,
    changeDate,
    refreshData,
    getFormattedDateRange,
    getSafeValue,
    getChartDays,
  } = useInsights();

  const [refreshing, setRefreshing] = useState(false);

  // IMPROVED: Bugünün indeksini bul ve onu selected yap
  const today = new Date().getDate();
  const days = getChartDays();
  const todayIndex = days.findIndex((day) => parseInt(day) === today);

  const [selectedCalorieDay, setSelectedCalorieDay] = useState(
    todayIndex >= 0 ? todayIndex : 0
  );
  const [selectedWaterDay, setSelectedWaterDay] = useState(
    todayIndex >= 0 ? todayIndex : 0
  );
  const [selectedWeightDay, setSelectedWeightDay] = useState(
    todayIndex >= 0 ? todayIndex : 0
  );
  const [selectedNutritionDay, setSelectedNutritionDay] = useState(null);

  // Chart data
  const calorieChartData = React.useMemo(() => {
    if (!calorieData?.chart) return [];
    return calorieData.chart.map((item) => parseFloat(item.consumed) || 0);
  }, [calorieData]);

  const waterChartData = React.useMemo(() => {
    if (!waterData?.chart) return [];
    return waterData.chart.map((item) => parseFloat(item.consumed) || 0);
  }, [waterData]);

  const weightChartData = React.useMemo(() => {
    if (!weightData?.chart) return [];
    return weightData.chart.map((item) => parseFloat(item.weight) || 0);
  }, [weightData]);

  const nutritionChartData = React.useMemo(() => {
    if (!nutritionData?.chart) return [];
    return nutritionData.chart.map((item) => ({
      carbs: parseFloat(item.carbs) || 0,
      protein: parseFloat(item.protein) || 0,
      fat: parseFloat(item.fat) || 0,
    }));
  }, [nutritionData]);

  const calorieGoal = getSafeValue("calories.stats.average_goal", 2500);
  const waterGoal = getSafeValue("water.stats.average_goal", 2500);
  const goalWeight = getSafeValue("weight.goalWeight", 70);
  const bmiValue = getSafeValue("bmi.current.bmi", 22.9);
  const bmiCategory = getSafeValue("bmi.current.category", "Normal");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  // Loading screen
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#63A4F4" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  // Not authenticated screen
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="warning" size={48} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorMessage}>
          Please login to view your insights
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // IMPROVED: Bar Chart Component with better styling
  const BarChart = ({
    data,
    goal,
    primaryColor,
    secondaryColor,
    unit,
    selectedDay,
    onDaySelect,
  }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const maxValue = Math.max(...data, goal || 0);
    const barWidth = (chartWidth - 60) / data.length;

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={220}>
          {/* Goal line */}
          {goal > 0 && (
            <Rect
              x="30"
              y={170 - (goal / maxValue) * 120}
              width={chartWidth - 60}
              height="2"
              fill={primaryColor}
              strokeDasharray="8,4"
            />
          )}

          {/* Bars */}
          {data.map((value, index) => {
            const barHeight = maxValue > 0 ? (value / maxValue) * 120 : 0;
            const x = 30 + index * barWidth + barWidth * 0.2;
            const y = 170 - barHeight;
            const isSelected = index === selectedDay;
            const isToday = parseInt(days[index]) === today;
            const hasData = value > 0;
            const barWidthActual = barWidth * 0.6;

            // IMPROVED: Renk mantığı - bugün + seçili + veri varlığı
            let barColor;
            if (isSelected && hasData) {
              barColor = primaryColor; // Seçili ve verisi var - koyu renk
            } else if (isToday && hasData) {
              barColor = primaryColor; // Bugün ve verisi var - koyu renk
            } else if (hasData) {
              barColor = secondaryColor; // Sadece verisi var - açık renk
            } else {
              barColor = "#F0F0F0"; // Veri yok - çok açık gri
            }

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={y + barWidthActual / 2}
                  width={barWidthActual}
                  height={Math.max(2, barHeight - barWidthActual / 2)} // Min 2px yükseklik
                  fill={barColor}
                />
                <Circle
                  cx={x + barWidthActual / 2}
                  cy={y + barWidthActual / 2}
                  r={barWidthActual / 2}
                  fill={barColor}
                />

                {/* IMPROVED: Selected indicator - sadece veri varsa göster */}
                {isSelected && hasData && (
                  <>
                    <Circle
                      cx={x + barWidthActual / 2}
                      cy={y - 30}
                      r="20"
                      fill="white"
                      stroke={primaryColor}
                      strokeWidth="2"
                    />
                    <Circle
                      cx={x + barWidthActual / 2}
                      cy={y - 30}
                      r="15"
                      fill={primaryColor}
                    />
                    <SvgText
                      x={x + barWidthActual / 2}
                      y={y - 26}
                      fontSize="11"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {Math.round(value)}
                    </SvgText>
                    <SvgText
                      x={x + barWidthActual / 2}
                      y={y - 16}
                      fontSize="8"
                      fill="white"
                      textAnchor="middle"
                    >
                      {unit || "kcal"}
                    </SvgText>
                  </>
                )}

                {/* IMPROVED: Today indicator - bugünü göster */}
                {isToday && (
                  <Circle
                    cx={x + barWidthActual / 2}
                    cy={185}
                    r="3"
                    fill={primaryColor}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* IMPROVED: X-axis labels - bugün koyu, diğerleri normal */}
          {days.slice(0, data.length).map((day, index) => {
            const isToday = parseInt(day) === today;
            return (
              <SvgText
                key={index}
                x={30 + index * barWidth + barWidth * 0.5}
                y="195"
                fontSize="12"
                fill={isToday ? "#333" : "#666"}
                textAnchor="middle"
                fontWeight={isToday ? "bold" : "normal"}
              >
                {day}
              </SvgText>
            );
          })}

          {/* Y-axis labels */}
          {maxValue > 0 && (
            <>
              <SvgText x="25" y="55" fontSize="10" fill="#666" textAnchor="end">
                {Math.round(maxValue)}
              </SvgText>
              <SvgText
                x="25"
                y="110"
                fontSize="10"
                fill="#666"
                textAnchor="end"
              >
                {Math.round(maxValue / 2)}
              </SvgText>
              <SvgText
                x="25"
                y="175"
                fontSize="10"
                fill="#666"
                textAnchor="end"
              >
                0
              </SvgText>
            </>
          )}
        </Svg>

        {/* Touchable overlay */}
        {data.map((value, index) => {
          const x = 30 + index * barWidth + barWidth * 0.2;
          const barWidthActual = barWidth * 0.6;

          return (
            <TouchableOpacity
              key={`touch-${index}`}
              style={[styles.barTouchArea, { left: x, width: barWidthActual }]}
              onPress={() => value > 0 && onDaySelect(index)} // Sadece veri varsa seçilebilir
            />
          );
        })}
      </View>
    );
  };

  // IMPROVED: Period labels - Dinamik içerik
  const getPeriodLabel = (period) => {
    switch (period) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return period.charAt(0).toUpperCase() + period.slice(1);
    }
  };

  // IMPROVED: Date navigation labels
  const getDateNavigationLabel = () => {
    if (selectedPeriod === "monthly") {
      return getFormattedDateRange(); // Şubat 2025 gibi
    } else if (selectedPeriod === "yearly") {
      return getFormattedDateRange(); // 2025 gibi
    } else {
      return getFormattedDateRange(); // Jun 23 - Jun 29, 2025 gibi
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity onPress={refreshData}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#63A4F4"]}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* IMPROVED: Period Selection */}
        <View style={styles.periodContainer}>
          {["weekly", "monthly", "yearly"].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriodButton,
              ]}
              onPress={() => changePeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.selectedPeriodText,
                ]}
              >
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IMPROVED: Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDate("previous")}
            style={styles.dateNavButton}
          >
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{getDateNavigationLabel()}</Text>
            {selectedPeriod === "weekly" && (
              <Text style={styles.dateSubText}>7 days</Text>
            )}
            {selectedPeriod === "monthly" && (
              <Text style={styles.dateSubText}>30 days</Text>
            )}
            {selectedPeriod === "yearly" && (
              <Text style={styles.dateSubText}>365 days</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => changeDate("next")}
            style={styles.dateNavButton}
          >
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* IMPROVED: Today indicator */}
        <View style={styles.todayIndicator}>
          <View style={styles.todayDot} />
          <Text style={styles.todayText}>Today: {today}</Text>
        </View>

        {/* Calorie Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Calorie (kcal)</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalText}>Goal: {calorieGoal}</Text>
            </View>
          </View>
          <BarChart
            data={calorieChartData}
            goal={calorieGoal}
            primaryColor="#A1CE50"
            secondaryColor="#D4E5A7"
            unit="kcal"
            selectedDay={selectedCalorieDay}
            onDaySelect={setSelectedCalorieDay}
          />
        </View>

        {/* Water Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Water (mL)</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalText}>Goal: {waterGoal} ml</Text>
            </View>
          </View>
          <BarChart
            data={waterChartData}
            goal={waterGoal}
            primaryColor="#1A96F0"
            secondaryColor="#91CDF8"
            unit="ml"
            selectedDay={selectedWaterDay}
            onDaySelect={setSelectedWaterDay}
          />
        </View>

        {/* Weight Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight (kg)</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalText}>Goal: {goalWeight} kg</Text>
            </View>
          </View>
          <BarChart
            data={weightChartData}
            goal={goalWeight}
            primaryColor="#FF5726"
            secondaryColor="#FFAE97"
            unit="kg"
            selectedDay={selectedWeightDay}
            onDaySelect={setSelectedWeightDay}
          />
        </View>
      </ScrollView>

      <BottomNavigation activeTab="Insights" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#63A4F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE6E6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#FF6B6B",
    flex: 1,
  },
  periodContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  selectedPeriodButton: {
    backgroundColor: "#63A4F4",
  },
  periodText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedPeriodText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
  },
  dateTextContainer: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dateSubText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  todayIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 8,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#63A4F4",
    marginRight: 6,
  },
  todayText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  chartSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  goalInfo: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goalText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
  },
  chartContainer: {
    alignItems: "center",
    position: "relative",
  },
  barTouchArea: {
    position: "absolute",
    height: 140,
    top: 30,
    backgroundColor: "transparent",
    zIndex: 2,
  },
});

export default InsightsScreen;
