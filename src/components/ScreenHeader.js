// src/components/ScreenHeader.js
// Tüm sayfalarda aynı yükseklik, tipografi ve hizalamayı garanti eden header.
// Safe-area'yı kendisi yönetir — kullanan ekran ayrıca paddingTop vermemeli.
//
// Kullanım:
//   <ScreenHeader title="Tracker" onBack={() => navigation.goBack()} />
//   <ScreenHeader title="Insights" onBack={...} rightIcon="refresh" onRightPress={...} />
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from "../theme";

const ScreenHeader = ({
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightContent, // birden fazla sağ aksiyon gerekiyorsa özel node
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.sm },
        transparent ? styles.transparent : styles.solid,
      ]}
    >
      {/* Başlık: buton sayısından bağımsız, her zaman tam merkezde */}
      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Sol: geri butonu (opsiyonel) */}
      {onBack ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}

      {/* Sağ: opsiyonel aksiyon(lar) */}
      {rightContent ? (
        <View style={styles.rightContent}>{rightContent}</View>
      ) : rightIcon ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRightPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={rightIcon} size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  solid: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.header,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleWrap: {
    position: "absolute",
    left: 60,
    right: 60,
    bottom: SPACING.md,
    height: 40,
    justifyContent: "center",
  },
  title: {
    ...TYPOGRAPHY.headerTitle,
    textAlign: "center",
  },
});

export default ScreenHeader;
