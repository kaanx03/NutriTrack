// src/screens/main/InsightsScreen.js - Original Styling with Database Integration
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle, Rect, Text as SvgText, Path } from "react-native-svg";
import BottomNavigation from "../../components/BottomNavigation";
import { useInsights } from "../../context/InsightsContext";

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

const InsightsScreen = () => {
  const navigation = useNavigation();
  const {
    loading,
    error,
    selectedPeriod,
    currentDate,
    calorieData,
    weightData,
    waterData,
    nutritionData,
    bmiData,
    loadInsightsDashboard,
    changePeriod,
    changeDate,
    refreshData,
    getFormattedDateRange,
    getSafeValue,
    getChartDays,
  } = useInsights();

  // Chart selection states
  const [selectedCalorieDay, setSelectedCalorieDay] = useState(1);
  const [selectedWaterDay, setSelectedWaterDay] = useState(1);
  const [selectedWeightDay, setSelectedWeightDay] = useState(1);
  const [selectedNutritionDay, setSelectedNutritionDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Component mount olduğunda verileri yükle
  useEffect(() => {
    loadInsightsDashboard();
  }, []);

  // Chart data'ları hazırla - gerçek verilerden
  const calorieChartData = React.useMemo(() => {
    if (!calorieData?.chart) return [];
    return calorieData.chart.map((item) => item.consumed || 0);
  }, [calorieData]);

  const waterChartData = React.useMemo(() => {
    if (!waterData?.chart) return [];
    return waterData.chart.map((item) => item.consumed || 0);
  }, [waterData]);

  const weightChartData = React.useMemo(() => {
    if (!weightData?.chart) return [];
    return weightData.chart.map((item) => item.weight || 0);
  }, [weightData]);

  const nutritionChartData = React.useMemo(() => {
    if (!nutritionData?.chart) return [];
    return nutritionData.chart.map((item) => ({
      carbs: item.carbs || 0,
      protein: item.protein || 0,
      fat: item.fat || 0,
    }));
  }, [nutritionData]);

  // Goals ve değerler
  const days = getChartDays();
  const calorieGoal = getSafeValue(
    "calories.stats.average_goal",
    calorieData?.goal || 2500
  );
  const waterGoal = getSafeValue(
    "water.stats.average_goal",
    waterData?.goal || 2500
  );
  const goalWeight = getSafeValue(
    "weight.goalWeight",
    weightData?.goalWeight || 70
  );
  const bmiValue = getSafeValue("bmi.current.bmi", 22.9);
  const bmiCategory = getSafeValue("bmi.current.category", "Normal");

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  // Period değiştirme handler
  const handlePeriodChange = (period) => {
    changePeriod(period);
    // Reset selected days when period changes
    setSelectedCalorieDay(1);
    setSelectedWaterDay(1);
    setSelectedWeightDay(1);
    setSelectedNutritionDay(null);
  };

  // Tarih navigasyon handlers
  const goToPrevious = () => {
    changeDate("previous");
  };

  const goToNext = () => {
    changeDate("next");
  };

  // BMI renk kodları
  const getBMIColor = (bmiValue) => {
    if (bmiValue < 16.0) return "#3F51B2";
    if (bmiValue >= 16.0 && bmiValue < 17.0) return "#1A96F0";
    if (bmiValue >= 17.0 && bmiValue < 18.5) return "#00A9F1";
    if (bmiValue >= 18.5 && bmiValue < 25.0) return "#4AAF57";
    if (bmiValue >= 25.0 && bmiValue < 30.0) return "#FFC02D";
    if (bmiValue >= 30.0 && bmiValue < 35.0) return "#FF981F";
    if (bmiValue >= 35.0 && bmiValue < 40.0) return "#FF5726";
    return "#F54336";
  };

  // Bar Chart Component - Interactive version
  const BarChart = ({
    data,
    goal,
    primaryColor,
    secondaryColor,
    unit = "",
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
        <View style={styles.chartWrapper}>
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
                  {/* Main bar body */}
                  <Rect
                    x={x}
                    y={y + barWidthActual / 2}
                    width={barWidthActual}
                    height={Math.max(0, barHeight - barWidthActual / 2)}
                    fill={isSelected ? primaryColor : secondaryColor}
                  />
                  {/* Rounded top */}
                  <Circle
                    cx={x + barWidthActual / 2}
                    cy={y + barWidthActual / 2}
                    r={barWidthActual / 2}
                    fill={isSelected ? primaryColor : secondaryColor}
                  />

                  {/* Selected indicator */}
                  {isSelected && value > 0 && (
                    <>
                      {/* Pin drop shadow */}
                      <Circle
                        cx={x + barWidthActual / 2 + 1}
                        cy={y - 29}
                        r="20"
                        fill="rgba(0,0,0,0.1)"
                      />
                      {/* Pin outer circle */}
                      <Circle
                        cx={x + barWidthActual / 2}
                        cy={y - 30}
                        r="20"
                        fill="white"
                        stroke={primaryColor}
                        strokeWidth="2"
                      />
                      {/* Pin inner circle */}
                      <Circle
                        cx={x + barWidthActual / 2}
                        cy={y - 30}
                        r="15"
                        fill={primaryColor}
                      />
                      {/* Pin pointer */}
                      <Path
                        d={`M ${x + barWidthActual / 2} ${y - 7} L ${
                          x + barWidthActual / 2 - 6
                        } ${y - 15} L ${x + barWidthActual / 2 + 6} ${
                          y - 15
                        } Z`}
                        fill="white"
                      />
                      {/* Value text */}
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
                <SvgText
                  x="25"
                  y="55"
                  fontSize="10"
                  fill="#666"
                  textAnchor="end"
                >
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
                style={[
                  styles.barTouchArea,
                  {
                    left: x,
                    width: barWidthActual,
                  },
                ]}
                onPress={() => onDaySelect(index)}
              />
            );
          })}
        </View>
      </View>
    );
  };

  // Stacked Bar Chart for Nutrition
  const NutritionChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No nutrition data available</Text>
        </View>
      );
    }

    const barWidth = (chartWidth - 60) / data.length;
    const barGap = 4;
    const segmentGap = 2;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.nutritionChartWrapper}>
          <Svg width={chartWidth} height={220}>
            {data.map((dayData, index) => {
              const x = 30 + index * barWidth + barWidth * 0.2;
              const barWidthActual = barWidth * 0.6 - barGap;
              const isSelected = index === selectedNutritionDay;

              const carbsHeight = (dayData.carbs / 100) * 120;
              const proteinHeight = (dayData.protein / 100) * 120;
              const fatHeight = (dayData.fat / 100) * 120;

              const carbsColor = isSelected ? "#F54336" : "#FFCDD2";
              const proteinColor = isSelected ? "#FF981F" : "#FFDEB7";
              const fatColor = isSelected ? "#2196F3" : "#BBDEFB";

              const radius = barWidthActual / 2;

              const carbsY = 170 - carbsHeight;
              const proteinY = carbsY - proteinHeight - segmentGap;
              const fatY = proteinY - fatHeight - segmentGap;

              return (
                <React.Fragment key={index}>
                  {/* Fat (top) with rounded top */}
                  {fatHeight > 0 && (
                    <>
                      <Rect
                        x={x}
                        y={fatY + radius}
                        width={barWidthActual}
                        height={Math.max(0, fatHeight - radius)}
                        fill={fatColor}
                      />
                      <Circle
                        cx={x + radius}
                        cy={fatY + radius}
                        r={radius}
                        fill={fatColor}
                      />
                    </>
                  )}

                  {/* Protein (middle) */}
                  {proteinHeight > 0 && (
                    <Rect
                      x={x}
                      y={proteinY}
                      width={barWidthActual}
                      height={proteinHeight}
                      fill={proteinColor}
                    />
                  )}

                  {/* Carbs (bottom) with rounded bottom */}
                  {carbsHeight > 0 && (
                    <>
                      <Rect
                        x={x}
                        y={carbsY}
                        width={barWidthActual}
                        height={Math.max(0, carbsHeight - radius)}
                        fill={carbsColor}
                      />
                      <Circle
                        cx={x + radius}
                        cy={170 - radius}
                        r={radius}
                        fill={carbsColor}
                      />
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
            <SvgText x="25" y="55" fontSize="10" fill="#666" textAnchor="end">
              100
            </SvgText>
            <SvgText x="25" y="115" fontSize="10" fill="#666" textAnchor="end">
              50
            </SvgText>
            <SvgText x="25" y="175" fontSize="10" fill="#666" textAnchor="end">
              0
            </SvgText>
          </Svg>

          {/* Touchable overlay */}
          {data.map((_, index) => {
            const x = 30 + index * barWidth + barWidth * 0.2;
            const barWidthActual = barWidth * 0.6 - barGap;

            return (
              <TouchableOpacity
                key={`touch-${index}`}
                style={[
                  styles.nutritionBarTouchArea,
                  {
                    left: x,
                    width: barWidthActual,
                  },
                ]}
                onPress={() =>
                  setSelectedNutritionDay(
                    selectedNutritionDay === index ? null : index
                  )
                }
              />
            );
          })}

          {/* Info card */}
          {selectedNutritionDay !== null && data[selectedNutritionDay] && (
            <View
              style={[
                styles.nutritionInfoCard,
                {
                  left: Math.min(
                    30 +
                      selectedNutritionDay * barWidth +
                      barWidth * 0.2 +
                      barWidth * 0.6 +
                      8,
                    chartWidth - 100
                  ),
                },
              ]}
            >
              <View style={styles.nutritionInfoRow}>
                <View
                  style={[
                    styles.nutritionColorDot,
                    { backgroundColor: "#F54336" },
                  ]}
                />
                <Text style={styles.nutritionInfoText}>
                  Carbs {Math.round(data[selectedNutritionDay].carbs)}%
                </Text>
              </View>
              <View style={styles.nutritionInfoRow}>
                <View
                  style={[
                    styles.nutritionColorDot,
                    { backgroundColor: "#FFC107" },
                  ]}
                />
                <Text style={styles.nutritionInfoText}>
                  Protein {Math.round(data[selectedNutritionDay].protein)}%
                </Text>
              </View>
              <View style={styles.nutritionInfoRow}>
                <View
                  style={[
                    styles.nutritionColorDot,
                    { backgroundColor: "#2196F3" },
                  ]}
                />
                <Text style={styles.nutritionInfoText}>
                  Fat {Math.round(data[selectedNutritionDay].fat)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // BMI Gauge Component
  const BMIGauge = ({ bmiValue = 22.9 }) => {
    const size = 200;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    const ranges = [
      { min: 0, max: 16, color: "#2196F3", startAngle: 0, endAngle: 40 },
      { min: 16, max: 17, color: "#03A9F4", startAngle: 40, endAngle: 55 },
      { min: 17, max: 18.5, color: "#00BCD4", startAngle: 55, endAngle: 75 },
      { min: 18.5, max: 25, color: "#4CAF50", startAngle: 75, endAngle: 150 },
      { min: 25, max: 30, color: "#FFC107", startAngle: 150, endAngle: 210 },
      { min: 30, max: 35, color: "#FF9800", startAngle: 210, endAngle: 270 },
      { min: 35, max: 40, color: "#FF5722", startAngle: 270, endAngle: 330 },
      { min: 40, max: 50, color: "#F44336", startAngle: 330, endAngle: 360 },
    ];

    // Calculate BMI needle position
    let needleAngle = 0;
    if (bmiValue < 16) {
      needleAngle = (bmiValue / 16) * 40;
    } else if (bmiValue < 17) {
      needleAngle = 40 + ((bmiValue - 16) / 1) * 15;
    } else if (bmiValue < 18.5) {
      needleAngle = 55 + ((bmiValue - 17) / 1.5) * 20;
    } else if (bmiValue < 25) {
      needleAngle = 75 + ((bmiValue - 18.5) / 6.5) * 75;
    } else if (bmiValue < 30) {
      needleAngle = 150 + ((bmiValue - 25) / 5) * 60;
    } else if (bmiValue < 35) {
      needleAngle = 210 + ((bmiValue - 30) / 5) * 60;
    } else if (bmiValue < 40) {
      needleAngle = 270 + ((bmiValue - 35) / 5) * 60;
    } else {
      needleAngle = 330 + ((bmiValue - 40) / 10) * 30;
    }

    needleAngle = Math.max(0, Math.min(360, needleAngle));

    const needleLength = radius - 12;
    const needleX =
      center + needleLength * Math.cos(((needleAngle - 90) * Math.PI) / 180);
    const needleY =
      center + needleLength * Math.sin(((needleAngle - 90) * Math.PI) / 180);

    return (
      <View style={styles.bmiContainer}>
        <View style={styles.bmiGaugeWrapper}>
          <Svg width={size} height={size}>
            {/* Background circle segments */}
            {ranges.map((range, index) => {
              const startAngleRad = ((range.startAngle - 90) * Math.PI) / 180;
              const endAngleRad = ((range.endAngle - 90) * Math.PI) / 180;

              const x1 = center + radius * Math.cos(startAngleRad);
              const y1 = center + radius * Math.sin(startAngleRad);
              const x2 = center + radius * Math.cos(endAngleRad);
              const y2 = center + radius * Math.sin(endAngleRad);

              const largeArc = range.endAngle - range.startAngle > 180 ? 1 : 0;

              return (
                <Path
                  key={index}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                  stroke={range.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Tick marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
              const tickAngle = ((angle - 90) * Math.PI) / 180;
              const innerRadius = radius - strokeWidth / 2 - 4;
              const outerRadius = radius - strokeWidth / 2 + 4;

              const x1 = center + innerRadius * Math.cos(tickAngle);
              const y1 = center + innerRadius * Math.sin(tickAngle);
              const x2 = center + outerRadius * Math.cos(tickAngle);
              const y2 = center + outerRadius * Math.sin(tickAngle);

              return (
                <Path
                  key={index}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#E0E0E0"
                  strokeWidth="1"
                />
              );
            })}

            {/* Center circle */}
            <Circle
              cx={center}
              cy={center}
              r="8"
              fill={getBMIColor(bmiValue)}
              stroke="white"
              strokeWidth="3"
            />

            {/* Needle */}
            <Path
              d={`M ${center} ${center} L ${needleX} ${needleY}`}
              stroke={getBMIColor(bmiValue)}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* BMI Value */}
            <SvgText
              x={center}
              y={center - 5}
              fontSize="24"
              fontWeight="bold"
              fill="#333"
              textAnchor="middle"
            >
              {bmiValue?.toFixed(1) || "0.0"}
            </SvgText>
          </Svg>
        </View>

        {/* BMI Categories */}
        <View style={styles.bmiLegend}>
          {[
            {
              color: "#2196F3",
              label: "Very Severely Underweight",
              range: "BMI < 16.0",
            },
            {
              color: "#03A9F4",
              label: "Severely Underweight",
              range: "BMI 16.0 - 16.9",
            },
            {
              color: "#00BCD4",
              label: "Underweight",
              range: "BMI 17.0 - 18.4",
            },
            { color: "#4CAF50", label: "Normal", range: "BMI 18.5 - 24.9" },
            { color: "#FFC107", label: "Overweight", range: "BMI 25.0 - 29.9" },
            {
              color: "#FF9800",
              label: "Obese Class I",
              range: "BMI 30.0 - 34.9",
            },
            {
              color: "#FF5722",
              label: "Obese Class II",
              range: "BMI 35.0 - 39.9",
            },
            { color: "#F44336", label: "Obese Class III", range: "BMI ≥ 40" },
          ].map((item, index) => (
            <View key={index} style={styles.bmiLegendItem}>
              <View
                style={[styles.bmiLegendColor, { backgroundColor: item.color }]}
              />
              <View style={styles.bmiLegendText}>
                <Text style={styles.bmiLegendLabel}>{item.label}</Text>
                <Text style={styles.bmiLegendRange}>{item.range}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Loading screen
  if (loading && !calorieData && !error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#63A4F4" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

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
            <Text style={styles.errorText}>Connection error - {error}</Text>
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
              onPress={() => handlePeriodChange(period)}
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
          <TouchableOpacity onPress={goToPrevious}>
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{getFormattedDateRange()}</Text>
          <TouchableOpacity onPress={goToNext}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Calorie Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Calorie (kcal)</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#A1CE50" }]}
                />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendLine, { backgroundColor: "#ccc" }]}
                />
                <Text style={styles.legendText}>Goal</Text>
              </View>
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
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#1A96F0" }]}
                />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendLine, { backgroundColor: "#ccc" }]}
                />
                <Text style={styles.legendText}>Goal</Text>
              </View>
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
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FF6347" }]}
                />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendLine, { backgroundColor: "#ccc" }]}
                />
                <Text style={styles.legendText}>Goal</Text>
              </View>
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

        {/* Nutrition Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Nutrition Breakdown (%)</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#F54336" }]}
                />
                <Text style={styles.legendText}>Carbs</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FFC107" }]}
                />
                <Text style={styles.legendText}>Protein</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#2196F3" }]}
                />
                <Text style={styles.legendText}>Fat</Text>
              </View>
            </View>
          </View>
          <NutritionChart data={nutritionChartData} />
        </View>

        {/* BMI Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>BMI (kg/m²)</Text>
            <View style={styles.normalBadge}>
              <Text style={styles.normalBadgeText}>
                {bmiCategory ? bmiCategory.split(" ")[0] : "Normal"}
              </Text>
            </View>
          </View>
          <BMIGauge bmiValue={bmiValue} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLine: {
    width: 12,
    height: 1,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
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
  },
  chartWrapper: {
    position: "relative",
    width: chartWidth,
    height: 220,
  },
  barTouchArea: {
    position: "absolute",
    height: 120,
    top: 50,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  nutritionChartWrapper: {
    position: "relative",
    width: chartWidth,
    height: 220,
  },
  nutritionBarTouchArea: {
    position: "absolute",
    height: 120,
    top: 50,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  nutritionInfoCard: {
    position: "absolute",
    top: 20,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 85,
    zIndex: 3,
  },
  nutritionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  nutritionColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nutritionInfoText: {
    fontSize: 10,
    color: "#333",
    fontWeight: "500",
  },
  normalBadge: {
    backgroundColor: "#A1CE50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  normalBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  bmiContainer: {
    alignItems: "center",
    width: "100%",
  },
  bmiGaugeWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  bmiLegend: {
    marginTop: 20,
    width: "100%",
  },
  bmiLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bmiLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  bmiLegendText: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bmiLegendLabel: {
    fontSize: 14,
    color: "#333",
  },
  bmiLegendRange: {
    fontSize: 12,
    color: "#666",
  },
});

export default InsightsScreen;
