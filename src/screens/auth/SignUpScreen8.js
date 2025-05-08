import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../context/SignUpContext";

const { width } = Dimensions.get("window");

const SignUpScreen8 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();

  const [selectedActivity, setSelectedActivity] = useState(
    formData.activityLevel || null
  );

  const activityLevels = [
    { id: 1, label: "Sedentary", emoji: "📏" },
    { id: 2, label: "Lightly Active", emoji: "🚶‍♂️" },
    { id: 3, label: "Moderately Active", emoji: "🏃‍♂️" },
    { id: 4, label: "Very Active", emoji: "🏋️‍♂️" },
    { id: 5, label: "Super Active", emoji: "🧘‍♂️" },
  ];

  const handleSelect = (id) => {
    setSelectedActivity(id);
    updateFormData("activityLevel", id);
  };

  const handleContinue = () => {
    if (selectedActivity) {
      navigation.navigate("SignUp9");
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

      {/* İlerleme Göstergesi */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
        <Text style={styles.progressText}>7/7</Text>
      </View>

      {/* Başlık */}
      <Text style={styles.title}>What's your activity level?</Text>

      {/* Aktivite Düzeyi Seçimi */}
      <ScrollView contentContainerStyle={styles.goalsContainer}>
        {activityLevels.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.goalButton,
              selectedActivity === activity.id && styles.activeGoalButton,
            ]}
            onPress={() => handleSelect(activity.id)}
          >
            <View style={styles.goalContent}>
              <Text style={styles.emoji}>{activity.emoji}</Text>
              <Text style={styles.goalLabel}>{activity.label}</Text>
            </View>
            {selectedActivity === activity.id && (
              <AntDesign
                name="check"
                size={20}
                color="#7CB342"
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Devam Butonu */}
      <TouchableOpacity
        style={[styles.continueButton, !selectedActivity && { opacity: 0.5 }]}
        onPress={handleContinue}
        disabled={!selectedActivity}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
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
  goalsContainer: {
    paddingBottom: 20,
  },
  goalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  activeGoalButton: {
    borderColor: "#7CB342",
    backgroundColor: "#F1F8E9",
  },
  goalContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  goalLabel: {
    fontSize: 16,
    color: "#000",
  },
  checkIcon: {
    marginLeft: 10,
  },
  continueButton: {
    backgroundColor: "#474747",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SignUpScreen8;
