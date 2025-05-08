import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { useSignUp } from "../../context/SignUpContext";

const size = 240;
const strokeWidth = 25;
const radius = size / 2 - strokeWidth / 2;
const circumference = 2 * Math.PI * radius;

const SignUpScreen10 = () => {
  const navigation = useNavigation();
  const { formData } = useSignUp();
  const [calorieData, setCalorieData] = useState(null);
  const [calculationError, setCalculationError] = useState(false);

  useEffect(() => {
    const calculateCaloriesAndMacros = (
      gender,
      age,
      height,
      weight,
      activityLevel
    ) => {
      if (
        !gender ||
        isNaN(age) ||
        isNaN(height) ||
        isNaN(weight) ||
        isNaN(activityLevel)
      ) {
        setCalculationError(true);
        return null;
      }

      const bmr =
        gender.toLowerCase() === "male"
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;

      const activityMultipliers = {
        1: 1.2,
        2: 1.375,
        3: 1.55,
        4: 1.725,
        5: 1.9,
      };

      const multiplier = activityMultipliers[activityLevel] || 1.2;
      const calories = Math.round(bmr * multiplier);

      const carbs = Math.round((calories * 0.5) / 4);
      const protein = Math.round((calories * 0.3) / 4);
      const fat = Math.round((calories * 0.2) / 9);

      return { calories, carbs, protein, fat };
    };

    const getAgeFromBirthdate = (birthDateObj) => {
      try {
        if (birthDateObj.year && birthDateObj.month && birthDateObj.day) {
          const birthYear = parseInt(birthDateObj.year, 10);
          const birthMonth = parseInt(birthDateObj.month, 10) - 1;
          const birthDay = parseInt(birthDateObj.day, 10);
          const birthDate = new Date(birthYear, birthMonth, birthDay);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          return age;
        }

        if (birthDateObj.birthDate && birthDateObj.birthDate !== "") {
          const birth = new Date(birthDateObj.birthDate);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          return age;
        }

        return 0;
      } catch {
        return 0;
      }
    };

    try {
      if (!formData) {
        setCalculationError(true);
        return;
      }

      const gender = formData.gender || "male";
      const age = getAgeFromBirthdate(formData);
      const height = parseFloat(formData.height);
      const weight = parseFloat(formData.weight);
      const activityLevel = parseInt(formData.activityLevel, 10);

      const result = calculateCaloriesAndMacros(
        gender,
        age,
        height,
        weight,
        activityLevel
      );

      if (result) {
        setCalorieData(result);
        setCalculationError(false);
      }
    } catch {
      setCalculationError(true);
    }
  }, [formData]);

  const handleContinue = () => {
    let formattedBirthDate = "";
    if (formData.year && formData.month && formData.day) {
      formattedBirthDate = `${formData.year}-${formData.month.padStart(
        2,
        "0"
      )}-${formData.day.padStart(2, "0")}`;
    }

    const userDataForBackend = {
      ...formData,
      birthDate: formattedBirthDate,
      calculatedPlan: calorieData
        ? {
            dailyCalories: calorieData.calories,
            macros: {
              carbs: calorieData.carbs,
              protein: calorieData.protein,
              fat: calorieData.fat,
            },
          }
        : null,
    };

    // Only this log remains
    console.log("======= SIGNUP FORM DATA (READY FOR BACKEND) =======");
    console.log(JSON.stringify(userDataForBackend, null, 2));
    console.log("===================================================");

    navigation.navigate("Home");
  };

  if (calculationError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Your personalized calorie plan is ready!
        </Text>
        <Text style={styles.errorText}>
          We encountered an issue with the calculation. Using default values.
        </Text>

        <View style={styles.pickerContainer}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F44336"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.5}, ${circumference}`}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2196F3"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.3}, ${circumference}`}
              strokeDashoffset={-circumference * 0.5}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FF9800"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.2}, ${circumference}`}
              strokeDashoffset={-(circumference * 0.8)}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
              fill="none"
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>2000</Text>
            <Text style={styles.kcalText}>kcal</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#F44336" }]}
            />
            <Text>Carbs: 250g</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#2196F3" }]}
            />
            <Text>Protein: 150g</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
            />
            <Text>Fat: 55g</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Start Your Plan Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!calorieData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Calculating your plan...</Text>
      </View>
    );
  }

  const carbsLength =
    ((calorieData.carbs * 4) / calorieData.calories) * circumference;
  const proteinLength =
    ((calorieData.protein * 4) / calorieData.calories) * circumference;
  const fatLength =
    ((calorieData.fat * 9) / calorieData.calories) * circumference;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your personalized calorie plan is ready!</Text>

      <View style={styles.pickerContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F44336"
            strokeWidth={strokeWidth}
            strokeDasharray={`${carbsLength}, ${circumference}`}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2196F3"
            strokeWidth={strokeWidth}
            strokeDasharray={`${proteinLength}, ${circumference}`}
            strokeDashoffset={-carbsLength}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FF9800"
            strokeWidth={strokeWidth}
            strokeDasharray={`${fatLength}, ${circumference}`}
            strokeDashoffset={-(carbsLength + proteinLength)}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            fill="none"
          />
        </Svg>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{calorieData.calories}</Text>
          <Text style={styles.kcalText}>kcal</Text>
        </View>
      </View>

      <View style={styles.macroDetailsContainer}>
        <Text style={styles.macroTitle}>Daily Macronutrient Targets</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#F44336" }]}
            />
            <Text style={styles.macroText}>Carbs: {calorieData.carbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#2196F3" }]}
            />
            <Text style={styles.macroText}>
              Protein: {calorieData.protein}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
            />
            <Text style={styles.macroText}>Fat: {calorieData.fat}g</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Start Your Plan Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 100,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerContainer: {
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  percentageContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  kcalText: {
    fontSize: 16,
    color: "#777",
  },
  macroDetailsContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  macroText: {
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  continueButton: {
    backgroundColor: "#474747",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
    width: "100%",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SignUpScreen10;
