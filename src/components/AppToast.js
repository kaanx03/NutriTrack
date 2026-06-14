// src/components/AppToast.js
// Tema uyumlu, üstten kayan hafif bildirim. Alert.alert yerine kullanılır.
// Kullanım: import { showToast } from "../components/AppToast";
//          showToast("Weight updated", "success");
import React, { useState, useRef, useEffect } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hapticSuccess, hapticError, hapticLight } from "../utils/haptics";
import { useReducedMotion } from "../utils/motion";

let showToastRef = null;

export const showToast = (message, type = "success") => {
  if (showToastRef) showToastRef(message, type);
};

const VARIANTS = {
  success: {
    bg: "#F4FAEA",
    border: "#A1CE50",
    icon: "checkmark-circle",
    iconColor: "#7CB332",
  },
  error: {
    bg: "#FDEEEC",
    border: "#E74C3C",
    icon: "alert-circle",
    iconColor: "#E74C3C",
  },
  info: {
    bg: "#EAF4FE",
    border: "#63A4F4",
    icon: "information-circle",
    iconColor: "#63A4F4",
  },
};

const ToastHost = () => {
  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const hideTimer = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    showToastRef = (message, type) => setToast({ message, type, key: Date.now() });
    return () => {
      showToastRef = null;
      clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    // Toast tipine göre dokunsal geri bildirim
    if (toast.type === "error") hapticError();
    else if (toast.type === "info") hapticLight();
    else hapticSuccess();

    // Reduce motion: kayma animasyonu yok — anlık göster/gizle.
    if (reduced) {
      translateY.setValue(0);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }

    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (reduced) {
        translateY.setValue(-120);
        setToast(null);
      } else {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }
    }, 2200);
  }, [toast, reduced]);

  if (!toast) return null;
  const v = VARIANTS[toast.type] || VARIANTS.success;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          backgroundColor: v.bg,
          borderColor: v.border,
        },
      ]}
    >
      <Ionicons name={v.icon} size={22} color={v.iconColor} />
      <Text style={styles.text} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  text: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
});

export default ToastHost;
