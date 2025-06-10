// src/screens/main/InsightsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle, Rect, Text as SvgText, Path } from "react-native-svg";
import BottomNavigation from "../../components/BottomNavigation";
import { useWater } from "../../context/WaterContext";
import { useWeight } from "../../context/WeightContext";
import { useMeals } from "../../context/MealsContext";

const { width } = Dimensions.get("window");
const chartWidth = width - 40;

const InsightsScreen = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState("Weekly");

  // Context'lerden veri al
  const { waterGoal } = useWater();
  const {
    currentWeight,
    goalWeight,
    bmi,
    bmiCategory,
    getBMIColor,
    getWeightDataForInsights,
  } = useWeight();
  const { calorieData } = useMeals();

  // Tarih state'ini Date objesi olarak tutuyoruz
  const [currentDate, setCurrentDate] = useState(new Date());

  // Sample data for charts - context'lerden gelecek
  const calorieDataArray = [2300, 2100, 2400, 1900, 2200, 2500, 1800];
  const nutritionData = [
    { carbs: 45, protein: 30, fat: 25 },
    { carbs: 50, protein: 25, fat: 25 },
    { carbs: 40, protein: 35, fat: 25 },
    { carbs: 55, protein: 25, fat: 20 },
    { carbs: 60, protein: 20, fat: 20 },
    { carbs: 35, protein: 40, fat: 25 },
    { carbs: 50, protein: 30, fat: 20 },
  ];
  const waterData = [2000, 1800, 2200, 1500, 2000, 2500, 1200];

  // Weight data'yı context'ten al
  const weightData = getWeightDataForInsights();

  const days = ["16", "17", "18", "19", "20", "21", "22"];

  // Her grafik için ayrı state'ler
  const [selectedCalorieDay, setSelectedCalorieDay] = useState(1);
  const [selectedWaterDay, setSelectedWaterDay] = useState(1);
  const [selectedWeightDay, setSelectedWeightDay] = useState(1);
  const [selectedNutritionDay, setSelectedNutritionDay] = useState(null);

  const calorieGoal = calorieData.calories;

  // Tarih formatını döndüren yardımcı fonksiyon
  const formatDateRange = (date, period) => {
    const options = { month: "short", day: "numeric", year: "numeric" };

    if (period === "Weekly") {
      // Haftanın başlangıç ve bitiş tarihlerini hesapla
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      const diff =
        startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Pazartesi başlangıç
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endOfWeek.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}, ${endOfWeek.getFullYear()}`;
    } else if (period === "Monthly") {
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (period === "Yearly") {
      return date.getFullYear().toString();
    }

    return date.toLocaleDateString("en-US", options);
  };

  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);

    if (selectedPeriod === "Weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (selectedPeriod === "Monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (selectedPeriod === "Yearly") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }

    setCurrentDate(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);

    if (selectedPeriod === "Weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (selectedPeriod === "Monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (selectedPeriod === "Yearly") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }

    setCurrentDate(newDate);
  };

  // Period değiştiğinde tarihi bugüne sıfırla
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setCurrentDate(new Date()); // Bugünün tarihine sıfırla
  };

  // Bar Chart Component - Updated with interactive functionality
  const BarChart = ({
    data,
    goal,
    primaryColor,
    secondaryColor,
    unit = "",
    selectedDay,
    onDaySelect,
  }) => {
    const maxValue = Math.max(...data, goal);
    const barWidth = (chartWidth - 60) / data.length;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartWrapper}>
          <Svg width={chartWidth} height={220}>
            {/* Goal line - green dashed */}
            <Rect
              x="30"
              y={170 - (goal / maxValue) * 120}
              width={chartWidth - 60}
              height="2"
              fill={primaryColor}
              strokeDasharray="8,4"
            />

            {/* Bars */}
            {data.map((value, index) => {
              const barHeight = (value / maxValue) * 120;
              const x = 30 + index * barWidth + barWidth * 0.2;
              const y = 170 - barHeight;
              const isSelected = index === selectedDay;
              const barWidthActual = barWidth * 0.6;

              return (
                <React.Fragment key={index}>
                  {/* Main bar body (rectangular part) */}
                  <Rect
                    x={x}
                    y={y + barWidthActual / 2}
                    width={barWidthActual}
                    height={barHeight - barWidthActual / 2}
                    fill={isSelected ? primaryColor : secondaryColor}
                  />
                  {/* Rounded top (perfect circle) */}
                  <Circle
                    cx={x + barWidthActual / 2}
                    cy={y + barWidthActual / 2}
                    r={barWidthActual / 2}
                    fill={isSelected ? primaryColor : secondaryColor}
                  />

                  {/* Selected indicator - location pin style */}
                  {isSelected && (
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
            {days.map((day, index) => (
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
              {Math.round(maxValue)}
            </SvgText>
            <SvgText x="25" y="110" fontSize="10" fill="#666" textAnchor="end">
              {Math.round(maxValue / 2)}
            </SvgText>
            <SvgText x="25" y="175" fontSize="10" fill="#666" textAnchor="end">
              0
            </SvgText>
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
    const barWidth = (chartWidth - 60) / data.length;
    const barGap = 4; // Space between bars
    const segmentGap = 2; // Space between segments

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

              const carbsColor = isSelected ? "#F54336" : "#FFCDD2"; // Bottom
              const proteinColor = isSelected ? "#FF981F" : "#FFDEB7"; // Middle
              const fatColor = isSelected ? "#2196F3" : "#BBDEFB"; // Top

              const radius = barWidthActual / 2;

              // Bottom (Carbs)
              const carbsY = 170 - carbsHeight;
              // Middle (Protein)
              const proteinY = carbsY - proteinHeight - segmentGap;
              // Top (Fat)
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

                  {/* Protein (middle) - flat rectangle */}
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
            {days.map((day, index) => (
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
          {selectedNutritionDay !== null && (
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
                  Carbs {data[selectedNutritionDay].carbs}%
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
                  Protein {data[selectedNutritionDay].protein}%
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
                  Fat {data[selectedNutritionDay].fat}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // BMI Gauge Component - Context'ten gelen değerlerle
  const BMIGauge = ({ bmiValue = bmi || 22.9 }) => {
    const size = 200;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    // BMI ranges and colors - tam daire için
    const ranges = [
      { min: 0, max: 16, color: "#2196F3", startAngle: 0, endAngle: 40 }, // Very Severely Underweight
      { min: 16, max: 17, color: "#03A9F4", startAngle: 40, endAngle: 55 }, // Severely Underweight
      { min: 17, max: 18.5, color: "#00BCD4", startAngle: 55, endAngle: 75 }, // Underweight
      { min: 18.5, max: 25, color: "#4CAF50", startAngle: 75, endAngle: 150 }, // Normal
      { min: 25, max: 30, color: "#FFC107", startAngle: 150, endAngle: 210 }, // Overweight
      { min: 30, max: 35, color: "#FF9800", startAngle: 210, endAngle: 270 }, // Obese Class I
      { min: 35, max: 40, color: "#FF5722", startAngle: 270, endAngle: 330 }, // Obese Class II
      { min: 40, max: 50, color: "#F44336", startAngle: 330, endAngle: 360 }, // Obese Class III
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

    // Limit needle angle
    needleAngle = Math.max(0, Math.min(360, needleAngle));

    // Needle position
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
              fill={getBMIColor ? getBMIColor(bmiValue) : "#4CAF50"}
              stroke="white"
              strokeWidth="3"
            />

            {/* Needle */}
            <Path
              d={`M ${center} ${center} L ${needleX} ${needleY}`}
              stroke={getBMIColor ? getBMIColor(bmiValue) : "#4CAF50"}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Period Selection */}
        <View style={styles.periodContainer}>
          {["Weekly", "Monthly", "Yearly"].map((period) => (
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
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goToPrevious}>
            <Ionicons name="chevron-back" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {formatDateRange(currentDate, selectedPeriod)}
          </Text>
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
                <Text style={styles.legendText}>Water Goal</Text>
              </View>
            </View>
          </View>
          <BarChart
            data={waterData}
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
                <Text style={styles.legendText}>Weight Goal</Text>
              </View>
            </View>
          </View>
          <BarChart
            data={weightData}
            goal={goalWeight}
            primaryColor="#FF5726"
            secondaryColor="#FFAE97"
            unit="kg"
            selectedDay={selectedWeightDay}
            onDaySelect={setSelectedWeightDay}
          />
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
          <BMIGauge bmiValue={bmi} />
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
