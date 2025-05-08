import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";

const ForgotPasswordScreen2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};

  // 5 haneli kod için state ve ref’ler
  const [code, setCode] = useState(Array(5).fill(""));
  const inputsRef = useRef([]);

  // Resend email kontrolü
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  // Kod tamamlandığında butonu aktif et
  const isCodeComplete = code.every((d) => d !== "");

  // 2 dakika sonra yeniden aktif etmek için timer
  useEffect(() => {
    let timer;
    if (isResendDisabled) {
      timer = setTimeout(() => setIsResendDisabled(false), 120000);
    }
    return () => clearTimeout(timer);
  }, [isResendDisabled]);

  const handleGoBack = () => navigation.goBack();

  const handleChangeDigit = (digit, idx) => {
    if (/^[0-9]$/.test(digit) || digit === "") {
      const newCode = [...code];
      newCode[idx] = digit;
      setCode(newCode);
      if (digit && idx < 4) {
        inputsRef.current[idx + 1].focus();
      }
    }
  };

  const handleKeyPress = ({ nativeEvent }, idx) => {
    if (nativeEvent.key === "Backspace" && code[idx] === "" && idx > 0) {
      inputsRef.current[idx - 1].focus();
    }
  };

  const handleVerify = () => {
    // TODO: doğrulama API çağrısı vs.
    // Şimdilik örnek navigasyon:
    navigation.navigate("ForgotPassword3", { email, code: code.join("") });
  };

  const handleResend = () => {
    if (isResendDisabled) return;
    // TODO: yeniden e-posta gönderme API çağrısı
    Alert.alert("Email sent", "A new reset link has been sent to your email.");
    setIsResendDisabled(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <AntDesign name="left" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We sent a reset link to{" "}
          <Text style={{ fontWeight: "bold" }}>{email || "your address"}</Text>.
          Enter the 5-digit code from the email.
        </Text>

        {/* Kod input alanları */}
        <View style={styles.codeContainer}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              value={digit}
              onChangeText={(text) => handleChangeDigit(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
            />
          ))}
        </View>

        {/* Verify Code Butonu */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            { backgroundColor: isCodeComplete ? "#474545" : "#AEAEAE" },
          ]}
          onPress={handleVerify}
          disabled={!isCodeComplete}
        >
          <Text style={styles.verifyButtonText}>Verify Code</Text>
        </TouchableOpacity>

        {/* Resend Email */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Haven’t got the email yet? </Text>
          <TouchableOpacity onPress={handleResend} disabled={isResendDisabled}>
            <Text
              style={[styles.resendLink, isResendDisabled && { color: "#999" }]}
            >
              Resend email
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const BOX_SIZE = 50;
const BOX_MARGIN = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#474545",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 24,
    marginBottom: 35,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  codeInput: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    marginRight: BOX_MARGIN,
  },
  codeInputFilled: {
    borderColor: "#474545",
  },
  verifyButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#999",
  },
  resendLink: {
    fontSize: 14,
    color: "#63A4F4",
  },
});

export default ForgotPasswordScreen2;
