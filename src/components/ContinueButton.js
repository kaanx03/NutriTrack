import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const ContinueButton = ({ onPress, title = "Continue" }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#474545",
    height: 54,
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  buttonText: {
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    color: "#fff",
  },
});

export default ContinueButton;
