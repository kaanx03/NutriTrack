import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../../theme";

const SignUpScreen9 = () => {
  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  const size = 240;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      navigation.navigate("SignUp10");
    });

    const listener = animatedValue.addListener(({ value }) => {
      setProgress(Math.floor(value * 100));
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, []);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.navigate("LoginScreen")}
      >
        <AntDesign name="close" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>
        Personalizing your NutriTrack experience...
      </Text>

      <View style={styles.progressWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.borderStrong}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.brandGoogle}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{progress}%</Text>
        </View>
      </View>

      <Text style={styles.messageText}>
        Hang tight! We're crafting a personalized plan just for you.
      </Text>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 30,
    paddingTop: 60,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 30,
    width: 40,
    height: 40,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 80,
    marginBottom: 40,
  },
  progressWrapper: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  percentageContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 30,
    marginTop: 60,
  },
});

export default SignUpScreen9;
