// src/screens/main/settings/ProgressPhotosScreen.js
// Kilo yolculuğunun fotoğraflı takibi — fotoğraflar cihazda lokal saklanır.
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import ScreenHeader from "../../../components/ScreenHeader";
import { showToast } from "../../../components/AppToast";
import { hapticLight, hapticSuccess } from "../../../utils/haptics";
import PhotoStorage from "../../../services/PhotoStorage";
import { useAuth } from "../../../context/AuthContext";
import { useWeight } from "../../../context/WeightContext";
import { COLORS, SPACING, RADIUS } from "../../../theme";

const { width } = Dimensions.get("window");
const THUMB = (width - 40 - 16) / 3; // 20 yatay padding + 8'lik aralıklar

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const ProgressPhotosScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { currentWeight } = useWeight();

  const [photos, setPhotos] = useState([]);
  const [viewer, setViewer] = useState(null); // tam ekran görüntülenen foto
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState([]);
  const [comparePair, setComparePair] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        PhotoStorage.getProgressPhotos(user.id).then(setPhotos);
      }
    }, [user?.id])
  );

  const pickerOptions = { allowsEditing: false, quality: 0.7 };

  const addFromResult = async (result) => {
    if (result.canceled || !result.assets?.[0]?.uri) return;
    hapticLight();
    await PhotoStorage.addProgressPhoto(user.id, result.assets[0].uri, {
      weight: currentWeight,
    });
    setPhotos(await PhotoStorage.getProgressPhotos(user.id));
    showToast("Progress photo added", "success");
  };

  const handleAdd = () => {
    if (!user?.id) return;
    Alert.alert("Add Progress Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            showToast("Camera permission denied", "error");
            return;
          }
          addFromResult(await ImagePicker.launchCameraAsync(pickerOptions));
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            showToast("Photo library permission denied", "error");
            return;
          }
          addFromResult(
            await ImagePicker.launchImageLibraryAsync(pickerOptions)
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDelete = (photo) => {
    Alert.alert("Delete photo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = await PhotoStorage.deleteProgressPhoto(
            user.id,
            photo.id
          );
          setPhotos(next);
          setViewer(null);
          showToast("Photo deleted", "info");
        },
      },
    ]);
  };

  const handleThumbPress = (photo) => {
    if (!compareMode) {
      setViewer(photo);
      return;
    }
    // Karşılaştırma modu: iki foto seç
    setCompareSelection((prev) => {
      if (prev.find((p) => p.id === photo.id)) {
        return prev.filter((p) => p.id !== photo.id);
      }
      const next = [...prev, photo];
      if (next.length === 2) {
        hapticSuccess();
        // Eski tarihli solda olsun
        const sorted = [...next].sort((a, b) => (a.id > b.id ? 1 : -1));
        setComparePair(sorted);
        setCompareMode(false);
        return [];
      }
      return next;
    });
  };

  const weightDelta = (pair) => {
    if (pair[0].weight == null || pair[1].weight == null) return null;
    const d = pair[1].weight - pair[0].weight;
    return `${d > 0 ? "+" : ""}${d.toFixed(1)} kg`;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Progress Photos"
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={handleAdd}
      />

      {photos.length >= 2 && (
        <TouchableOpacity
          style={[
            styles.compareBar,
            compareMode && styles.compareBarActive,
          ]}
          onPress={() => {
            setCompareMode((m) => !m);
            setCompareSelection([]);
          }}
        >
          <Ionicons
            name="git-compare-outline"
            size={18}
            color={compareMode ? COLORS.surface : COLORS.primary}
          />
          <Text
            style={[
              styles.compareBarText,
              compareMode && styles.compareBarTextActive,
            ]}
          >
            {compareMode
              ? `Select 2 photos (${compareSelection.length}/2)`
              : "Compare two photos"}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color="#ccc" />
            <Text style={styles.emptyTitle}>No progress photos yet</Text>
            <Text style={styles.emptyText}>
              Tap + to add your first photo. Your current weight is attached
              automatically.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = compareSelection.some((p) => p.id === item.id);
          return (
            <TouchableOpacity
              style={styles.thumbWrap}
              onPress={() => handleThumbPress(item)}
            >
              <Image source={{ uri: item.uri }} style={styles.thumb} />
              {selected && (
                <View style={styles.thumbSelected}>
                  <Ionicons name="checkmark-circle" size={26} color={COLORS.surface} />
                </View>
              )}
              <Text style={styles.thumbDate}>{formatDate(item.dateISO)}</Text>
              {item.weight != null && (
                <Text style={styles.thumbWeight}>
                  {Number(item.weight).toFixed(1)} kg
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Tam ekran görüntüleyici */}
      <Modal
        visible={!!viewer}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
      >
        {viewer && (
          <View style={styles.viewerOverlay}>
            <Image
              source={{ uri: viewer.uri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
            <View style={styles.viewerInfo}>
              <Text style={styles.viewerText}>
                {formatDate(viewer.dateISO)}
                {viewer.weight != null
                  ? ` · ${Number(viewer.weight).toFixed(1)} kg`
                  : ""}
              </Text>
            </View>
            <View style={styles.viewerActions}>
              <TouchableOpacity
                style={styles.viewerButton}
                onPress={() => handleDelete(viewer)}
              >
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerButton}
                onPress={() => setViewer(null)}
              >
                <Ionicons name="close" size={26} color={COLORS.surface} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Karşılaştırma görünümü */}
      <Modal
        visible={!!comparePair}
        transparent
        animationType="fade"
        onRequestClose={() => setComparePair(null)}
      >
        {comparePair && (
          <View style={styles.viewerOverlay}>
            <View style={styles.compareRow}>
              {comparePair.map((p) => (
                <View key={p.id} style={styles.compareCol}>
                  <Image
                    source={{ uri: p.uri }}
                    style={styles.compareImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.compareCaption}>
                    {formatDate(p.dateISO)}
                  </Text>
                  {p.weight != null && (
                    <Text style={styles.compareWeight}>
                      {Number(p.weight).toFixed(1)} kg
                    </Text>
                  )}
                </View>
              ))}
            </View>
            {weightDelta(comparePair) && (
              <Text style={styles.compareDelta}>
                Change: {weightDelta(comparePair)}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.viewerButton, styles.compareClose]}
              onPress={() => setComparePair(null)}
            >
              <Ionicons name="close" size={26} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  compareBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  compareBarActive: {
    backgroundColor: COLORS.primary,
  },
  compareBarText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  compareBarTextActive: {
    color: COLORS.surface,
  },
  grid: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 8,
  },
  thumbWrap: {
    width: THUMB,
    marginBottom: SPACING.lg,
  },
  thumb: {
    width: THUMB,
    height: THUMB * 1.25,
    borderRadius: RADIUS.md,
    backgroundColor: "#E5E5E5",
  },
  thumbSelected: {
    position: "absolute",
    top: 0,
    left: 0,
    width: THUMB,
    height: THUMB * 1.25,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(99,164,244,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  thumbWeight: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "75%",
  },
  viewerInfo: {
    marginTop: SPACING.lg,
  },
  viewerText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "500",
  },
  viewerActions: {
    position: "absolute",
    top: 56,
    right: 20,
    flexDirection: "row",
  },
  viewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  compareRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  compareCol: {
    flex: 1,
    alignItems: "center",
  },
  compareImage: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: RADIUS.md,
  },
  compareCaption: {
    color: COLORS.surface,
    fontSize: 13,
    marginTop: 8,
  },
  compareWeight: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  compareDelta: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: "700",
    marginTop: SPACING.xl,
  },
  compareClose: {
    position: "absolute",
    top: 56,
    right: 20,
  },
});

export default ProgressPhotosScreen;
