// src/screens/main/InsightsScreen.js - Simple Working Version
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
  const [selectedCalorieDay, setSelectedCalorieDay] = useState(0);
  const [selectedWaterDay, setSelectedWaterDay] = useState(0);
  const [selectedWeightDay, setSelectedWeightDay] = useState(0);
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

  const days = getChartDays();
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

  // Simple Bar Chart Component
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
            const barWidthActual = barWidth * 0.6;

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={y + barWidthActual / 2}
                  width={barWidthActual}
                  height={Math.max(0, barHeight - barWidthActual / 2)}
                  fill={isSelected ? primaryColor : secondaryColor}
                />
                <Circle
                  cx={x + barWidthActual / 2}
                  cy={y + barWidthActual / 2}
                  r={barWidthActual / 2}
                  fill={isSelected ? primaryColor : secondaryColor}
                />

                {isSelected && value > 0 && (
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
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {days.slice(0, data.length).map((day, index) => (
            <SvgText
              key={index}
              x={30 + index * barWidth + barWidth * 0.5}
              y="195"
              fontSize="12"
              fill="#666"
              textAnchor="middle"
            >
              {day}
            </SvgText>
          ))}

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
        {data.map((_, index) => {
          const x = 30 + index * barWidth + barWidth * 0.2;
          const barWidthActual = barWidth * 0.6;

          return (
            <TouchableOpacity
              key={`touch-${index}`}
              style={[styles.barTouchArea, { left: x, width: barWidthActual }]}
              onPress={() => onDaySelect(index)}
            />
          );
        })}
      </View>
    );
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

        {/* Period Selection */}
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
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => changeDate("previous")}>
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{getFormattedDateRange()}</Text>
          <TouchableOpacity onPress={() => changeDate("next")}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Calorie Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Calorie (kcal)</Text>
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
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
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
  },
  dateNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  chartSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
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
    height: 120,
    top: 50,
    backgroundColor: "transparent",
    zIndex: 2,
  },
});

export default InsightsScreen;
