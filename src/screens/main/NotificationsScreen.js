// src/screens/main/NotificationsScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { sampleNotifications } from "../../data/sampleNotifications";

const NotificationsScreen = () => {
  const navigation = useNavigation();

  // Function to render the appropriate icon based on type
  const renderIcon = (iconType) => {
    let iconName;

    switch (iconType) {
      case "crown":
        iconName = "ribbon-outline"; // Using ribbon instead of crown
        break;
      case "trophy":
        iconName = "trophy-outline";
        break;
      case "article":
        iconName = "document-text-outline";
        break;
      case "bolt":
        iconName = "flash-outline";
        break;
      case "shield":
        iconName = "shield-outline";
        break;
      case "gift":
        iconName = "gift-outline";
        break;
      default:
        iconName = "notifications-outline";
    }

    return (
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color="#333" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {sampleNotifications.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={styles.dateHeader}>{section.date}</Text>

            {section.notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                activeOpacity={0.7}
              >
                {renderIcon(notification.icon)}

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {notification.isNew && <View style={styles.newIndicator} />}
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>

                <TouchableOpacity style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
  },
  newIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A1CE50",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  chevronContainer: {
    padding: 10,
  },
});

export default NotificationsScreen;
