import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { COLORS } from "../../../theme";

const ForgotPasswordScreen1 = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isValid, setIsValid] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChangeEmail = (text) => {
    setEmail(text);
    const valid = emailRegex.test(text);
    setIsValid(valid);
    if (valid) setEmailError("");
  };

  const handleResetPassword = () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!isValid) {
      setEmailError("Please enter a valid email address");
      return;
    }
    navigation.navigate("ForgotPassword2", { email });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <AntDesign name="left" size={20} color={COLORS.surface} />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.description}>
          Please enter your email to reset the password
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={handleChangeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.resetButton,
            { backgroundColor: isValid ? COLORS.textSecondary : COLORS.disabledText },
          ]}
          onPress={handleResetPassword}
          disabled={!isValid}
        >
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 24, // SafeAreaView paddingHorizontal ile hizalı
    marginBottom: 35,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  inputSection: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginTop: 4,
  },
  resetButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.surface,
  },
});

export default ForgotPasswordScreen1;
