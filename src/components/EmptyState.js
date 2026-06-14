// src/components/EmptyState.js
// Boş durum: ikon + başlık + açıklama (+ opsiyonel aksiyon butonu).
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../theme";
import Button from "./Button";

const EmptyState = ({
  icon = "file-tray-outline",
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.wrap, style]}>
    <View style={styles.iconWrap}>
      <Ionicons name={icon} size={40} color={COLORS.avatarIcon} />
    </View>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <Button
        title={actionLabel}
        variant="secondary"
        fullWidth={false}
        onPress={onAction}
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
    backgroundColor: COLORS.avatarBg,
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

export default EmptyState;
