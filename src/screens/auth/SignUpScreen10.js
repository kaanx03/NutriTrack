// src/screens/auth/SignUpScreen10.js - Updated with Backend Integration
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { useSignUp } from "../../context/SignUpContext";
import AuthService from "../../services/AuthService";

const size = 240;
const strokeWidth = 25;
const radius = size / 2 - strokeWidth / 2;
const circumference = 2 * Math.PI * radius;

const SignUpScreen10 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();
  const [calorieData, setCalorieData] = useState(null);
  const [calculationError, setCalculationError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

      // BMR hesaplama (Mifflin-St Jeor Equation)
      const bmr =
        gender.toLowerCase() === "male"
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;

      const activityMultipliers = {
        1: 1.2, // Sedentary
        2: 1.375, // Light activity
        3: 1.55, // Moderate activity
        4: 1.725, // Very active
        5: 1.9, // Extra active
      };

      const multiplier = activityMultipliers[activityLevel] || 1.55;
      const calories = Math.round(bmr * multiplier);

      // Makro besin dağılımı (%50 carbs, %30 protein, %20 fat)
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

      console.log("Calculating with data:", {
        gender,
        age,
        height,
        weight,
        activityLevel,
      });

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
        console.log("Calculated nutrition targets:", result);
      } else {
        setCalculationError(true);
      }
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculationError(true);
    }
  }, [formData]);

  const validateFormData = () => {
    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "gender",
      "height",
      "weight",
    ];
    const missingFields = [];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in the following fields: ${missingFields.join(", ")}`
      );
      return false;
    }

    if (!formData.email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long"
      );
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateFormData()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting signup process...");

      // 1. Doğum tarihini formatla
      let formattedBirthDate = "";
      if (formData.year && formData.month && formData.day) {
        formattedBirthDate = `${formData.year}-${formData.month.padStart(
          2,
          "0"
        )}-${formData.day.padStart(2, "0")}`;
      } else if (formData.birthDate) {
        formattedBirthDate = formData.birthDate;
      }

      // 2. Backend için veri hazırla
      const userDataForBackend = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber || "",
        gender: formData.gender,
        birthDate: formattedBirthDate,
        height: parseInt(formData.height) || null,
        weight: parseFloat(formData.weight) || null,
        activityLevel: parseInt(formData.activityLevel) || 3,
      };

      console.log("Signup data being sent:", userDataForBackend);

      // 3. Signup API çağrısı
      const signupResult = await AuthService.signup(userDataForBackend);
      console.log("Signup successful:", signupResult);

      // 4. Kullanıcı profilini çek
      console.log("Fetching user profile after signup...");
      const profileResult = await AuthService.getUserProfile();
      console.log("Profile loaded after signup:", profileResult);

      const userData = profileResult.user;

      // 5. Context'i güncelle
      updateFormData("email", userData.email || "");
      updateFormData("firstName", userData.firstName || "");
      updateFormData("lastName", userData.lastName || "");
      updateFormData("gender", userData.gender || "male");
      updateFormData("height", userData.height?.toString() || "");
      updateFormData("weight", userData.weight?.toString() || "");
      updateFormData(
        "activityLevel",
        userData.activityLevel?.toString() || "3"
      );

      // 6. Doğum tarihi formatını ayarla
      if (userData.birthDate) {
        try {
          const date = new Date(userData.birthDate);
          if (!isNaN(date.getTime())) {
            updateFormData("year", date.getFullYear().toString());
            updateFormData("month", (date.getMonth() + 1).toString());
            updateFormData("day", date.getDate().toString());
            updateFormData("birthDate", userData.birthDate);
          }
        } catch (dateError) {
          console.error("Date parsing error:", dateError);
        }
      }

      // 7. Kalori planını context'e kaydet
      const finalCalorieData = calorieData || {
        calories: 2000,
        carbs: 250,
        protein: 150,
        fat: 55,
      };

      updateFormData("calculatedPlan", {
        dailyCalories: finalCalorieData.calories,
        macros: {
          carbs: finalCalorieData.carbs,
          protein: finalCalorieData.protein,
          fat: finalCalorieData.fat,
        },
      });

      console.log("Final calculated plan:", finalCalorieData);

      // 8. Başarı mesajı ve yönlendirme
      Alert.alert(
        "Account Created Successfully!",
        `Welcome to NutriTrack, ${userData.firstName}! Your personalized nutrition plan is ready.`,
        [
          {
            text: "Start Tracking",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Signup error:", err);

      let errorMessage = "An error occurred during account creation";

      if (err.message.includes("Email already in use")) {
        errorMessage =
          "An account with this email already exists. Please try logging in.";
      } else if (err.message.includes("Network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.message.includes("Backend sunucusuna")) {
        errorMessage = "Cannot connect to server. Please try again later.";
      } else {
        errorMessage = err.message;
      }

      Alert.alert("Signup Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#474747" />
        <Text style={styles.loadingText}>Creating your account...</Text>
        <Text style={styles.loadingSubText}>
          Please wait while we set up your personalized nutrition plan.
        </Text>
      </View>
    );
  }

  // Error state
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

  // Loading calculation state
  if (!calorieData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#474747" />
        <Text style={styles.loadingText}>
          Calculating your personalized plan...
        </Text>
      </View>
    );
  }

  // Success state with calculated data
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
  centerContent: {
    justifyContent: "center",
    paddingTop: 0,
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
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 20,
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
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
