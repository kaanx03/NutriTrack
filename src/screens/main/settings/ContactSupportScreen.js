// src/screens/main/settings/ContactSupportScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

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
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Contact Support</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.optionsContainer}>
          {contactOptions.map((option, index) => renderOption(option, index))}
        </View>
      </ScrollView>

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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f8f9fa",
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
  scrollContent: {
    paddingBottom: 20,
  },
  optionsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
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
    borderBottomColor: "#f0f0f0",
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

export default ContactSupportScreen;
