import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../context/SignUpContext";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SignUpScreen7 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();
  const [unit, setUnit] = useState("kg");
  const [weight, setWeight] = useState(formData.weight?.toString() || "");

  const toggleUnit = (newUnit) => {
    if (unit !== newUnit) {
      let converted = weight;
      if (weight) {
        const value = parseFloat(weight.replace(",", "."));
        converted =
          newUnit === "kg"
            ? (value / 2.205).toFixed(1).toString()
            : (value * 2.205).toFixed(1).toString();
      }
      setUnit(newUnit);
      setWeight(converted);
    }
  };

  const handleContinue = () => {
    const numeric = parseFloat(weight.replace(",", "."));
    if (!isNaN(numeric)) {
      const final =
        unit === "lb" ? Math.round(numeric / 2.205) : Math.round(numeric);
      updateFormData("weight", final);
      navigation.navigate("SignUp8");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: "85.7%" }]} />
        </View>
        <Text style={styles.progressText}>6/7</Text>
      </View>

      <Text style={styles.title}>What's your current weight?</Text>

      {/* Unit Toggle */}
      <View style={styles.unitToggleContainer}>
        {["kg", "lb"].map((u) => (
          <TouchableOpacity
            key={u}
            style={[styles.unitButton, unit === u && styles.activeUnitButton]}
            onPress={() => toggleUnit(u)}
          >
            <Text
              style={[styles.unitText, unit === u && styles.activeUnitText]}
            >
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Field */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={weight}
            keyboardType="decimal-pad"
            onChangeText={(text) => {
              const clean = text
                .replace(",", ".")
                .replace(/[^0-9.]/g, "")
                .replace(/^(\d{1,3})(\.\d{0,1})?.*$/, "$1$2");
              setWeight(clean);
            }}
            textAlign="left"
            autoFocus={true}
            maxLength={5}
          />
          <Text style={styles.unitDisplay}>{unit}</Text>
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#474545",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#4285F4",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#999",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
  },
  unitToggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  unitButton: {
    width: 80,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  activeUnitButton: {
    backgroundColor: "#4285F4",
  },
  unitText: {
    fontSize: 16,
    color: "#4285F4",
  },
  activeUnitText: {
    color: "#fff",
  },
  inputWrapper: {
    alignItems: "center",
    marginBottom: SCREEN_HEIGHT * 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "baseline",
    borderBottomWidth: 2,
    borderColor: "#ccc",
    width: 140,
    justifyContent: "center",
  },
  input: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
    paddingVertical: 10,
    paddingHorizontal: 0,
    width: 100,
  },
  unitDisplay: {
    fontSize: 28,
    marginLeft: 4,
    color: "#000",
  },
  buttonWrapper: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  continueButton: {
    backgroundColor: "#474747",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SignUpScreen7;
