// ForgotPasswordScreen3.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../../theme";

const ForgotPasswordScreen3 = () => {
  const navigation = useNavigation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirm;

  const handleUpdate = () => {
    if (!password || !confirm) {
      setError("Both fields are required");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords must match!");
      return;
    }
    // TODO: call your API to actually reset the password
    // On success:
    setSuccessVisible(true);
  };

  const closeSuccess = () => {
    setSuccessVisible(false);
    navigation.navigate("Login"); // veya istediğiniz ekran
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Geri */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color={COLORS.surface} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          Create a new password. Ensure it differs from previous ones for
          security
        </Text>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter your new password"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={(t) => setPassword(t)}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
              <AntDesign
                name={showPwd ? "eye" : "eyeo"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={(t) => setConfirm(t)}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
              <AntDesign
                name={showConfirm ? "eye" : "eyeo"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.updateButton,
            { backgroundColor: passwordsMatch ? COLORS.textSecondary : COLORS.disabledText },
          ]}
          onPress={handleUpdate}
          disabled={!passwordsMatch}
        >
          <Text style={styles.updateText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal transparent visible={successVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Successful</Text>
            <Text style={styles.modalMessage}>
              Congratulations! Your password has been changed. Click continue to
              login.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeSuccess}>
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const BOX_MARGIN = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: BOX_MARGIN,
    marginBottom: 35,
  },
  content: {
    flex: 1,
    paddingHorizontal: BOX_MARGIN,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  error: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  updateButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  updateText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.surface,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    width: "100%",
    height: 44,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ForgotPasswordScreen3;
