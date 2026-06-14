// src/components/Button.js
// Tek tip birincil eylem butonu. Tüm ekranlardaki ad-hoc butonların yerine.
// variant: primary | secondary | tertiary | danger
// color: solid variant'larda arka plan rengini override eder (domain rengi için,
//        örn. <Button color={COLORS.weight} ... />). Belirtilmezse primary mavi.
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, TOUCH_TARGET } from "../theme";
import { hapticLight } from "../utils/haptics";
import { useReducedMotion } from "../utils/motion";

// TouchableOpacity'yi animasyonlu yap — sarmalayıcı eklemeden, layout aynı kalır.
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Button = ({
  title,
  onPress,
  variant = "primary",
  color, // solid variant'lar için arka plan override
  loading = false,
  disabled = false,
  icon, // opsiyonel Ionicons adı
  fullWidth = true,
  style,
  textStyle,
}) => {
  const isSolid = variant === "primary" || variant === "danger";
  const solidBg =
    color || (variant === "danger" ? COLORS.danger : COLORS.primary);

  const containerStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    isSolid && { backgroundColor: solidBg },
    variant === "secondary" && styles.secondary,
    variant === "tertiary" && styles.tertiary,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const fg = isSolid
    ? COLORS.textOnColor
    : variant === "danger"
    ? COLORS.danger
    : color || COLORS.primary;

  const handlePress = () => {
    if (disabled || loading) return;
    hapticLight();
    onPress && onPress();
  };

  // Basışta hafif küçülme (worklet, native thread). Reduce motion'da yok.
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = () => {
    if (!reduced && !disabled && !loading) {
      scale.value = withTiming(0.96, { duration: 90 });
    }
  };
  const onPressOut = () => {
    if (!reduced) scale.value = withTiming(1, { duration: 130 });
  };

  return (
    <AnimatedTouchable
      style={[containerStyle, pressStyle]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={fg}
              style={styles.icon}
            />
          ) : null}
          <Text style={[TYPOGRAPHY.button, { color: fg }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: SPACING.sm,
  },
  secondary: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tertiary: {
    backgroundColor: "transparent",
    minHeight: undefined,
    paddingVertical: SPACING.sm,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
