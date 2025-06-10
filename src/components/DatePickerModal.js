// src/components/DatePickerModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const DatePickerModal = ({ visible, onClose, selectedDate, onDateSelect }) => {
  // Initial state uses the passed selectedDate or defaults to current date
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const [localSelectedDate, setLocalSelectedDate] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Format month and year
  const formatMonthYear = () => {
    const options = { month: "long", year: "numeric" };
    return currentMonth.toLocaleDateString(undefined, options);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(date);
    setLocalSelectedDate(newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  // Generate calendar grid
  const renderCalendarGrid = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    // Adjust for Sunday as first day (0) to Monday as first day (0)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Get days from previous month
    const daysInPreviousMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0
    ).getDate();

    // Days array will hold all the day components to render
    const daysArray = [];

    // Add days from previous month
    for (let i = 0; i < adjustedFirstDay; i++) {
      const dayFromPrevMonth = daysInPreviousMonth - adjustedFirstDay + i + 1;
      daysArray.push(
        <TouchableOpacity
          key={`prev-${dayFromPrevMonth}`}
          style={styles.dayButton}
          disabled={true}
        >
          <Text style={styles.dayTextInactive}>{dayFromPrevMonth}</Text>
        </TouchableOpacity>
      );
    }

    // Current date to compare for highlighting today
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear();

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth);
      date.setDate(i);

      const isToday = isCurrentMonth && i === today.getDate();

      const isSelected =
        i === localSelectedDate.getDate() &&
        currentMonth.getMonth() === localSelectedDate.getMonth() &&
        currentMonth.getFullYear() === localSelectedDate.getFullYear();

      daysArray.push(
        <TouchableOpacity
          key={`current-${i}`}
          style={styles.dayButton}
          onPress={() => handleDateSelect(i)}
        >
          <View
            style={
              isSelected
                ? styles.selectedDay
                : isToday
                ? styles.todayCircle
                : null
            }
          >
            <Text
              style={
                isSelected
                  ? styles.selectedDayText
                  : isToday
                  ? styles.todayText
                  : styles.dayText
              }
            >
              {i}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Calculate days needed from next month
    const totalCells = 42; // 6 rows x 7 days
    const remainingCells = totalCells - daysArray.length;

    // Add days from next month
    for (let i = 1; i <= remainingCells; i++) {
      daysArray.push(
        <TouchableOpacity
          key={`next-${i}`}
          style={styles.dayButton}
          disabled={true}
        >
          <Text style={styles.dayTextInactive}>{i}</Text>
        </TouchableOpacity>
      );
    }

    // Render calendar as week rows with 7 days each
    const rows = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      const weekDays = daysArray.slice(i, i + 7);
      rows.push(
        <View key={`row-${i}`} style={styles.weekRow}>
          {weekDays}
        </View>
      );
    }

    return rows;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header with close button and title */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date</Text>
                <View style={styles.placeholderView}></View>
              </View>

              {/* Calendar */}
              <View style={styles.calendarContainer}>
                {/* Month navigation */}
                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={goToPreviousMonth}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.monthYearText}>{formatMonthYear()}</Text>
                  <TouchableOpacity onPress={goToNextMonth}>
                    <Ionicons name="chevron-forward" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekdayHeader}>
                  <Text style={styles.weekdayText}>Mon</Text>
                  <Text style={styles.weekdayText}>Tu</Text>
                  <Text style={styles.weekdayText}>We</Text>
                  <Text style={styles.weekdayText}>Th</Text>
                  <Text style={styles.weekdayText}>Fr</Text>
                  <Text style={styles.weekdayText}>Sa</Text>
                  <Text style={styles.weekdayText}>Su</Text>
                </View>

                {/* Calendar grid */}
                <View style={styles.daysContainer}>{renderCalendarGrid()}</View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  placeholderView: {
    width: 24,
  },
  calendarContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: "500",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "500",
    color: "#333",
  },
  daysContainer: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dayButton: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  dayTextInactive: {
    fontSize: 16,
    color: "#ccc",
  },
  selectedDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A1CE50",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDayText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  todayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#A1CE50",
    justifyContent: "center",
    alignItems: "center",
  },
  todayText: {
    fontSize: 16,
    color: "#A1CE50",
    fontWeight: "500",
  },
});

export default DatePickerModal;
