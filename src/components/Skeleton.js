// src/components/Skeleton.js
// Yükleme iskeleti — içerik gelene kadar yanıp sönen gri bloklar.
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { COLORS, RADIUS } from "../theme";

export const SkeletonBlock = ({
  width = "100%",
  height = 16,
  radius = RADIUS.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
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
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: COLORS.border, opacity },
        style,
      ]}
    />
  );
};

export default SkeletonBlock;
