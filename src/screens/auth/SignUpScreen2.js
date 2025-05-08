// src/screens/auth/SignUpScreen2.js

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

const SignUpScreen2 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();

  const progress = new Animated.Value(0.1428); // 1/7 = ~14.28%

  // Devam butonu fonksiyonu
  const handleContinue = () => {
    if (formData.firstName.trim()) {
      navigation.navigate("SignUp3");
    }
  };

  return (
    <View style={styles.container}>
      {/* Geri Dön Butonu */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, { width: "14.28%" }]} />
        </View>
        <Text style={styles.progressText}>1/7</Text>
      </View>

      {/* Başlık */}
      <Text style={styles.title}>What's your name?</Text>

      {/* İsim Girişi */}
      <TextInput
        style={styles.input}
        value={formData.firstName}
        onChangeText={(text) => updateFormData("firstName", text)}
        placeholder="Enter your name"
        placeholderTextColor="#ccc"
        textAlign="center"
        textAlignVertical="center"
        multiline
      />

      {/* Devam Butonu */}
      <ContinueButton onPress={handleContinue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#474545",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 35,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 25,
  },
  progressBackground: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#63A4F4",
  },
  progressText: {
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  title: {
    fontFamily: "Roboto-Bold",
    fontSize: 24,
    textAlign: "center",
    color: "#333",
    marginBottom: 30,
  },
  input: {
    width: 361,
    height: 129,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    fontSize: 30,
    fontFamily: "Roboto-Medium",
    alignSelf: "center",
    color: "#000",
    marginBottom: 40,
    textAlign: "center", // caret ortalama
    textAlignVertical: "center", // dikey ortalama
    padding: 0, // varsayılan boşlukları sıfırla
  },
});

export default SignUpScreen2;
