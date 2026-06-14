// src/screens/auth/SignUpScreen3.js

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ContinueButton from "../../components/ContinueButton";
import { useSignUp } from "../../context/SignUpContext"; // context import
import { COLORS } from "../../theme";

const SignUpScreen3 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp(); // global state erişimi


  const handleContinue = () => {
    if (formData.lastName.trim()) {
      navigation.navigate("SignUp4");
    }
  };

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color={COLORS.surface} />
      </TouchableOpacity>

      {/* İlerleme Göstergesi */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, { width: "28.57%" }]} />
        </View>
        <Text style={styles.progressText}>2/7</Text>
      </View>

      {/* Soru Başlığı */}
      <Text style={styles.title}>What's your surname?</Text>

      {/* Soyisim Girişi */}
      <TextInput
        style={styles.input}
        value={formData.lastName}
        onChangeText={(text) => updateFormData("lastName", text)}
        placeholder="Enter your surname"
        placeholderTextColor={COLORS.borderStrong}
        textAlign="center"
        textAlignVertical="center"
        multiline
      />

      {/* Devam Et Butonu */}
      <ContinueButton onPress={handleContinue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 25,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: "right",
    marginTop: 4,
  },
  title: {
    fontFamily: "Roboto-Bold",
    fontSize: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
    marginBottom: 30,
  },
  input: {
    width: 361,
    height: 129,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceMuted,
    fontSize: 30,
    fontFamily: "Roboto-Medium",
    textAlign: "center",
    textAlignVertical: "center",
    padding: 0,
    alignSelf: "center",
    color: COLORS.textPrimary,
    marginBottom: 40,
  },
});

export default SignUpScreen3;
