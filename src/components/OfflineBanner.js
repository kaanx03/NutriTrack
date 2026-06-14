// src/components/OfflineBanner.js
// Engellemeyen çevrimdışı şeridi — önbellekten/yerelden veri gösterilirken
// "sunucuya ulaşılamadı" sinyalini verir. İçeriği gizlemez.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../theme";

const OfflineBanner = ({
  message = "Can't reach the server — showing saved data",
  onRetry,
}) => (
  <View style={styles.banner}>
    <Ionicons name="cloud-offline-outline" size={16} color={COLORS.textPrimary} />
    <Text style={styles.text} numberOfLines={1}>
      {message}
    </Text>
    {onRetry ? (
      <TouchableOpacity onPress={onRetry} hitSlop={8} accessibilityRole="button">
        <Text style={styles.retry}>Retry</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warning, // amber — daima koyu metin
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  text: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  retry: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: SPACING.sm,
  },
});

export default OfflineBanner;
