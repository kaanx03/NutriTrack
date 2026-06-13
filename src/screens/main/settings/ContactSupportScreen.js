// src/screens/main/settings/ContactSupportScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const ContactSupportScreen = () => {
  const navigation = useNavigation();

  const handleOpenURL = async (url, platform) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          `Cannot open ${platform}. Please make sure the app is installed.`
        );
      }
    } catch (error) {
      Alert.alert("Error", `Failed to open ${platform}`);
    }
  };

  const contactOptions = [
    {
      id: "customer-support",
      title: "Customer Support",
      iconType: "ionicon",
      icon: "headset",
      iconColor: "#4CAF50",
      action: () => {
        Alert.alert(
          "Customer Support",
          "Choose how you'd like to contact us:",
          [
            {
              text: "Email",
              onPress: () =>
                handleOpenURL("mailto:support@nutritrack.com", "Email"),
            },
            {
              text: "Phone",
              onPress: () => handleOpenURL("tel:+1234567890", "Phone"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      },
    },
    {
      id: "website",
      title: "Website",
      iconType: "png",
      iconPath: require("../../../../assets/icons/website.png"),
      action: () => handleOpenURL("https://nutritrack.com", "Website"),
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      iconType: "png",
      iconPath: require("../../../../assets/icons/whatsapp.png"),
      action: () =>
        handleOpenURL("whatsapp://send?phone=1234567890", "WhatsApp"),
    },
    {
      id: "facebook",
      title: "Facebook",
      iconType: "png",
      iconPath: require("../../../../assets/icons/facebook.png"),
      action: () =>
        handleOpenURL("https://facebook.com/nutritrack", "Facebook"),
    },
    {
      id: "twitter",
      title: "X",
      iconType: "png",
      iconPath: require("../../../../assets/icons/twitter.png"),
      action: () => handleOpenURL("https://twitter.com/nutritrack", "X"),
    },
    {
      id: "instagram",
      title: "Instagram",
      iconType: "png",
      iconPath: require("../../../../assets/icons/instagram.png"),
      action: () =>
        handleOpenURL("https://instagram.com/nutritrack", "Instagram"),
    },
  ];

  const renderOption = (option, index) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionItem,
        index === contactOptions.length - 1 && styles.lastOptionItem,
      ]}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View style={styles.iconContainer}>
          {option.iconType === "png" ? (
            <Image
              source={option.iconPath}
              style={styles.iconImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name={option.icon} size={24} color={option.iconColor} />
          )}
        </View>
        <Text style={styles.optionTitle}>{option.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.disabledText} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Contact Support"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.optionsContainer}>
          {contactOptions.map((option, index) => renderOption(option, index))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Updated to use component */}
      <BottomNavigation activeTab="Profile" />
    </View>
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
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.surfaceMuted,
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
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  optionsContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
});

export default ContactSupportScreen;
