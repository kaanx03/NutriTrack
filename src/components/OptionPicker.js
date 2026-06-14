// src/components/OptionPicker.js
// Ekranın tam ortasında açılan, tema uyumlu seçim modalı.
// Alert.alert tabanlı seçimlerin ve alttan açılan sheet'lerin yerine kullanılır.
//
// Kullanım:
//   <OptionPicker
//     visible={!!picker}
//     title="Select Units"
//     options={["mL", "L", "fl oz", "cups"]}
//     selected={settings.cupUnits}
//     onSelect={(value) => ...}
//     onClose={() => setPicker(null)}
//   />
import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from "../theme";

const OptionPicker = ({
  visible,
  title,
  options = [],
  selected,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      {/* Kartın kendisine basınca kapanmasın */}
      <TouchableOpacity activeOpacity={1} style={styles.card}>
        <Text style={styles.title}>{title}</Text>

        <ScrollView style={styles.optionList} bounces={false}>
          {options.map((option) => {
            const isSelected = option === selected;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    ...SHADOWS.card,
  },
  title: {
    ...TYPOGRAPHY.headerTitle,
    textAlign: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  optionList: {
    maxHeight: 320,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm,
  },
  optionSelected: {
    backgroundColor: "#EFF6FE",
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: SPACING.sm,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
});

export default OptionPicker;
