// src/components/Skeleton.js
// Yükleme iskeleti — içerik gelene kadar yanıp sönen gri bloklar.
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { COLORS, RADIUS } from "../theme";
import { useReducedMotion } from "../utils/motion";

export const SkeletonBlock = ({
  width = "100%",
  height = 16,
  radius = RADIUS.sm,
  style,
}) => {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Reduce motion açıksa nabız yok — sabit, dingin bir gri.
    if (reduced) {
      opacity.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

  return (
    <Animated.View
      // Dekoratif yer tutucu — ekran okuyucudan gizle.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: COLORS.border, opacity },
        style,
      ]}
    />
  );
};

export default SkeletonBlock;
