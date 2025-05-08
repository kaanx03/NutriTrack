// src/screens/auth/SignUpScreen1.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../context/SignUpContext"; // ← Context kullanımı

const SignUpScreen1 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp(); // ← Global state'e erişim

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // E-posta doğrulama fonksiyonu
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(
      emailRegex.test(value) ? "" : "Please enter a valid email address."
    );
  };

  // Şifre doğrulama fonksiyonu
  const validatePassword = (value) => {
    const isValid =
      value.length >= 8 &&
      /[A-Za-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[!@#$%^&*(),.?\":{}|<>]/.test(value);

    setPasswordError(
      isValid
        ? ""
        : "Password must be at least 8 characters long and include uppercase letters, numbers, and symbols."
    );
  };

  // Devam et butonu fonksiyonu
  const handleContinue = () => {
    const email = formData.email;
    const password = formData.password;

    // Boş alan kontrolü
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // Hatalı veri kontrolü
    if (emailError || passwordError) {
      Alert.alert("Error", "Please fix the errors above.");
      return;
    }

    // Sözleşme kutusu kontrolü
    if (!isChecked) {
      Alert.alert("Error", "Please accept the terms and privacy policy.");
      return;
    }

    // Sonraki ekrana geçiş
    navigation.navigate("SignUp2");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      <Text style={styles.subHeader}>
        Start your journey to a healthier you!
      </Text>

      {/* E-posta girişi */}
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="email"
          size={20}
          color="#A0A0A0"
          style={styles.icon}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#A0A0A0"
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => {
            updateFormData("email", text); // Global state güncelle
            validateEmail(text);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Şifre girişi */}
      <View style={styles.inputContainer}>
        <FontAwesome
          name="lock"
          size={20}
          color="#A0A0A0"
          style={styles.icon}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#A0A0A0"
          secureTextEntry={!showPassword}
          style={styles.input}
          value={formData.password}
          onChangeText={(text) => {
            updateFormData("password", text); // Global state güncelle
            validatePassword(text);
          }}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <FontAwesome
            name={showPassword ? "eye" : "eye-slash"}
            size={20}
            color="#A0A0A0"
          />
        </TouchableOpacity>
      </View>
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : null}

      {/* Kullanıcı sözleşmesi kutusu */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { backgroundColor: isChecked ? "#63A4F4" : "#FFFFFF" },
          ]}
          onPress={() => setIsChecked(!isChecked)}
        >
          {isChecked && <FontAwesome name="check" size={14} color="#fff" />}
        </TouchableOpacity>
        <Text style={styles.checkboxText}>
          I agree to the <Text style={styles.link}>Terms</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>

      {/* Devam butonu */}
      <TouchableOpacity style={styles.signupButton} onPress={handleContinue}>
        <Text style={styles.signupButtonText}>Continue</Text>
      </TouchableOpacity>

      {/* Giriş linki */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "red",
    marginBottom: 8,
    marginLeft: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#C5C6CC",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 14,
    color: "#71727A",
    flex: 1,
    flexWrap: "wrap",
  },
  link: {
    color: "#63A4F4",
    fontWeight: "bold",
  },
  signupButton: {
    height: 54,
    backgroundColor: "#474545",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 20,
  },
  signupButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#71727A",
  },
  loginLink: {
    fontSize: 14,
    color: "#63A4F4",
    fontWeight: "bold",
  },
});

export default SignUpScreen1;
