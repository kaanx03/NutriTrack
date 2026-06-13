// src/screens/main/food/BarcodeScannerScreen.js
// Paketli ürün barkodu tarar, OpenFoodFacts'ten besin değerlerini çeker
// ve mevcut FoodDetails porsiyon/ekleme akışına bırakır.
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, SPACING, RADIUS } from "../../../theme";
import { hapticLight, hapticError } from "../../../utils/haptics";
import { showToast } from "../../../components/AppToast";

const OFF_URL = (code) =>
  `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,nutriments,brands`;

const BarcodeScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mealType = route.params?.mealType || "Breakfast";

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [looking, setLooking] = useState(false);
  const lockRef = useRef(false); // CameraView aynı kodu defalarca tetikler

  const unlock = () => {
    lockRef.current = false;
    setLooking(false);
  };

  const handleScan = async ({ data: code }) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setLooking(true);
    hapticLight();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(OFF_URL(code), { signal: controller.signal });
      clearTimeout(timer);
      const json = await res.json();

      const n = json?.product?.nutriments || {};
      const kcal = parseFloat(n["energy-kcal_100g"]);
      const name = json?.product?.product_name;

      if (json?.status !== 1 || !name || isNaN(kcal)) {
        hapticError();
        Alert.alert(
          "Product not found",
          "This barcode isn't in the food database. You can enter it manually.",
          [
            {
              text: "Enter manually",
              onPress: () =>
                navigation.replace("FoodSelection", {
                  mealType,
                  openQuickLog: true,
                }),
            },
            { text: "Scan again", onPress: unlock },
          ]
        );
        return;
      }

      const brands = json.product.brands
        ? ` (${json.product.brands.split(",")[0].trim()})`
        : "";

      navigation.replace("FoodDetails", {
        food: {
          id: `off-${code}`,
          name: `${name}${brands}`,
          calories: Math.round(kcal),
          carbs: Math.round((parseFloat(n.carbohydrates_100g) || 0) * 10) / 10,
          protein: Math.round((parseFloat(n.proteins_100g) || 0) * 10) / 10,
          fat: Math.round((parseFloat(n.fat_100g) || 0) * 10) / 10,
          weight: 100, // değerler 100g bazında — FoodDetails porsiyonla ölçekler
          mealType,
          icon: "🛒",
        },
      });
    } catch (error) {
      hapticError();
      showToast("Lookup failed — check your connection", "error");
      unlock();
    }
  };

  // İzin durumları
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="camera-outline" size={56} color={COLORS.textTertiary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan product barcodes.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={handleScan}
      />

      {/* Üst bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Barcode</Text>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => setTorch((t) => !t)}
        >
          <Ionicons
            name={torch ? "flash" : "flash-outline"}
            size={22}
            color={COLORS.surface}
          />
        </TouchableOpacity>
      </View>

      {/* Tarama çerçevesi */}
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>
          Align the barcode within the frame
        </Text>
      </View>

      {looking && (
        <View style={styles.lookingOverlay}>
          <ActivityIndicator size="large" color={COLORS.surface} />
          <Text style={styles.lookingText}>Looking up product…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: COLORS.background,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  grantButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  grantButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  backLink: {
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: COLORS.surface,
    fontSize: 17,
    fontWeight: "600",
  },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    backgroundColor: "transparent",
  },
  hint: {
    color: COLORS.surface,
    fontSize: 14,
    marginTop: SPACING.lg,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 4,
  },
  lookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  lookingText: {
    color: COLORS.surface,
    fontSize: 15,
    marginTop: SPACING.md,
  },
});

export default BarcodeScannerScreen;
