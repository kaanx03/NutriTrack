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

const SignUpScreen6 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();
  const [unit, setUnit] = useState("cm");
  const [height, setHeight] = useState(formData.height?.toString() || "");

  const toggleUnit = (newUnit) => {
    if (unit !== newUnit) {
      let converted = height;
      if (height) {
        const value = parseFloat(height);
        converted =
          newUnit === "cm"
            ? Math.round(value * 2.54).toString()
            : Math.round(value / 2.54).toString();
      }
      setUnit(newUnit);
      setHeight(converted);
    }
  };

  const handleContinue = () => {
    const numericHeight = parseFloat(height);
    if (!isNaN(numericHeight)) {
      const finalHeight =
        unit === "inch"
          ? Math.round(numericHeight * 2.54)
          : Math.round(numericHeight);
      updateFormData("height", finalHeight);
      navigation.navigate("SignUp7");
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
          <View style={[styles.progressFill, { width: "71.4%" }]} />
        </View>
        <Text style={styles.progressText}>5/7</Text>
      </View>

      <Text style={styles.title}>How tall are you?</Text>

      {/* Unit Toggle */}
      <View style={styles.unitToggleContainer}>
        <TouchableOpacity
          style={[styles.unitButton, unit === "cm" && styles.activeUnitButton]}
          onPress={() => toggleUnit("cm")}
        >
          <Text
            style={[styles.unitText, unit === "cm" && styles.activeUnitText]}
          >
            cm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.unitButton,
            unit === "inch" && styles.activeUnitButton,
          ]}
          onPress={() => toggleUnit("inch")}
        >
          <Text
            style={[styles.unitText, unit === "inch" && styles.activeUnitText]}
          >
            inch
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Field */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={height}
            keyboardType="number-pad"
            onChangeText={(text) => {
              const onlyNumbers = text.replace(/[^0-9]/g, "");
              setHeight(onlyNumbers);
            }}
            textAlign="left"
            autoFocus={true}
            maxLength={3} // <-- sadece 3 karakter girişi
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
  },
  input: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
    paddingVertical: 10,
    paddingHorizontal: 0,
    minWidth: 80,
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

export default SignUpScreen6;
