// src/components/Card.js
// Standart beyaz kart yüzeyi (gölge + radius + padding). Ekranlardaki tekrar
// eden kart View'lerinin yerine.
import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, SHADOWS } from "../theme";

const Card = ({ children, style, padded = true }) => (
  <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.card,
  },
  padded: {
    padding: SPACING.xl,
  },
});

export default Card;
