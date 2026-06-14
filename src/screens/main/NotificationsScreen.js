// src/screens/main/NotificationsScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenHeader from "../../components/ScreenHeader";
import EmptyState from "../../components/EmptyState";
import { COLORS } from "../../theme";

// Not: Uygulamada henüz sunucu taraflı bildirim sistemi yok — dürüst boş durum.
const NotificationsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <EmptyState
        icon="notifications-outline"
        title="No notifications yet"
        message="We'll let you know here about your progress, goals and reminders."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default NotificationsScreen;
