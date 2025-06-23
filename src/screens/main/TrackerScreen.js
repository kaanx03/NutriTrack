// src/screens/main/TrackerScreen.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useWater } from "../../context/WaterContext";
import { useWeight } from "../../context/WeightContext";
import BottomNavigation from "../../components/BottomNavigation";

const TrackerScreen = () => {
  const navigation = useNavigation();

  // Water context - UPDATED WITH refreshData
  const {
    waterIntake,
    increaseWater: contextIncreaseWater,
    decreaseWater: contextDecreaseWater,
    waterGoal,
    loading: waterLoading,
    getWaterPercentage,
    getRemainingWater,
    isGoalReached,
    getTodayLogCount,
    refreshData, // ADDED THIS
  } = useWater();

  // Weight context
  const {
    currentWeight,
    goalWeight,
    height,
    bmi,
    bmiCategory,
    initialWeight,
    updateWeight,
    getBMIColor,
    getWeightChange,
    getGoalProgress,
    loading: weightLoading,
  } = useWeight();

  const [waterIncrement, setWaterIncrement] = useState(100);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState(currentWeight.toString());
  const [newWeightNotes, setNewWeightNotes] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);

  // Su animasyon referansları
  const waterLevelAnimation = useRef(new Animated.Value(0)).current;
  const bubbleAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Kutlama animasyonu için ekstra baloncuklar
  const celebrationBubbles = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Weight değiştiğinde newWeight'i güncelle
  useEffect(() => {
    setNewWeight(currentWeight.toString());
  }, [currentWeight]);

  // Su seviyesi animasyonu
  useEffect(() => {
    Animated.timing(waterLevelAnimation, {
      toValue: getWaterPercentage(),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [waterIntake, waterGoal]);

  // Bubble animasyonları
  useEffect(() => {
    const createBubbleAnimation = (animatedValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const bubbleLoops = bubbleAnimations.map((anim, index) =>
      createBubbleAnimation(anim, index * 500)
    );

    bubbleLoops.forEach((loop) => loop.start());

    return () => bubbleLoops.forEach((loop) => loop.stop());
  }, []);

  // Su içme fonksiyonları - UPDATED
  const decreaseWater = async () => {
    try {
      console.log("TrackerScreen - Decrease water button pressed");
      await contextDecreaseWater(waterIncrement);
    } catch (error) {
      console.error("TrackerScreen - Decrease water error:", error);
      Alert.alert("Hata", "Su kaydı silinemedi. Tekrar deneyin.");
    }
  };

  const increaseWater = async () => {
    try {
      console.log("TrackerScreen - Increase water button pressed");
      const wasGoalReached = isGoalReached();
      await contextIncreaseWater(waterIncrement);

      // Hedef ulaşıldığında kutlama animasyonu
      if (!wasGoalReached && isGoalReached()) {
        setShowCelebration(true);

        // Kutlama baloncuklarını başlat
        celebrationBubbles.forEach((anim, index) => {
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]).start();
        });

        setTimeout(() => setShowCelebration(false), 2000);

        // Başarı mesajı
        Alert.alert("🎉 Tebrikler!", "Günlük su hedefine ulaştınız!", [
          { text: "Harika!", style: "default" },
        ]);
      }
    } catch (error) {
      console.error("TrackerScreen - Increase water error:", error);
      Alert.alert(
        "Hata",
        "Su kaydı eklenemedi. İnternet bağlantınızı kontrol edin."
      );
    }
  };

  // Manual refresh function - ADDED
  const handleRefresh = async () => {
    console.log("TrackerScreen - Manual refresh triggered");
    try {
      await refreshData(); // Water data refresh
      // Add weight data refresh if you have it
    } catch (error) {
      console.error("TrackerScreen - Refresh error:", error);
    }
  };

  // Kilo güncelleme
  const updateWeightHandler = () => {
    setIsWeightModalVisible(true);
    setNewWeight(currentWeight.toString());
    setNewWeightNotes("");
  };

  const saveWeight = async () => {
    const weight = parseFloat(newWeight);

    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert(
        "Hata",
        "Lütfen 1-500 kg arası geçerli bir kilo değeri giriniz."
      );
      return;
    }

    try {
      setIsUpdatingWeight(true);
      await updateWeight(weight, newWeightNotes);
      setIsWeightModalVisible(false);

      Alert.alert("Başarılı", "Kilonuz başarıyla güncellendi.", [
        { text: "Tamam", style: "default" },
      ]);
    } catch (error) {
      Alert.alert(
        "Hata",
        error.message || "Kilo güncellenemedi. Tekrar deneyin."
      );
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  // BMI çubuğu segmentleri
  const getBmiSegments = () => {
    return [
      { color: "#3F51B2", flex: 1 },
      { color: "#1A96F0", flex: 1 },
      { color: "#00A9F1", flex: 2 },
      { color: "#4AAF57", flex: 4 },
      { color: "#FFC02D", flex: 3 },
      { color: "#FF981F", flex: 2 },
      { color: "#FF5726", flex: 1 },
      { color: "#F54336", flex: 1 },
    ];
  };

  // BMI pozisyon hesapla
  const getBmiIndicatorPosition = () => {
    const segments = getBmiSegments();
    const totalFlex = segments.reduce((sum, segment) => sum + segment.flex, 0);

    let currentPosition = 0;
    let segmentIndex = 0;

    if (bmi < 16.0) segmentIndex = 0;
    else if (bmi >= 16.0 && bmi < 17.0) segmentIndex = 1;
    else if (bmi >= 17.0 && bmi < 18.5) segmentIndex = 2;
    else if (bmi >= 18.5 && bmi < 25.0) segmentIndex = 3;
    else if (bmi >= 25.0 && bmi < 30.0) segmentIndex = 4;
    else if (bmi >= 30.0 && bmi < 35.0) segmentIndex = 5;
    else if (bmi >= 35.0 && bmi < 40.0) segmentIndex = 6;
    else segmentIndex = 7;

    for (let i = 0; i < segmentIndex; i++) {
      currentPosition += segments[i].flex;
    }

    currentPosition += segments[segmentIndex].flex / 2;
    return (currentPosition / totalFlex) * 100;
  };

  const weightChange = getWeightChange();
  const goalProgress = getGoalProgress();

  // Loading gösterimi
  if (waterLoading || weightLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#03A9F4" />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracker</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={waterLoading || weightLoading}
            onRefresh={handleRefresh} // UPDATED THIS LINE
            colors={["#03A9F4"]}
            tintColor="#03A9F4"
            title="Veriler yenileniyor..."
            titleColor="#666"
          />
        }
      >
        {/* Water Section */}
        <View style={styles.sectionCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.sectionTitle}>Water</Text>
              <View style={styles.waterStats}>
                <Text style={styles.waterIntakeText}>{waterIntake} mL</Text>
                <Text style={styles.waterTarget}>/ {waterGoal} mL</Text>
              </View>
              <Text style={styles.waterSubInfo}>
                {getRemainingWater() > 0
                  ? `${getRemainingWater()} mL kaldı`
                  : "🎉 Hedef tamamlandı!"}
              </Text>
              <Text style={styles.waterLogCount}>
                Bugün {getTodayLogCount()} kayıt
              </Text>
            </View>
            <View style={styles.waterIncrementContainer}>
              <TouchableOpacity
                style={[
                  styles.incrementButton,
                  waterIncrement === 100 && styles.activeIncrementButton,
                ]}
                onPress={() => setWaterIncrement(100)}
              >
                <Text
                  style={[
                    styles.incrementText,
                    waterIncrement === 100 && styles.activeIncrementText,
                  ]}
                >
                  100ml
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.incrementButton,
                  waterIncrement === 250 && styles.activeIncrementButton,
                ]}
                onPress={() => setWaterIncrement(250)}
              >
                <Text
                  style={[
                    styles.incrementText,
                    waterIncrement === 250 && styles.activeIncrementText,
                  ]}
                >
                  250ml
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.waterControlsContainer}>
            <TouchableOpacity
              style={[
                styles.waterButton,
                (waterLoading || waterIntake === 0) && styles.disabledButton,
              ]}
              onPress={decreaseWater}
              disabled={waterLoading || waterIntake === 0}
            >
              {waterLoading ? (
                <ActivityIndicator size="small" color="#03A9F4" />
              ) : (
                <Text style={styles.waterButtonText}>−</Text>
              )}
            </TouchableOpacity>

            <View style={styles.waterGaugeContainer}>
              <View style={styles.waterGauge}>
                {/* Su Seviyesi */}
                <Animated.View
                  style={[
                    styles.waterFill,
                    {
                      height: waterLevelAnimation.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                        extrapolate: "clamp",
                      }),
                    },
                  ]}
                />

                {/* Bubble Efektleri */}
                {bubbleAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.bubble,
                      {
                        left: 8 + index * 15 + Math.random() * 10,
                        opacity: anim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1, 0],
                        }),
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [100, -10],
                            }),
                          },
                          {
                            scale: anim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.4, 1, 0.4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}

                {/* Su içinde yüzde gösterimi */}
                <Text
                  style={[
                    styles.waterPercentage,
                    {
                      color: getWaterPercentage() > 50 ? "#FFFFFF" : "#0288D1",
                    },
                  ]}
                >
                  {Math.round(getWaterPercentage())}%
                </Text>

                {/* Kutlama baloncukları */}
                {showCelebration &&
                  celebrationBubbles.map((anim, index) => (
                    <Animated.View
                      key={`celebration-${index}`}
                      style={[
                        styles.celebrationBubble,
                        {
                          left: 10 + (index % 3) * 25 + Math.random() * 10,
                          opacity: anim.interpolate({
                            inputRange: [0, 0.3, 1],
                            outputRange: [0, 1, 0],
                          }),
                          transform: [
                            {
                              translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [80, -20],
                              }),
                            },
                            {
                              scale: anim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0.3, 1.2, 0.3],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.waterButton,
                waterLoading && styles.disabledButton,
              ]}
              onPress={increaseWater}
              disabled={waterLoading}
            >
              {waterLoading ? (
                <ActivityIndicator size="small" color="#03A9F4" />
              ) : (
                <Text style={styles.waterButtonText}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight Section */}
        <View style={styles.sectionCard}>
          <View style={styles.weightHeader}>
            <Text style={styles.sectionTitle}>Weight</Text>
            <TouchableOpacity
              style={[
                styles.updateButton,
                isUpdatingWeight && styles.disabledButton,
              ]}
              onPress={updateWeightHandler}
              disabled={isUpdatingWeight}
            >
              {isUpdatingWeight ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.weightDisplay}>
            <Text style={styles.weightValue}>{currentWeight.toFixed(1)}</Text>
            <Text style={styles.weightUnit}>kg</Text>
            <View style={styles.weightChange}>
              <View
                style={[
                  styles.weightDot,
                  {
                    backgroundColor: weightChange.isNegative
                      ? "#10B981"
                      : weightChange.isPositive
                      ? "#EF4444"
                      : "#9CA3AF",
                  },
                ]}
              />
              <Text
                style={[
                  styles.weightChangeText,
                  {
                    color: weightChange.isNegative
                      ? "#10B981"
                      : weightChange.isPositive
                      ? "#EF4444"
                      : "#666",
                  },
                ]}
              >
                {weightChange.isNegative
                  ? "-"
                  : weightChange.isPositive
                  ? "+"
                  : ""}
                {weightChange.value} kg
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(goalProgress.percentage, 100)}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                Başlangıç {initialWeight.toFixed(1)} kg
              </Text>
              <Text style={styles.progressLabel}>
                Hedef {goalWeight.toFixed(1)} kg
              </Text>
            </View>
            <Text style={styles.progressInfo}>
              Hedefe {goalProgress.remaining} kg{" "}
              {goalProgress.remaining > 0 ? "var" : "geçildi"}
            </Text>
          </View>
        </View>

        {/* BMI Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>BMI (kg/m²)</Text>

          <View style={styles.bmiDisplay}>
            <Text style={styles.bmiValue}>{bmi?.toFixed(1) || "0.0"}</Text>
            <Text style={[styles.bmiCategory, { color: getBMIColor(bmi) }]}>
              {bmiCategory}
            </Text>
          </View>

          <View style={styles.bmiInfo}>
            <Text style={styles.bmiInfoText}>
              Boy: {height} cm | Kilo: {currentWeight.toFixed(1)} kg
            </Text>
          </View>

          <View style={styles.bmiBarContainer}>
            {getBmiSegments().map((segment, index) => (
              <View
                key={index}
                style={[
                  styles.bmiBarSegment,
                  {
                    backgroundColor: segment.color,
                    flex: segment.flex,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.bmiIndicatorContainer}>
            <View
              style={[
                styles.bmiIndicator,
                {
                  left: `${getBmiIndicatorPosition()}%`,
                  marginLeft: -6,
                },
              ]}
            />
          </View>
        </View>
      </ScrollView>

      {/* Weight Update Modal */}
      <Modal
        visible={isWeightModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kilo Güncelle</Text>
            <Text style={styles.modalSubtitle}>Güncel kilonuzu giriniz</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.weightInput}
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="Kilo"
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.weightInput, styles.notesInput]}
                value={newWeightNotes}
                onChangeText={setNewWeightNotes}
                placeholder="Not (opsiyonel)"
                multiline={true}
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsWeightModalVisible(false)}
                disabled={isUpdatingWeight}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isUpdatingWeight && styles.disabledButton,
                ]}
                onPress={saveWeight}
                disabled={isUpdatingWeight}
              >
                {isUpdatingWeight ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Tracker" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Water Styles
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  waterStats: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  waterIntakeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  waterTarget: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  waterSubInfo: {
    fontSize: 12,
    color: "#03A9F4",
    marginTop: 4,
    fontWeight: "500",
  },
  waterLogCount: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  waterControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waterGaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 20,
  },
  waterGauge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F4FD",
    borderWidth: 0,
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#03A9F4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  waterFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#03A9F4",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  bubble: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#B3E5FC",
  },
  waterPercentage: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  celebrationBubble: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#03A9F4",
  },
  waterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#03A9F4",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#03A9F4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterButtonText: {
    fontSize: 24,
    color: "#03A9F4",
    fontWeight: "300",
    lineHeight: 24,
  },
  waterIncrementContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  incrementButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    marginHorizontal: 1,
  },
  activeIncrementButton: {
    backgroundColor: "#03A9F4",
    shadowColor: "#03A9F4",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  incrementText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  activeIncrementText: {
    color: "#FFFFFF",
  },

  // Weight Styles
  weightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  weightDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
  },
  weightUnit: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  weightChange: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  weightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  weightChangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#999",
  },
  progressInfo: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },

  // BMI Styles
  bmiDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
  },
  bmiCategory: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  bmiInfo: {
    marginBottom: 16,
  },
  bmiInfoText: {
    fontSize: 12,
    color: "#666",
  },
  bmiBarContainer: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  bmiBarSegment: {
    height: "100%",
    marginHorizontal: 0.5,
    borderRadius: 4,
  },
  bmiIndicatorContainer: {
    position: "relative",
    height: 12,
  },
  bmiIndicator: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#333",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: "100%",
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#000",
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  inputUnit: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#63A4F4",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});

export default TrackerScreen;
