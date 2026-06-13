// src/components/SectionHeader.js
// Bölüm başlığı + opsiyonel sağ aksiyon (örn. "View All").
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme";

const SectionHeader = ({
  title,
  actionLabel,
  onActionPress,
  actionColor = COLORS.primary,
  center = false,
  style,
}) => (
  <View style={[styles.row, center && styles.center, style]}>
    <Text style={[TYPOGRAPHY.sectionTitle, center && styles.centerText]}>
      {title}
    </Text>
    {actionLabel && onActionPress ? (
      <TouchableOpacity
        onPress={onActionPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={[styles.action, { color: actionColor }]}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  center: {
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SectionHeader;
