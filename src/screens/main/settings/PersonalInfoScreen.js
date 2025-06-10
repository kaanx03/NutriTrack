// src/screens/main/settings/PersonalInfoScreen.js - Fixed
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../../context/SignUpContext";
import BottomNavigation from "../../../components/BottomNavigation";

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    phoneNumber: "+90 (530) 399-32-46",
    gender: "Male",
    dateOfBirth: "",
    height: "",
    weight: "",
    activityLevel: "",
  });

  const [isEditing, setIsEditing] = useState({
    fullName: false,
    email: false,
    phoneNumber: false,
    gender: false,
    dateOfBirth: false,
    height: false,
    weight: false,
    activityLevel: false,
  });

  // SignUp verilerini yükle
  useEffect(() => {
    if (formData) {
      setUserInfo({
        fullName: `${formData.firstName || ""} ${
          formData.lastName || ""
        }`.trim(),
        email: formData.email || "",
        phoneNumber: "+90 (530) 399-32-46",
        gender: formData.gender
          ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
          : "Male",
        dateOfBirth: formatBirthDate(formData),
        height: formData.height ? `${formData.height} cm` : "",
        weight: formData.weight ? `${formData.weight} kg` : "",
        activityLevel: getActivityLevelText(formData.activityLevel),
      });
    }
  }, [formData]);

  const formatBirthDate = (data) => {
    if (data.day && data.month && data.year) {
      return `${data.day.padStart(2, "0")}-${data.month.padStart(2, "0")}-${
        data.year
      }`;
    } else if (data.birthDate) {
      const date = new Date(data.birthDate);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    return "";
  };

  const getActivityLevelText = (level) => {
    const activityLevels = {
      1: "Sedentary (Little/no exercise)",
      2: "Light (Light exercise 1-3 days/week)",
      3: "Moderate (Moderate exercise 3-5 days/week)",
      4: "Active (Hard exercise 6-7 days/week)",
      5: "Very Active (Very hard exercise & physical job)",
    };
    return activityLevels[level] || "Moderate";
  };

  const genderOptions = ["Male", "Female", "Other"];
  const activityOptions = [
    "Sedentary (Little/no exercise)",
    "Light (Light exercise 1-3 days/week)",
    "Moderate (Moderate exercise 3-5 days/week)",
    "Active (Hard exercise 6-7 days/week)",
    "Very Active (Very hard exercise & physical job)",
  ];

  const handleEdit = (field) => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // SignUp context'ini de güncelle
    if (field === "fullName") {
      const names = value.split(" ");
      updateFormData("firstName", names[0] || "");
      updateFormData("lastName", names.slice(1).join(" ") || "");
    } else if (field === "email") {
      updateFormData("email", value);
    } else if (field === "gender") {
      updateFormData("gender", value.toLowerCase());
    } else if (field === "height") {
      const heightValue = value.replace(/[^0-9]/g, "");
      updateFormData("height", heightValue);
    } else if (field === "weight") {
      const weightValue = value.replace(/[^0-9]/g, "");
      updateFormData("weight", weightValue);
    }

    setIsEditing((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  const showGenderPicker = () => {
    Alert.alert(
      "Select Gender",
      "",
      genderOptions
        .map((option) => ({
          text: option,
          onPress: () => handleSave("gender", option),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showActivityPicker = () => {
    Alert.alert(
      "Select Activity Level",
      "",
      activityOptions
        .map((option, index) => ({
          text: option,
          onPress: () => {
            updateFormData("activityLevel", (index + 1).toString());
            handleSave("activityLevel", option);
          },
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showDatePicker = () => {
    Alert.alert(
      "Date Picker",
      "In a real app, this would open a date picker component",
      [
        {
          text: "OK",
          onPress: () => {},
        },
      ]
    );
  };

  const renderInfoField = (label, field, value, editable = true, unit = "") => {
    const isCurrentlyEditing = isEditing[field];

    return (
      <View style={styles.infoField}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {isCurrentlyEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={value.replace(unit, "")}
              onChangeText={(text) => {
                const newValue = unit ? `${text}${unit}` : text;
                setUserInfo((prev) => ({ ...prev, [field]: newValue }));
              }}
              onBlur={() => handleEdit(field)}
              autoFocus
              keyboardType={
                field === "height" || field === "weight" ? "numeric" : "default"
              }
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => {
              if (field === "gender") {
                showGenderPicker();
              } else if (field === "dateOfBirth") {
                showDatePicker();
              } else if (field === "activityLevel") {
                showActivityPicker();
              } else if (editable) {
                handleEdit(field);
              }
            }}
            disabled={!editable}
          >
            {field === "email" && (
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.fieldIcon}
              />
            )}
            {field === "phoneNumber" && (
              <View style={styles.phoneContainer}>
                <View style={styles.countryFlag}>
                  <Text style={styles.flagText}>🇹🇷</Text>
                </View>
              </View>
            )}
            {field === "height" && (
              <Ionicons
                name="resize-outline"
                size={20}
                color="#666"
                style={styles.fieldIcon}
              />
            )}
            {field === "weight" && (
              <Ionicons
                name="barbell-outline"
                size={20}
                color="#666"
                style={styles.fieldIcon}
              />
            )}
            {field === "activityLevel" && (
              <Ionicons
                name="fitness-outline"
                size={20}
                color="#666"
                style={styles.fieldIcon}
              />
            )}

            <Text style={styles.fieldValue}>{value}</Text>

            {editable && (field === "gender" || field === "activityLevel") && (
              <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
            )}
            {editable && field === "dateOfBirth" && (
              <Ionicons name="calendar-outline" size={20} color="#C7C7CC" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Personal Info</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.infoSection}>
          {renderInfoField("Full Name", "fullName", userInfo.fullName)}
          {renderInfoField("Email", "email", userInfo.email)}
          {renderInfoField("Phone Number", "phoneNumber", userInfo.phoneNumber)}
          {renderInfoField("Gender", "gender", userInfo.gender)}
          {renderInfoField(
            "Date of Birth",
            "dateOfBirth",
            userInfo.dateOfBirth
          )}
          {renderInfoField("Height", "height", userInfo.height, true, " cm")}
          {renderInfoField("Weight", "weight", userInfo.weight, true, " kg")}
          {renderInfoField(
            "Activity Level",
            "activityLevel",
            userInfo.activityLevel
          )}
        </View>

        {/* Calculated Data Section */}
        {formData && formData.calculatedPlan && (
          <View style={styles.calculatedSection}>
            <Text style={styles.sectionTitle}>Your Calculated Plan</Text>
            <View style={styles.calculatedItem}>
              <Text style={styles.calculatedLabel}>Daily Calories</Text>
              <Text style={styles.calculatedValue}>
                {formData.calculatedPlan.dailyCalories} kcal
              </Text>
            </View>
            <View style={styles.calculatedItem}>
              <Text style={styles.calculatedLabel}>Carbs</Text>
              <Text style={styles.calculatedValue}>
                {formData.calculatedPlan.macros.carbs}g
              </Text>
            </View>
            <View style={styles.calculatedItem}>
              <Text style={styles.calculatedLabel}>Protein</Text>
              <Text style={styles.calculatedValue}>
                {formData.calculatedPlan.macros.protein}g
              </Text>
            </View>
            <View style={styles.calculatedItem}>
              <Text style={styles.calculatedLabel}>Fat</Text>
              <Text style={styles.calculatedValue}>
                {formData.calculatedPlan.macros.fat}g
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  infoField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  fieldIcon: {
    marginRight: 12,
  },
  phoneContainer: {
    marginRight: 12,
  },
  countryFlag: {
    width: 24,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E74C3C",
    borderRadius: 3,
  },
  flagText: {
    fontSize: 12,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  editContainer: {
    borderWidth: 1,
    borderColor: "#63A4F4",
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  editInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
  },
  calculatedSection: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  calculatedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  calculatedLabel: {
    fontSize: 16,
    color: "#666",
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A1CE50",
  },
});

export default PersonalInfoScreen;
