// jest.setup.js (frontend) — native modül mock'ları.
/* eslint-disable no-undef */

// reanimated 4 + worklets jest'te başlatılamıyor (mock.js bile gerçek index'i
// çekiyor). Kullandığımız API yüzeyini kapsayan kendi hafif mock'umuz.
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Animated = { View, createAnimatedComponent: (C) => C };
  const passthrough = (v) => v;
  const easingFn = () => (x) => x;
  return {
    __esModule: true,
    default: Animated,
    View,
    createAnimatedComponent: (C) => C,
    useSharedValue: (v) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useAnimatedKeyboard: () => ({ height: { value: 0 } }),
    useReducedMotion: () => false,
    withTiming: passthrough,
    withSpring: passthrough,
    withDelay: (_, v) => v,
    Easing: { linear: (x) => x, inOut: easingFn, out: easingFn, in: easingFn },
  };
});
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
