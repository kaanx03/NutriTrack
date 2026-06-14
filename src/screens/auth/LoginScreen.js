// src/screens/auth/LoginScreen.js - Updated with Backend Integration
import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSignUp } from "../../context/SignUpContext";
import { useAuth } from "../../context/AuthContext";
import AuthService from "../../services/AuthService";
import { showToast } from "../../components/AppToast";
import { COLORS } from "../../theme";
import {
  calculateCaloriesAndMacros,
  calculateAge,
} from "../../utils/nutritionMath";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { updateFormData } = useSignUp();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Kayıtlı token + biyometrik tercih + donanım varsa hızlı giriş sun
  useEffect(() => {
    (async () => {
      try {
        const [token, enabled] = await Promise.all([
          SecureStore.getItemAsync("authToken"),
          AsyncStorage.getItem("biometricEnabled"),
        ]);
        if (!token || enabled !== "1") return;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && enrolled) setBiometricAvailable(true);
      } catch (e) {
        // biyometrik desteklenmiyor — normal login akışı
      }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock NutriTrack",
      });
      if (!result.success) return;

      setIsLoading(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No saved session");

      await hydrateAndEnter(token);
    } catch (err) {
      // Token süresi dolmuş olabilir — normal girişe düş
      setBiometricAvailable(false);
      showToast("Session expired, please log in", "info");
    } finally {
      setIsLoading(false);
    }
  };

  // Kalori/makro matematiği artık tek kaynakta: src/utils/nutritionMath
  // (calculateCaloriesAndMacros + calculateAge). Çağrı yeri aşağıda.

  // Login sonrası ortak akış: profili çek, context'leri doldur, Home'a git.
  // Hem şifreli login hem biyometrik unlock bu yoldan geçer.
  const hydrateAndEnter = async (token) => {
      // 2. Kullanıcı profilini çek
      const profileResult = await AuthService.getUserProfile();

      const userData = profileResult.user;

      // 3. AuthContext'i güncelle
      await signIn(token, userData);

      // 5. SignUp context'ini güncelle - temel bilgiler
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

      // 7. Kalori planını hesapla ve context'e kaydet
      if (
        userData.gender &&
        userData.birthDate &&
        userData.height &&
        userData.weight &&
        userData.activityLevel
      ) {
        const age = calculateAge(userData.birthDate);
        const calculatedPlan = calculateCaloriesAndMacros(
          userData.weight,
          userData.height,
          age,
          userData.gender,
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

      } else {

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

      // 8. Ana sayfaya yönlendir
      showToast(`Welcome back, ${userData.firstName || "User"}!`, "success");
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
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
      // 1. Login API çağrısı
      const loginResult = await AuthService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      await hydrateAndEnter(loginResult.token);
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "An error occurred during login";

      if (err.message.includes("Invalid credentials")) {
        errorMessage = "Email or password is incorrect";
      } else if (err.message.includes("Network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.message.includes("Cannot connect to server")) {
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
        placeholderTextColor={COLORS.textTertiary}
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
        placeholderTextColor={COLORS.textTertiary}
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
            <ActivityIndicator color={COLORS.surface} size="small" />
            <Text style={styles.loginButtonText}>Logging in...</Text>
          </View>
        ) : (
          <Text style={styles.loginButtonText}>Login now</Text>
        )}
      </TouchableOpacity>

      {biometricAvailable && (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricLogin}
          disabled={isLoading}
        >
          <Ionicons name="finger-print" size={22} color={COLORS.primary} />
          <Text style={styles.biometricButtonText}>
            Sign in with Biometrics
          </Text>
        </TouchableOpacity>
      )}

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
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: BUTTON_HEIGHT,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginTop: 12,
  },
  biometricButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 4,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  loginButtonText: {
    color: COLORS.surface,
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
    color: COLORS.textTertiary,
  },
  signupLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "bold",
  },
});

export default LoginScreen;
