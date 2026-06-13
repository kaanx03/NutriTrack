// src/components/ListRow.js
// Ayarlar/menü satırı: sol ikon (emoji veya Ionicons) + başlık/alt başlık +
// sağ aksesuar (chevron varsayılan, custom node veya switch).
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../theme";

const ListRow = ({
  title,
  subtitle,
  emoji, // sol tarafta emoji ikon
  ioniconName, // veya Ionicons adı
  iconColor = COLORS.textPrimary,
  right, // custom sağ node (örn. <Switch/>); verilmezse chevron
  showChevron = true,
  onPress,
  destructive = false,
  style,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={title}
    >
      <View style={styles.left}>
        {emoji ? (
          <View style={styles.iconWrap}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        ) : ioniconName ? (
          <View style={styles.iconWrap}>
            <Ionicons
              name={ioniconName}
              size={24}
              color={destructive ? COLORS.danger : iconColor}
            />
          </View>
        ) : null}
        <View style={styles.textWrap}>
          <Text
            style={[styles.title, destructive && styles.destructive]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right !== undefined ? (
        right
      ) : showChevron && !destructive ? (
        <Ionicons name="chevron-forward" size={20} color={COLORS.avatarIcon} />
      ) : null}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  emoji: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  destructive: {
    color: COLORS.danger,
  },
});

export default ListRow;
