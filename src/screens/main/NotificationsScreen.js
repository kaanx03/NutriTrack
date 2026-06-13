// src/screens/main/NotificationsScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ScreenHeader from "../../components/ScreenHeader";
import { COLORS } from "../../theme";

// Not: Uygulamada henüz sunucu taraflı bildirim sistemi yok. Daha önce burada
// sabit örnek veri (Ocak 2025 tarihli, var olmayan "Daily Step Goal" vb.)
// gösteriliyordu — kaldırıldı. Gerçek bildirim akışı eklenene kadar dürüst
// bir boş durum gösteriyoruz.
const NotificationsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />

      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="notifications-outline" size={40} color={COLORS.avatarIcon} />
        </View>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          We'll let you know here about your progress, goals and reminders.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default NotificationsScreen;
