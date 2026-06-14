// src/screens/main/InsightsScreen.js - Fixed based on your current working code
import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle, Rect, Text as SvgText, Path } from "react-native-svg";
import ScreenHeader from "../../components/ScreenHeader";
import { useInsights } from "../../context/InsightsContext";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../theme";

const { width } = Dimensions.get("window");
// Kart içi net genişlik: ekran - 2*20 margin - 2*16 padding
const chartWidth = width - 72;

const InsightsScreen = () => {
  const navigation = useNavigation();
  const {
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const {
    loading,
    error,
    selectedPeriod,
    calorieData,
    weightData,
    waterData,
    changePeriod,
    changeDate,
    refreshData,
    getFormattedDateRange,
    getSafeValue,
    getChartDays,
  } = useInsights();

  const [refreshing, setRefreshing] = useState(false);

  // Bugünün indeksini hesapla (sadece weekly görünümde anlamlı)
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
  // Chart data - KEEPING ORIGINAL LOGIC FOR CALORIES AND WATER
  const calorieChartData = React.useMemo(() => {
    if (!calorieData?.chart) return [];
    return calorieData.chart.map((item) => parseFloat(item.consumed) || 0);
  }, [calorieData]);

  const waterChartData = React.useMemo(() => {
    if (!waterData?.chart) return [];
    return waterData.chart.map((item) => parseFloat(item.consumed) || 0);
  }, [waterData]);

  // Weight chart data - boş günler için null
  const weightChartData = React.useMemo(() => {
    if (!weightData?.chart) return [];

    return weightData.chart.map((item) => {
      const weight = item.weight;

      if (weight === null || weight === undefined) return null;
      if (weight === "null" || weight === "") return null;

      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) return null;

      return parsedWeight;
    });
  }, [weightData]);

  const calorieGoal = getSafeValue("calories.stats.average_goal", 2500);
  const waterGoal = getSafeValue("water.stats.average_goal", 2500);
  const goalWeight = getSafeValue("weight.goalWeight", 70);

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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  // Not authenticated screen
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="warning" size={48} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorMessage}>
          Please login to view your insights
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // IMPROVED: Bar Chart Component with NULL HANDLING for weight
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

    // null değerleri filtrele maxValue hesaplanırken
    const validData = data.filter(
      (value) =>
        value !== null && value !== undefined && !isNaN(value) && value > 0
    );
    const maxValue =
      validData.length > 0 ? Math.max(...validData, goal || 0) : goal || 100;
    const barWidth = (chartWidth - 60) / data.length;

    return (
      <View style={styles.chartContainer}>
        {/* Svg ile dokunma alanlarını aynı koordinat sistemine sabitle */}
        <View style={{ width: chartWidth, height: 220 }}>
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
            // CRITICAL: null kontrolü - strict checking
            const hasData =
              value !== null &&
              value !== undefined &&
              !isNaN(value) &&
              value > 0;
            const displayValue = hasData ? value : 0;

            // Min 6px yükseklik: küçük değerler de kolon gibi görünsün
            const rawBarHeight =
              maxValue > 0 && hasData ? (displayValue / maxValue) * 120 : 0;
            const barHeight = hasData ? Math.max(6, rawBarHeight) : 0;
            const x = 30 + index * barWidth + barWidth * 0.2;
            const y = 170 - barHeight;
            const isSelected = index === selectedDay;
            const isToday = parseInt(days[index]) === today;
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
              barColor = COLORS.border; // Veri yok - çok açık gri
            }

            return (
              <React.Fragment key={index}>
                {/* Sadece veri varsa bar çiz — üst köşeler yuvarlak, alt köşeler düz */}
                {hasData ? (
                  <Path
                    d={(() => {
                      const r = Math.min(barWidthActual / 2, barHeight / 2);
                      const right = x + barWidthActual;
                      return `M ${x} 170 L ${x} ${y + r} Q ${x} ${y} ${
                        x + r
                      } ${y} L ${right - r} ${y} Q ${right} ${y} ${right} ${
                        y + r
                      } L ${right} 170 Z`;
                    })()}
                    fill={barColor}
                  />
                ) : (
                  // Veri yoksa sadece küçük bir placeholder göster
                  <Circle
                    cx={x + barWidthActual / 2}
                    cy={165}
                    r="2"
                    fill={COLORS.disabled}
                  />
                )}

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
                      {Math.round(displayValue)}
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

          {/* X-axis labels — etiket fontu bar sayısına göre küçülür
              (yearly'de 12 ay sığsın, üst üste binmesin) */}
          {days.slice(0, data.length).map((day, index) => {
            const isToday = parseInt(day) === today;
            const labelFont =
              data.length > 8 ? 9 : data.length > 5 ? 11 : 12;
            return (
              <SvgText
                key={index}
                x={30 + index * barWidth + barWidth * 0.5}
                y="195"
                fontSize={labelFont}
                fill={isToday ? COLORS.textPrimary : COLORS.textSecondary}
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
              <SvgText x="25" y="55" fontSize="10" fill={COLORS.textSecondary} textAnchor="end">
                {Math.round(maxValue)}
              </SvgText>
              <SvgText
                x="25"
                y="110"
                fontSize="10"
                fill={COLORS.textSecondary}
                textAnchor="end"
              >
                {Math.round(maxValue / 2)}
              </SvgText>
              <SvgText
                x="25"
                y="175"
                fontSize="10"
                fill={COLORS.textSecondary}
                textAnchor="end"
              >
                0
              </SvgText>
            </>
          )}
        </Svg>

        {/* Touchable overlay - kolonun tamamı tıklanabilir */}
        {data.map((value, index) => {
          const hasData =
            value !== null && value !== undefined && !isNaN(value) && value > 0;

          return (
            <TouchableOpacity
              key={`touch-${index}`}
              style={[
                styles.barTouchArea,
                { left: 30 + index * barWidth, width: barWidth },
              ]}
              onPress={() => hasData && onDaySelect(index)}
            />
          );
        })}
        </View>
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
      <ScreenHeader
        title="Insights"
        rightIcon="refresh"
        onRightPress={refreshData}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={COLORS.danger} />
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
            <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
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
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
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
            primaryColor={COLORS.success}
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
            primaryColor={COLORS.water}
            secondaryColor="#91CDF8"
            unit="ml"
            selectedDay={selectedWaterDay}
            onDaySelect={setSelectedWaterDay}
          />
        </View>

        {/* Weight Chart - FIXED FOR NULL HANDLING */}
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
            primaryColor={COLORS.weight}
            secondaryColor="#FFAE97"
            unit="kg"
            selectedDay={selectedWeightDay}
            onDaySelect={setSelectedWeightDay}
          />
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
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
    color: COLORS.danger,
    flex: 1,
  },
  periodContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: COLORS.shadow,
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
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  selectedPeriodText: {
    color: COLORS.surface,
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
    backgroundColor: COLORS.surfaceMuted,
  },
  dateTextContainer: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  dateSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  todayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  chartSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
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
    color: COLORS.textPrimary,
  },
  goalInfo: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goalText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textTertiary,
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
