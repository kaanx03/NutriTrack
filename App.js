// App.js - Fixed with Provider Debug and Error Handling
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Font from "expo-font";

import AppNavigator from "./src/navigation/AppNavigator";

import { SignUpProvider } from "./src/context/SignUpContext";
import { WeightProvider } from "./src/context/WeightContext";
import { MealsProvider } from "./src/context/MealsContext";
import { ActivityProvider } from "./src/context/ActivityContext";
import { WaterProvider } from "./src/context/WaterContext";
import { BookmarkProvider } from "./src/context/BookmarkContext";
import { AuthProvider } from "./src/context/AuthContext";
import { InsightsProvider } from "./src/context/InsightsContext";

// Debug helper import
import DebugStorage from "./src/utils/debugStorage";

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    "Roboto-Regular": require("./assets/fonts/Roboto/Roboto-Regular.ttf"),
    "Roboto-Bold": require("./assets/fonts/Roboto/Roboto-Bold.ttf"),
    "Roboto-Medium": require("./assets/fonts/Roboto/Roboto-Medium.ttf"),
    "Roboto-Light": require("./assets/fonts/Roboto/Roboto-Light.ttf"),
  });

  // App başlatıldığında debug bilgileri
  useEffect(() => {
    console.log("🚀 App: Starting up...");

    // Development modunda debug araçlarını başlat
    if (__DEV__) {
      console.log("🛠️ App: Development mode - Debug tools available");

      // Storage durumunu kontrol et
      setTimeout(async () => {
        await DebugStorage.checkAuthStorage();
      }, 2000);

      // Global debug fonksiyonlarını expose et
      global.debugAuth = DebugStorage.checkAuthStorage;
      global.debugClearStorage = DebugStorage.clearAllStorage;
      global.debugAllKeys = DebugStorage.getAllKeys;
    }
  }, []);

  if (!fontsLoaded) {
    console.log("📝 App: Loading fonts...");
    return null;
  }

  console.log("✅ App: Fonts loaded, rendering providers...");

  return (
    <AuthProvider>
      <SignUpProvider>
        <WeightProvider>
          <MealsProvider>
            <ActivityProvider>
              <WaterProvider>
                <BookmarkProvider>
                  <InsightsProvider>
                    <NavigationContainer
                      onStateChange={(state) => {
                        if (__DEV__) {
                          console.log(
                            "🧭 Navigation state changed:",
                            state?.routes?.[state?.index]?.name
                          );
                        }
                      }}
                      onReady={() => {
                        console.log("🧭 Navigation ready");
                      }}
                    >
                      <AppNavigator />
                    </NavigationContainer>
                  </InsightsProvider>
                </BookmarkProvider>
              </WaterProvider>
            </ActivityProvider>
          </MealsProvider>
        </WeightProvider>
      </SignUpProvider>
    </AuthProvider>
  );
}
