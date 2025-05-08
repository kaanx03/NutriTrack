// src/screens/auth/SignUpScreen4.js

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ContinueButton from "../../components/ContinueButton";
import { useSignUp } from "../../context/SignUpContext"; // context import

const SignUpScreen4 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp(); // context erişimi

  const progress = new Animated.Value(0.4285); // 3/7 ≈ 42.85%

  const handleContinue = () => {
    if (formData.gender) {
      navigation.navigate("SignUp5");
    }
  };

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, { width: "42.85%" }]} />
        </View>
        <Text style={styles.progressText}>3/7</Text>
      </View>

      {/* Başlık */}
      <Text style={styles.title}>What's your gender?</Text>

      {/* Cinsiyet Butonları */}
      <View style={styles.genderContainer}>
        {/* Male */}
        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === "male" && {
              backgroundColor: "#63A4F4",
              borderColor: "transparent",
            },
          ]}
          onPress={() => updateFormData("gender", "male")}
        >
          <FontAwesome5
            name="mars"
            size={40}
            color={formData.gender === "male" ? "#fff" : "#474545"}
          />
        </TouchableOpacity>

        {/* Female */}
        <TouchableOpacity
          style={[
            styles.genderButton,
            formData.gender === "female" && {
              backgroundColor: "#F04E8A",
              borderColor: "transparent",
            },
          ]}
          onPress={() => updateFormData("gender", "female")}
        >
          <FontAwesome5
            name="venus"
            size={40}
            color={formData.gender === "female" ? "#fff" : "#474545"}
          />
        </TouchableOpacity>
      </View>

      {/* Prefer not to say */}
      <TouchableOpacity onPress={() => updateFormData("gender", "preferNot")}>
        <Text style={styles.preferText}>Prefer not to say</Text>
      </TouchableOpacity>

      {/* Devam Et Butonu */}
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
  genderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  genderButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#484646",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  preferText: {
    textAlign: "center",
    color: "#474545",
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    marginBottom: 40,
  },
});

export default SignUpScreen4;
