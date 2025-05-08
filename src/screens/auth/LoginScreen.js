// src/screens/auth/LoginScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (email === "user" && password === "12345") {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } else {
      Alert.alert("Giriş Hatası", "Kullanıcı adı veya şifre yanlış");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login to your account</Text>
      <Text style={styles.subHeader}>
        Welcome back! Please enter your details.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#A0A0A0"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#A0A0A0"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword1")}
        style={styles.forgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login now</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp1")}>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BUTTON_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#76AEF2",
    fontSize: 14,
  },
  loginButton: {
    height: BUTTON_HEIGHT,
    backgroundColor: "#474545",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#999",
  },
  signupLink: {
    fontSize: 14,
    color: "#63A4F4",
    fontWeight: "bold",
  },
});

export default LoginScreen;
