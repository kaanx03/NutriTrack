// src/navigation/MainTabs.js
// Ana 5 sekme — parmakla yatay kaydırılabilir (Instagram tarzı).
// Alt bar: swipe pozisyonuna bağlı YUMUŞAK renk geçişi (crossfade), native his.
import React from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme";

import HomeScreen from "../screens/main/HomeScreen";
import TrackerScreen from "../screens/main/TrackerScreen";
import InsightsScreen from "../screens/main/InsightsScreen";
import ArticlesScreen from "../screens/main/articles/ArticlesScreen";
import AICoachScreen from "../screens/main/AICoachScreen";
import ProfileScreen from "../screens/main/settings/ProfileScreen";

const Tabs = createMaterialTopTabNavigator();

// Sekme adı → ikon + kısa etiket (outline = pasif, dolu = aktif)
const NAV_ICONS = {
  Home: { icon: "home-outline", active: "home", label: "Home" },
  Tracker: { icon: "grid-outline", active: "grid", label: "Tracker" },
  Insights: {
    icon: "stats-chart-outline",
    active: "stats-chart",
    label: "Insights",
  },
  Articles: { icon: "newspaper-outline", active: "newspaper", label: "Articles" },
  AICoach: {
    icon: "chatbubble-ellipses-outline",
    active: "chatbubble-ellipses",
    label: "Coach",
  },
  Profile: { icon: "person-outline", active: "person", label: "Profile" },
};

// Özel alt bar — material-top-tabs'tan gelen `position` ile renk/opaklık
// kaydırma boyunca akışkan değişir.
// Not: alt güvenli-alan boşluğu kapsayıcı (MainTabs) View'inde verilir,
// burada verilmez — böylece bar sistem tuşlarının tam üst sınırına oturur.
function MainTabBar({ state, navigation, position }) {
  const inputRange = state.routes.map((_, i) => i);

  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index;
        const icons = NAV_ICONS[route.name];

        // Bu sekmenin "aktiflik" oranı: kaydırma bu sekmeye yaklaştıkça 1'e gider
        const activeOpacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map((i) => (i === index ? 1 : 0)),
          extrapolate: "clamp",
        });
        const inactiveOpacity = position.interpolate({
          inputRange,
          outputRange: inputRange.map((i) => (i === index ? 0 : 1)),
          extrapolate: "clamp",
        });

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.navItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {/* İki ikon üst üste — kaydırırken yumuşak crossfade */}
            <View style={styles.iconStack}>
              <Animated.View style={{ opacity: inactiveOpacity }}>
                <Ionicons
                  name={icons.icon}
                  size={24}
                  color={COLORS.textTertiary}
                />
              </Animated.View>
              <Animated.View
                style={[styles.iconAbsolute, { opacity: activeOpacity }]}
              >
                <Ionicons name={icons.active} size={24} color={COLORS.primary} />
              </Animated.View>
            </View>
            {/* İki yazı üst üste — renk de ikon gibi crossfade
                (native driver color interpolasyonu desteklemediği için) */}
            <View style={styles.labelStack}>
              <Animated.Text
                style={[
                  styles.navText,
                  { color: COLORS.textTertiary, opacity: inactiveOpacity },
                ]}
              >
                {icons.label}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.navText,
                  styles.labelAbsolute,
                  { color: COLORS.primary, opacity: activeOpacity },
                ]}
              >
                {icons.label}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    // Alt güvenli-alan boşluğu burada (kapsayıcıda) verilir; alt bar bu
    // boşluğun hemen üstüne, sistem tuşlarının tam sınırına oturur.
    // Boşluk bölgesi beyaz kalır → sistem şeridiyle birleşik görünür.
    <View
      style={{
        flex: 1,
        // Sistem tuşlarına yakın dursun diye inset'ten birkaç px kıs
        paddingBottom: Math.max(insets.bottom - 8, 0),
        backgroundColor: COLORS.surface,
      }}
    >
      <Tabs.Navigator
        tabBarPosition="bottom"
        tabBar={(props) => <MainTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <Tabs.Screen name="Home" component={HomeScreen} />
        <Tabs.Screen name="Tracker" component={TrackerScreen} />
        <Tabs.Screen name="Insights" component={InsightsScreen} />
        <Tabs.Screen name="Articles" component={ArticlesScreen} />
        <Tabs.Screen name="AICoach" component={AICoachScreen} />
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      </Tabs.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    flex: 1,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  iconStack: {
    width: 24,
    height: 24,
    marginBottom: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  iconAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  navText: {
    fontSize: 12,
  },
  labelStack: {
    justifyContent: "center",
    alignItems: "center",
  },
  labelAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    textAlign: "center",
  },
});

export default MainTabs;
