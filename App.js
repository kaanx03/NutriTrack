import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Font from "expo-font";
import AppNavigator from "./src/navigation/AppNavigator";
import { SignUpProvider } from "./src/context/SignUpContext"; // ← Burayı ekledik

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    "Roboto-Regular": require("./assets/fonts/Roboto/Roboto-Regular.ttf"),
    "Roboto-Bold": require("./assets/fonts/Roboto/Roboto-Bold.ttf"),
    "Roboto-Medium": require("./assets/fonts/Roboto/Roboto-Medium.ttf"),
    "Roboto-Light": require("./assets/fonts/Roboto/Roboto-Light.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <SignUpProvider>
      {/* ← Tüm uygulamayı saran context */}
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SignUpProvider>
  );
}
