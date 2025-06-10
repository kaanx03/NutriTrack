// src/screens/main/settings/PersonalInfoScreen.js
import React, { useState } from "react";
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

const PersonalInfoScreen = () => {
  const navigation = useNavigation();

  const [userInfo, setUserInfo] = useState({
    fullName: "Andrew Ainsley",
    email: "andrew.ainsley@yourdomain.com",
    phoneNumber: "+90 (530) 399-32-46",
    gender: "Male",
    dateOfBirth: "19-12-1999",
  });

  const [isEditing, setIsEditing] = useState({
    fullName: false,
    email: false,
    phoneNumber: false,
    gender: false,
    dateOfBirth: false,
  });

  const genderOptions = ["Male", "Female", "Other"];

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

  const showDatePicker = () => {
    // In a real app, you would use a proper date picker
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

  const renderInfoField = (label, field, value, editable = true) => {
    const isCurrentlyEditing = isEditing[field];

    return (
      <View style={styles.infoField}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {isCurrentlyEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={value}
              onChangeText={(text) =>
                setUserInfo((prev) => ({ ...prev, [field]: text }))
              }
              onBlur={() => handleEdit(field)}
              autoFocus
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

            <Text style={styles.fieldValue}>{value}</Text>

            {editable && field === "gender" && (
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
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Tracker")}
        >
          <Ionicons name="grid-outline" size={24} color="#999" />
          <Text style={styles.navText}>Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Insights")}
        >
          <Ionicons name="stats-chart-outline" size={24} color="#999" />
          <Text style={styles.navText}>Insights</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Articles")}
        >
          <Ionicons name="newspaper-outline" size={24} color="#999" />
          <Text style={styles.navText}>Articles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="person" size={24} color="#63A4F4" />
          <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  bottomNav: {
    flexDirection: "row",
    height: 80,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#63A4F4",
  },
  navText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#63A4F4",
  },
});

export default PersonalInfoScreen;
