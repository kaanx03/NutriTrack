// src/components/CaloriesProgressCircle.js
import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, StyleSheet } from "react-native";

const CaloriesProgressCircle = ({
  size = 120,
  strokeWidth = 10,
  progress,
  color = "#A1CE50",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

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
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
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
