// src/screens/auth/LoginScreen.js - Updated with Backend Integration
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../context/SignUpContext";
import AuthService from "../../services/AuthService";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { updateFormData } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const calculateCaloriesAndMacros = (
    gender,
    birthDate,
    height,
    weight,
    activityLevel
  ) => {
    try {
      // Yaş hesaplama
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      // BMR hesaplama (Mifflin-St Jeor Equation)
      const bmr =
        gender && gender.toLowerCase() === "male"
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;

      // Aktivite çarpanları
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
    } catch (error) {
      console.error("Calorie calculation error:", error);
      // Default değerler döndür
      return {
        calories: 2000,
        carbs: 250,
        protein: 150,
        fat: 55,
      };
    }
  };

  const handleLogin = async () => {
    // Validasyon
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting login process...");

      // 1. Login API çağrısı
      const loginResult = await AuthService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      console.log("Login successful:", loginResult);

      // 2. Kullanıcı profilini çek
      console.log("Fetching user profile...");
      const profileResult = await AuthService.getUserProfile();
      console.log("Profile loaded:", profileResult);

      const userData = profileResult.user;

      // 3. SignUp context'ini güncelle - temel bilgiler
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

      // 4. Doğum tarihi formatını ayarla
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

      // 5. Kalori planını hesapla ve context'e kaydet
      if (
        userData.gender &&
        userData.birthDate &&
        userData.height &&
        userData.weight &&
        userData.activityLevel
      ) {
        const calculatedPlan = calculateCaloriesAndMacros(
          userData.gender,
          userData.birthDate,
          userData.height,
          userData.weight,
          userData.activityLevel
        );

        updateFormData("calculatedPlan", {
          dailyCalories: calculatedPlan.calories,
          macros: {
            carbs: calculatedPlan.carbs,
            protein: calculatedPlan.protein,
            fat: calculatedPlan.fat,
          },
        });

        console.log("Calculated plan:", calculatedPlan);
      } else {
        console.log("Missing data for calorie calculation:", {
          gender: userData.gender,
          birthDate: userData.birthDate,
          height: userData.height,
          weight: userData.weight,
          activityLevel: userData.activityLevel,
        });

        // Eksik veri varsa default plan kullan
        updateFormData("calculatedPlan", {
          dailyCalories: 2000,
          macros: {
            carbs: 250,
            protein: 150,
            fat: 55,
          },
        });
      }

      // 6. Ana sayfaya yönlendir
      Alert.alert(
        "Login Successful",
        `Welcome back, ${userData.firstName || "User"}!`,
        [
          {
            text: "OK",
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
      console.error("Login error:", err);

      let errorMessage = "An error occurred during login";

      if (err.message.includes("Invalid credentials")) {
        errorMessage = "Email or password is incorrect";
      } else if (err.message.includes("Network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.message.includes("Backend sunucusuna")) {
        errorMessage = "Cannot connect to server. Please try again later.";
      } else {
        errorMessage = err.message;
      }

      Alert.alert("Login Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login to your account</Text>
      <Text style={styles.subHeader}>
        Welcome back! Please enter your details.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#A0A0A0"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading}
        autoCorrect={false}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#A0A0A0"
        secureTextEntry
        style={styles.input}
        editable={!isLoading}
        autoCorrect={false}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword1")}
        style={styles.forgotPassword}
        disabled={isLoading}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.loginButtonText}>Logging in...</Text>
          </View>
        ) : (
          <Text style={styles.loginButtonText}>Login now</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("SignUp1")}
          disabled={isLoading}
        >
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BUTTON_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 4,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#76AEF2",
    fontSize: 14,
  },
  loginButton: {
    height: BUTTON_HEIGHT,
    backgroundColor: "#474545",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: "#999",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#999",
  },
  signupLink: {
    fontSize: 14,
    color: "#63A4F4",
    fontWeight: "bold",
  },
});

export default LoginScreen;
