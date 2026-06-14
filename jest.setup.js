// jest.setup.js (frontend) — native modül mock'ları.
/* eslint-disable no-undef */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Haptics sarmalayıcısı testte no-op olsun (native titreşim/expo-haptics yok).
jest.mock("./src/utils/haptics", () => ({
  hapticLight: jest.fn(),
  hapticSelection: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
}));

// @expo/vector-icons, expo-font -> expo-asset zincirini çekiyor; testte ikon
// render'ı gerekmiyor, basit bir host bileşeniyle değiştir.
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const Icon = (props) => React.createElement("Icon", props);
  return { Ionicons: Icon, MaterialIcons: Icon, FontAwesome: Icon };
});

// expo-haptics testte gerçek native çağrı yapmasın
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));
