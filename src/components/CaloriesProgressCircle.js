// src/components/CaloriesProgressCircle.js
import React, { useEffect } from "react";
import Svg, { Circle } from "react-native-svg";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion, DURATION } from "../utils/motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CaloriesProgressCircle = ({
  size = 120,
  strokeWidth = 10,
  progress,
  color = "#A1CE50",
  overflowColor = "#4E7A1E",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Hedef aşıldıysa: yeşil halka tam dolu, fazlası kırmızı olarak üstüne çizilir
  const isOverflow = progress > 100;
  const baseProgress = Math.min(progress, 100);
  const overflowProgress = isOverflow ? Math.min(progress - 100, 100) : 0;

  const baseDashoffset = circumference - (circumference * baseProgress) / 100;
  const overflowDashoffset =
    circumference - (circumference * overflowProgress) / 100;

  // Halka dolumu: boştan (circumference) hedefe doğru worklet ile akar.
  const reduced = useReducedMotion();
  const baseOffset = useSharedValue(circumference);
  const overflowOffset = useSharedValue(circumference);

  useEffect(() => {
    baseOffset.value = reduced
      ? baseDashoffset
      : withTiming(baseDashoffset, { duration: DURATION.slow });
    overflowOffset.value = reduced
      ? overflowDashoffset
      : withTiming(overflowDashoffset, { duration: DURATION.slow });
  }, [baseDashoffset, overflowDashoffset, reduced]);

  const baseAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: baseOffset.value,
  }));
  const overflowAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: overflowOffset.value,
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          stroke="#f0f0f0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={baseAnimProps}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
        {isOverflow && (
          <AnimatedCircle
            stroke={overflowColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={overflowAnimProps}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.centerContentContainer}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CaloriesProgressCircle;
