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

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    "Roboto-Regular": require("./assets/fonts/Roboto/Roboto-Regular.ttf"),
    "Roboto-Bold": require("./assets/fonts/Roboto/Roboto-Bold.ttf"),
    "Roboto-Medium": require("./assets/fonts/Roboto/Roboto-Medium.ttf"),
    "Roboto-Light": require("./assets/fonts/Roboto/Roboto-Light.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <SignUpProvider>
        <WeightProvider>
          <MealsProvider>
            <ActivityProvider>
              <WaterProvider>
                <BookmarkProvider>
                  <InsightsProvider>
                    {/* InsightsProvider can be used to provide insights data across the app */}
                    <NavigationContainer>
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
