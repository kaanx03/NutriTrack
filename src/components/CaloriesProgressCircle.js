// src/components/CaloriesProgressCircle.js
import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, StyleSheet } from "react-native";

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
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={baseDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
        {isOverflow && (
          <Circle
            stroke={overflowColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={overflowDashoffset}
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
