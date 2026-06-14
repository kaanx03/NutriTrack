// src/components/ErrorState.js
// Hata / çevrimdışı durumu + "Tekrar dene" butonu. offline=true ise çevrimdışı
// görünümü gösterir.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme";
import Button from "./Button";

const ErrorState = ({ offline = false, message, onRetry, style }) => (
  <View style={[styles.wrap, style]}>
    <View style={styles.iconWrap}>
      <Ionicons
        name={offline ? "cloud-offline-outline" : "alert-circle-outline"}
        size={40}
        color={offline ? COLORS.textTertiary : COLORS.danger}
      />
    </View>
    <Text style={styles.title}>
      {offline ? "You're offline" : "Something went wrong"}
    </Text>
    <Text style={styles.message}>
      {message ||
        (offline
          ? "Check your connection and try again."
          : "Please try again in a moment.")}
    </Text>
    {onRetry ? (
      <Button
        title="Retry"
        variant="secondary"
        fullWidth={false}
        icon="refresh"
        onPress={onRetry}
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: SPACING.xxl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: { ...TYPOGRAPHY.sectionTitle, fontSize: 18, marginBottom: SPACING.sm },
  message: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  action: { marginTop: SPACING.xl },
});

export default ErrorState;
