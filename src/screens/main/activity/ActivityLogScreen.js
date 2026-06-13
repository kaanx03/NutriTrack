// src/screens/main/activity/ActivityLogScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const ActivityLogScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Context'ten state ve fonksiyonları alın
  const { activities, deleteActivity } = useActivity();

  const [totalCalories, setTotalCalories] = useState(0);
  const [userActivities, setUserActivities] = useState([]);

  useEffect(() => {
    // Context'ten aktiviteleri al
    if (activities && activities.length > 0) {
      setUserActivities(activities);

      // Toplam yakılan kaloriyi hesapla
      const total = activities.reduce(
        (sum, activity) => sum + activity.calories,
        0
      );
      setTotalCalories(total);
    } else {
      setUserActivities([]);
      setTotalCalories(0);
    }
  }, [activities]);

  const handleDeleteActivity = (activityId) => {
    Alert.alert(
      "Delete Activity",
      "Sure you want to delete this activity log?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            // Context'teki deleteActivity fonksiyonunu çağır
            deleteActivity(activityId);
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddActivity = () => {
    // ActivitySelectionScreen'e yönlendir
    navigation.navigate("ActivitySelection");
  };

  const handleEditActivity = (activity) => {
    // ActivitySelectionScreen'e yönlendir ve düzenlenecek aktiviteyi gönder
    navigation.navigate("ActivityDetails", {
      activity: activity,
      isEditing: true,
    });
  };

  // Aktivite öğeleri için yardımcı fonksiyon: Emoji/ikon seçimi
  const getActivityIcon = (activityName) => {
    const name = activityName.toLowerCase();

    // Yaygın aktiviteler için emoji/icon belirle
    if (name.includes("run") || name.includes("koş")) return "🏃";
    if (name.includes("walk") || name.includes("yürü")) return "🚶";
    if (name.includes("swim") || name.includes("yüz")) return "🏊";
    if (name.includes("bike") || name.includes("bisiklet")) return "🚴";
    if (name.includes("gym") || name.includes("fitness")) return "💪";
    if (name.includes("yoga")) return "🧘";
    if (name.includes("football") || name.includes("futbol")) return "⚽";
    if (name.includes("basketball") || name.includes("basket")) return "🏀";
    if (name.includes("tennis")) return "🎾";
    if (name.includes("golf")) return "🏌️";
    if (name.includes("hike") || name.includes("trekking")) return "🥾";
    if (name.includes("ski")) return "⛷️";
    if (name.includes("dance") || name.includes("dans")) return "💃";
    if (name.includes("climb") || name.includes("tırman")) return "🧗";
    if (name.includes("surf")) return "🏄";
    if (name.includes("cycle") || name.includes("bisiklet")) return "🚴";
    if (name.includes("cardio")) return "❤️";
    if (name.includes("weight") || name.includes("ağırlık")) return "🏋️";
    if (name.includes("stretch") || name.includes("esne")) return "🤸";

    // Varsayılan: İlk harf
    return activityName.charAt(0).toUpperCase();
  };

  const renderActivityItem = ({ item }) => {
    // İkon veya ilk harf
    const iconContent =
      typeof getActivityIcon(item.name) === "string" &&
      getActivityIcon(item.name).length === 1 ? (
        <Text style={styles.activityIconText}>
          {getActivityIcon(item.name)}
        </Text>
      ) : (
        <Text style={styles.activityIconEmoji}>
          {getActivityIcon(item.name)}
        </Text>
      );

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityItemLeft}>
          <View style={styles.activityIcon}>{iconContent}</View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityDetails}>
              {item.calories} kcal • {item.duration} mins
            </Text>
          </View>
        </View>

        <View style={styles.activityItemRight}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditActivity(item)}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteActivity(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Activity Log" onBack={() => navigation.goBack()} />

      {/* Total calories */}
      <View style={styles.totalCaloriesContainer}>
        <Text style={styles.totalLabel}>Total Burned</Text>
        <Text style={styles.totalValue}>{totalCalories} kcal</Text>
      </View>

      {/* Activities list */}
      <FlatList
        data={userActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities logged yet</Text>
          </View>
        }
      />

      {/* Add button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: COLORS.warning, marginBottom: Math.max(insets.bottom, 16) },
        ]}
        onPress={handleAddActivity}
      >
        <Text style={styles.addButtonText}>Add Activity</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerTouchable: {
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16, // Daha fazla dikey boşluk eklendi
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  totalCaloriesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 80,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3D9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.warning,
  },
  activityIconEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  activityItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.warning,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ActivityLogScreen;
