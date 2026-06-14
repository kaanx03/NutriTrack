import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../context/SignUpContext";
import { showToast } from "../../components/AppToast";
import { COLORS } from "../../theme";

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 7;
const SCREEN_WIDTH = Dimensions.get("window").width;

const generateDayList = () =>
  Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));

const generateMonthList = () =>
  Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));

const generateYearList = () =>
  Array.from({ length: 40 }, (_, i) => (2010 - i).toString());

const SignUpScreen5 = () => {
  const navigation = useNavigation();
  const { formData, updateFormData } = useSignUp();

  const days = generateDayList();
  const months = generateMonthList();
  const years = generateYearList();

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const centerIndex = Math.floor(VISIBLE_ITEMS / 2);

  useEffect(() => {
    scrollToValue(dayRef, formData.day || "01", days);
    scrollToValue(monthRef, formData.month || "01", months);
    scrollToValue(yearRef, formData.year || "2000", years);
  }, []);

  const scrollToValue = (ref, value, list) => {
    const index = list.findIndex((i) => i === value);
    if (index >= 0) {
      ref.current?.scrollToIndex({ animated: false, index });
    }
  };

  const handleScrollEnd = (event, list, updateKey) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    updateFormData(updateKey, list[clamped]);
  };

  const renderItem = (item, selectedValue) => {
    const isSelected = item === selectedValue;
    return (
      <View style={styles.itemWrapper}>
        <Text
          style={[
            styles.itemText,
            isSelected ? styles.selectedText : styles.unselectedText,
          ]}
        >
          {item}
        </Text>
      </View>
    );
  };

  const renderPicker = (data, ref, selectedValue, key) => (
    <View style={styles.pickerColumn}>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(item, index) => item + index}
        showsVerticalScrollIndicator={false}
        bounces={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={(e) => handleScrollEnd(e, data, key)}
        onScrollEndDrag={(e) => handleScrollEnd(e, data, key)}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * centerIndex,
          paddingBottom: ITEM_HEIGHT * centerIndex,
        }}
        renderItem={({ item }) => renderItem(item, formData[key])}
      />

      {/* Sabit çizgiler */}
      <View style={[styles.centerLine, { top: ITEM_HEIGHT * centerIndex }]} />
      <View
        style={[styles.centerLine, { top: ITEM_HEIGHT * (centerIndex + 1) }]}
      />
    </View>
  );

  const handleContinue = () => {
    const day = formData.day || "01";
    const month = formData.month || "01";
    const year = formData.year || "2000";

    // Geçerli bir tarih mi? (örn. 31 Şubat'ı engelle)
    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    const isValid =
      date.getFullYear() === parseInt(year) &&
      date.getMonth() + 1 === parseInt(month) &&
      date.getDate() === parseInt(day);

    if (!isValid) {
      showToast("Please select a valid date", "error");
      return;
    }

    updateFormData("day", day);
    updateFormData("month", month);
    updateFormData("year", year);
    navigation.navigate("SignUp6");
  };

  // Inline: geçersiz tarih (örn. 31 Şubat) seçilirse buton pasif + uyarı
  const _y = formData.year || "2000";
  const _m = formData.month || "01";
  const _dn = formData.day || "01";
  const _date = new Date(`${_y}-${_m}-${_dn}T00:00:00`);
  const dateValid =
    _date.getFullYear() === parseInt(_y) &&
    _date.getMonth() + 1 === parseInt(_m) &&
    _date.getDate() === parseInt(_dn);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="left" size={20} color={COLORS.surface} />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: "57.1%" }]} />
        </View>
        <Text style={styles.progressText}>4/7</Text>
      </View>

      <Text style={styles.title}>When's your birthday?</Text>

      <View style={styles.pickerContainer}>
        {renderPicker(days, dayRef, formData.day, "day")}
        {renderPicker(months, monthRef, formData.month, "month")}
        {renderPicker(years, yearRef, formData.year, "year")}
      </View>
      {!dateValid ? (
        <Text style={styles.errorText}>Please select a valid date</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.continueButton, !dateValid && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!dateValid}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.brandGoogle,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 30,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginBottom: 40,
  },
  pickerColumn: {
    width: SCREEN_WIDTH / 3.2,
    position: "relative",
    alignItems: "center",
  },
  centerLine: {
    position: "absolute",
    width: "80%",
    height: 1,
    backgroundColor: COLORS.primary,
    zIndex: 10,
  },
  itemWrapper: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
  },
  selectedText: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 20,
  },
  unselectedText: {
    color: COLORS.borderStrong,
    opacity: 0.6,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: "center",
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: COLORS.textSecondary,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SignUpScreen5;
