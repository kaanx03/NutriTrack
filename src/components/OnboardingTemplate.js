import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const OnboardingTemplate = ({
  imageSource,
  title,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
}) => {
  return (
    <View style={styles.container}>
      <Image source={imageSource} style={styles.image} />

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onPrimaryPress}>
        <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onSecondaryPress}
      >
        <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 256,
    height: 256,
    resizeMode: "contain",
    marginBottom: 30,
  },
  title: {
    width: 327, // tam figmadaki genişlik
    height: 72, // tam figmadaki yükseklik
    fontFamily: "Roboto-Light",
    fontSize: 28,
    lineHeight: 36, // 28 * 1.3 = 36.4 ~ 36
    color: "#474545",
    textAlign: "center",
    marginBottom: 40,
  },
  primaryButton: {
    width: 327,
    height: 54,
    backgroundColor: "#474545",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Roboto-Light",
  },
  secondaryButton: {
    width: 327,
    height: 54,
    backgroundColor: "#ffffff",
    borderColor: "#474545",
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#474545",
    fontSize: 16,
    fontFamily: "Roboto-Light",
  },
});

export default OnboardingTemplate;
