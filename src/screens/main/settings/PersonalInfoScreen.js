// src/screens/main/settings/PersonalInfoScreen.js - Fixed Dropdowns
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useSignUp } from "../../../context/SignUpContext";
import { useAuth } from "../../../context/AuthContext";
import BottomNavigation from "../../../components/BottomNavigation";
import OptionPicker from "../../../components/OptionPicker";
import { showToast } from "../../../components/AppToast";
import DatePickerModal from "../../../components/DatePickerModal";
import PhotoStorage from "../../../services/PhotoStorage";
import { COLORS } from "../../../theme";

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();
  const { user } = useAuth();

  // Profil fotoğrafı (lokal depolama)
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (user?.id) {
      PhotoStorage.getProfilePhoto(user.id).then(setProfilePhoto);
    }
  }, [user?.id]);

  const pickerOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  };

  const applyPickedPhoto = async (result) => {
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const meta = await PhotoStorage.saveProfilePhoto(
      user.id,
      result.assets[0].uri
    );
    setProfilePhoto(meta);
    showToast("Profile photo updated", "success");
  };

  const handleChangePhoto = () => {
    if (!user?.id) return;
    const buttons = [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            showToast("Camera permission denied", "error");
            return;
          }
          applyPickedPhoto(await ImagePicker.launchCameraAsync(pickerOptions));
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            showToast("Photo library permission denied", "error");
            return;
          }
          applyPickedPhoto(
            await ImagePicker.launchImageLibraryAsync(pickerOptions)
          );
        },
      },
    ];
    if (profilePhoto) {
      buttons.push({
        text: "Remove Photo",
        style: "destructive",
        onPress: async () => {
          await PhotoStorage.deleteProfilePhoto(user.id);
          setProfilePhoto(null);
          showToast("Profile photo removed", "info");
        },
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Profile Photo", undefined, buttons);
  };

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "Male",
    dateOfBirth: "",
    height: "",
    weight: "",
    activityLevel: "",
  });

  const [originalUserInfo, setOriginalUserInfo] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const [isEditing, setIsEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phoneNumber: false,
    gender: false,
    dateOfBirth: false,
    height: false,
    weight: false,
    activityLevel: false,
  });

  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // SignUp verilerini yükle
  useEffect(() => {
    if (formData) {
      const initialInfo = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        email: formData.email || "",
        phoneNumber: "",
        gender: formData.gender
          ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
          : "Male",
        dateOfBirth: formatBirthDate(formData),
        height: formData.height ? formData.height.toString() : "",
        weight: formData.weight ? formData.weight.toString() : "",
        activityLevel: getActivityLevelText(formData.activityLevel),
      };
      setUserInfo(initialInfo);
      setOriginalUserInfo({ ...initialInfo });
    }
  }, [formData]);

  // Changes detection
  useEffect(() => {
    const changed = Object.keys(userInfo).some(
      (key) => userInfo[key] !== originalUserInfo[key]
    );
    setHasChanges(changed);
  }, [userInfo, originalUserInfo]);

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
    return (
      activityLevels[level] || "Moderate (Moderate exercise 3-5 days/week)"
    );
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
    // Close all dropdowns when editing starts
    setShowActivityDropdown(false);
    setShowGenderDropdown(false);
    setShowDatePicker(false);

    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Handle height and weight - remove units and non-numeric characters except digits
    if (field === "height" || field === "weight") {
      processedValue = value.replace(/[^0-9]/g, "");
    }

    setUserInfo((prev) => ({
      ...prev,
      [field]: processedValue,
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

  const saveAllChanges = async () => {
    try {
      // Update context with all changes
      updateFormData("firstName", userInfo.firstName);
      updateFormData("lastName", userInfo.lastName);
      updateFormData("email", userInfo.email);
      updateFormData("gender", userInfo.gender.toLowerCase());

      if (userInfo.height) {
        const heightValue = parseInt(userInfo.height.replace(/[^0-9]/g, ""));
        updateFormData("height", heightValue);
      }

      if (userInfo.weight) {
        const weightValue = parseInt(userInfo.weight.replace(/[^0-9]/g, ""));
        updateFormData("weight", weightValue);
      }

      if (userInfo.dateOfBirth) {
        const [day, month, year] = userInfo.dateOfBirth.split("-");
        updateFormData("day", day);
        updateFormData("month", month);
        updateFormData("year", year);
      }

      // Update activity level
      const activityIndex = activityOptions.findIndex(
        (option) => option === userInfo.activityLevel
      );
      if (activityIndex !== -1) {
        updateFormData("activityLevel", activityIndex + 1);
      }

      // TODO: Add database save functionality here
      // await saveToDatabase(userInfo);

      setOriginalUserInfo({ ...userInfo });
      setHasChanges(false);
      showToast("Your information has been saved", "success");
    } catch (error) {
      Alert.alert("Error", "Failed to save information. Please try again.");
      console.error("Save error:", error);
    }
  };

  const cancelChanges = () => {
    setUserInfo({ ...originalUserInfo });
    setIsEditing({
      firstName: false,
      lastName: false,
      email: false,
      phoneNumber: false,
      gender: false,
      dateOfBirth: false,
      height: false,
      weight: false,
      activityLevel: false,
    });
    setShowActivityDropdown(false);
    setShowGenderDropdown(false);
    setShowDatePicker(false);
    setHasChanges(false);
  };

  const toggleGenderDropdown = () => {
    setShowActivityDropdown(false); // Close other dropdown
    setShowGenderDropdown(!showGenderDropdown);
  };

  const selectGender = (option) => {
    setUserInfo((prev) => ({ ...prev, gender: option }));
    setShowGenderDropdown(false);
  };

  const toggleActivityDropdown = () => {
    setShowGenderDropdown(false); // Close other dropdown
    setShowActivityDropdown(!showActivityDropdown);
  };

  const selectActivityLevel = (option) => {
    setUserInfo((prev) => ({ ...prev, activityLevel: option }));
    setShowActivityDropdown(false);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateSelect = (selectedDate) => {
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const year = selectedDate.getFullYear().toString();

    const dateString = `${day}-${month}-${year}`;
    setUserInfo((prev) => ({ ...prev, dateOfBirth: dateString }));
    setShowDatePicker(false);
  };

  const renderInfoField = (
    label,
    field,
    value,
    editable = true,
    placeholder = "",
    keyboardType = "default"
  ) => {
    const isCurrentlyEditing = isEditing[field];

    // Display value with units for height and weight
    let displayValue = value;
    if (field === "height" && value) {
      displayValue = `${value} cm`;
    } else if (field === "weight" && value) {
      displayValue = `${value} kg`;
    }

    return (
      <View style={styles.infoField}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {isCurrentlyEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={value}
              onChangeText={(text) => handleInputChange(field, text)}
              onBlur={() => {
                handleSave(field, userInfo[field]);
              }}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
              keyboardType={keyboardType}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => {
              if (field === "gender") {
                toggleGenderDropdown();
              } else if (field === "dateOfBirth") {
                toggleDatePicker();
              } else if (field === "activityLevel") {
                toggleActivityDropdown();
              } else if (editable) {
                handleEdit(field);
              }
            }}
            disabled={!editable}
          >
            {field === "firstName" && (
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "lastName" && (
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "email" && (
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textSecondary}
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
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "weight" && (
              <Ionicons
                name="barbell-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "activityLevel" && (
              <Ionicons
                name="fitness-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "gender" && (
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}
            {field === "dateOfBirth" && (
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.fieldIcon}
              />
            )}

            <Text style={[styles.fieldValue, !value && styles.placeholderText]}>
              {displayValue || placeholder}
            </Text>

            {editable && (field === "gender" || field === "activityLevel") && (
              <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
            )}
            {editable && field === "dateOfBirth" && (
              <Ionicons name="calendar-outline" size={20} color="#C7C7CC" />
            )}
            {editable &&
              field !== "gender" &&
              field !== "activityLevel" &&
              field !== "dateOfBirth" && (
                <Ionicons name="create-outline" size={20} color="#C7C7CC" />
              )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
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
            {profilePhoto ? (
              <Image
                source={{ uri: `${profilePhoto.uri}?t=${profilePhoto.updatedAt}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={COLORS.avatarIcon} />
              </View>
            )}
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={handleChangePhoto}
            >
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.infoSection}>
          {renderInfoField(
            "First Name",
            "firstName",
            userInfo.firstName,
            true,
            "Enter your first name"
          )}
          {renderInfoField(
            "Last Name",
            "lastName",
            userInfo.lastName,
            true,
            "Enter your last name"
          )}
          {renderInfoField(
            "Email",
            "email",
            userInfo.email,
            true,
            "Enter your email address",
            "email-address"
          )}
          {renderInfoField(
            "Phone Number",
            "phoneNumber",
            userInfo.phoneNumber,
            true,
            "+90 (5__) ___-__-__",
            "phone-pad"
          )}
          {renderInfoField("Gender", "gender", userInfo.gender)}
          {renderInfoField(
            "Date of Birth",
            "dateOfBirth",
            userInfo.dateOfBirth,
            true,
            "Select your birth date"
          )}
          {renderInfoField(
            "Height",
            "height",
            userInfo.height,
            true,
            "Enter height (cm)",
            "numeric"
          )}
          {renderInfoField(
            "Weight",
            "weight",
            userInfo.weight,
            true,
            "Enter weight (kg)",
            "numeric"
          )}
          {renderInfoField(
            "Activity Level",
            "activityLevel",
            userInfo.activityLevel,
            true,
            "Select your activity level"
          )}
        </View>

        {/* Gender & Activity seçimleri artık ortalanmış OptionPicker modalında */}
        <OptionPicker
          visible={showGenderDropdown}
          title="Select Gender"
          options={genderOptions}
          selected={userInfo.gender}
          onSelect={selectGender}
          onClose={() => setShowGenderDropdown(false)}
        />
        <OptionPicker
          visible={showActivityDropdown}
          title="Select Activity Level"
          options={activityOptions}
          selected={userInfo.activityLevel}
          onSelect={selectActivityLevel}
          onClose={() => setShowActivityDropdown(false)}
        />

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

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelChanges}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveAllChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Profile" />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={
          userInfo.dateOfBirth
            ? (() => {
                const [day, month, year] = userInfo.dateOfBirth.split("-");
                return new Date(
                  parseInt(year),
                  parseInt(month) - 1,
                  parseInt(day)
                );
              })()
            : new Date()
        }
        onDateSelect={handleDateSelect}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileImageContainer: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  fieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    minHeight: 50,
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
    backgroundColor: COLORS.danger,
    borderRadius: 3,
  },
  flagText: {
    fontSize: 12,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  editContainer: {
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  editInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 50,
  },
  // Dropdown Overlay Styles
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    maxHeight: "80%",
    width: "100%",
    paddingVertical: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6.84,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedDropdownItem: {
    backgroundColor: "#f0f8f0",
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectedDropdownText: {
    color: COLORS.success,
    fontWeight: "500",
  },
  dropdownCloseButton: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dropdownCloseText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  calculatedSection: {
    backgroundColor: COLORS.surface,
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  calculatedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  calculatedLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.success,
  },
  bottomSpacing: {
    height: 100,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default PersonalInfoScreen;
