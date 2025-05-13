import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Onboarding
import Onboarding1Screen from "../screens/onboarding/Onboarding1Screen";
import Onboarding2Screen from "../screens/onboarding/Onboarding2Screen";
import Onboarding3Screen from "../screens/onboarding/Onboarding3Screen";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen1 from "../screens/auth/SignUpScreen1";
import SignUpScreen2 from "../screens/auth/SignUpScreen2";
import SignUpScreen3 from "../screens/auth/SignUpScreen3";
import SignUpScreen4 from "../screens/auth/SignUpScreen4";
import SignUpScreen5 from "../screens/auth/SignUpScreen5";
import SignUpScreen6 from "../screens/auth/SignUpScreen6";
import SignUpScreen7 from "../screens/auth/SignUpScreen7";
import SignUpScreen8 from "../screens/auth/SignUpScreen8";
import SignUpScreen9 from "../screens/auth/SignUpScreen9";
import SignUpScreen10 from "../screens/auth/SignUpScreen10";
import ForgotPasswordScreen1 from "../screens/auth/forgotPassword/ForgotPasswordScreen";
import ForgotPasswordScreen2 from "../screens/auth/forgotPassword/ForgotPasswordScreen2";
import ForgotPasswordScreen3 from "../screens/auth/forgotPassword/ForgotPasswordScreen3";

// Main
import HomeScreen from "../screens/main/HomeScreen";
import FoodSelectionScreen from "../screens/main/FoodSelectionScreen";
import MealDetailsScreen from "../screens/main/MealDetailsScreen";
import FoodDetailsScreen from "../screens/main/FoodDetailsScreen";
import CreateFoodScreen from "../screens/main/CreateFoodScreen"; // Yeni eklendi

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="Onboarding1"
    screenOptions={{ headerShown: false }}
  >
    {/* Onboarding */}
    <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
    <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
    <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
    {/* Auth */}
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp1" component={SignUpScreen1} />
    <Stack.Screen name="SignUp2" component={SignUpScreen2} />
    <Stack.Screen name="SignUp3" component={SignUpScreen3} />
    <Stack.Screen name="SignUp4" component={SignUpScreen4} />
    <Stack.Screen name="SignUp5" component={SignUpScreen5} />
    <Stack.Screen name="SignUp6" component={SignUpScreen6} />
    <Stack.Screen name="SignUp7" component={SignUpScreen7} />
    <Stack.Screen name="SignUp8" component={SignUpScreen8} />
    <Stack.Screen name="SignUp9" component={SignUpScreen9} />
    <Stack.Screen name="SignUp10" component={SignUpScreen10} />
    <Stack.Screen name="ForgotPassword1" component={ForgotPasswordScreen1} />
    <Stack.Screen name="ForgotPassword2" component={ForgotPasswordScreen2} />
    <Stack.Screen name="ForgotPassword3" component={ForgotPasswordScreen3} />
    {/* Main */}
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="FoodSelection" component={FoodSelectionScreen} />
    <Stack.Screen name="MealDetails" component={MealDetailsScreen} />
    <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
    <Stack.Screen name="CreateFood" component={CreateFoodScreen} />
    {/* Yeni eklendi */}
  </Stack.Navigator>
);

export default AppNavigator;
