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
// Food
import FoodSelectionScreen from "../screens/main/food/FoodSelectionScreen";
import MealDetailsScreen from "../screens/main/food/MealDetailsScreen";
import FoodDetailsScreen from "../screens/main/food/FoodDetailsScreen";
import CreateFoodScreen from "../screens/main/food/CreateFoodScreen";

// Activity
import ActivitySelectionScreen from "../screens/main/activity/ActivitySelectionScreen";
import ActivityDetailsScreen from "../screens/main/activity/ActivityDetailsScreen";
import CreateActivityScreen from "../screens/main/activity/CreateActivityScreen";
import ActivityLogScreen from "../screens/main/activity/ActivityLogScreen";

// Notifications
import NotificationsScreen from "../screens/main/NotificationsScreen";

// Tracker
import TrackerScreen from "../screens/main/TrackerScreen";

// Insights
import InsightsScreen from "../screens/main/InsightsScreen";

// Articles
import ArticlesScreen from "../screens/main/articles/ArticlesScreen";
import ArticleDetailsScreen from "../screens/main/articles/ArticleDetailsScreen";
import CategoryArticlesScreen from "../screens/main/articles/CategoryArticlesScreen";
import SavedArticlesScreen from "../screens/main/articles/SavedArticlesScreen";

// Settings/Profile
import ProfileScreen from "../screens/main/settings/ProfileScreen";
import ContactSupportScreen from "../screens/main/settings/ContactSupportScreen";
import PersonalInfoScreen from "../screens/main/settings/PersonalInfoScreen";
import CalorieCounterScreen from "../screens/main/settings/CalorieCounterScreen";
import WaterTrackerScreen from "../screens/main/settings/WaterTrackerScreen";
import WeightTrackerScreen from "../screens/main/settings/WeightTrackerScreen";
import HelpSupportScreen from "../screens/main/settings/HelpSupportScreen";
import AboutUsScreen from "../screens/main/settings/AboutUsScreen";
import TermsOfServiceScreen from "../screens/main/settings/TermsOfServiceScreen";
import PrivacyPolicyScreen from "../screens/main/settings/PrivacyPolicyScreen";
import FAQScreen from "../screens/main/settings/FAQScreen";

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
    <Stack.Screen name="Tracker" component={TrackerScreen} />
    <Stack.Screen name="Insights" component={InsightsScreen} />

    {/* Articles - Tüm article sayfaları */}
    <Stack.Screen name="Articles" component={ArticlesScreen} />
    <Stack.Screen name="ArticleDetails" component={ArticleDetailsScreen} />
    <Stack.Screen name="CategoryArticles" component={CategoryArticlesScreen} />
    <Stack.Screen name="SavedArticles" component={SavedArticlesScreen} />

    {/* Settings/Profile - Tüm settings sayfaları */}
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
    <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
    <Stack.Screen name="CalorieCounter" component={CalorieCounterScreen} />
    <Stack.Screen name="WaterTracker" component={WaterTrackerScreen} />
    <Stack.Screen name="WeightTracker" component={WeightTrackerScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="AboutUs" component={AboutUsScreen} />
    <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />

    {/* Food */}
    <Stack.Screen name="FoodSelection" component={FoodSelectionScreen} />
    <Stack.Screen name="MealDetails" component={MealDetailsScreen} />
    <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
    <Stack.Screen name="CreateFood" component={CreateFoodScreen} />

    {/* Activity */}
    <Stack.Screen
      name="ActivitySelection"
      component={ActivitySelectionScreen}
    />
    <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
    <Stack.Screen name="CreateActivity" component={CreateActivityScreen} />
    <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />

    {/* Notifications */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export default AppNavigator;
