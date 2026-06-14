// src/components/BottomNavigation.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme";

const BottomNavigation = ({ activeTab = "Home" }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const navItems = [
    {
      name: "Home",
      route: "Home",
      icon: "home",
      activeIcon: "home",
    },
    {
      name: "Tracker",
      route: "Tracker",
      icon: "grid-outline",
      activeIcon: "grid",
    },
    {
      name: "Insights",
      route: "Insights",
      icon: "stats-chart-outline",
      activeIcon: "stats-chart",
    },
    {
      name: "Articles",
      route: "Articles",
      icon: "newspaper-outline",
      activeIcon: "newspaper",
    },
    {
      name: "Profile",
      route: "Profile",
      icon: "person-outline",
      activeIcon: "person",
    },
  ];

  const handleNavigation = (route) => {
    // Detay ekranlarından (örn. Profile > PersonalInfo) alt bara basınca
    // ilgili sekmeye dön. Sekmeler artık MainTabs içinde olduğu için
    // iç içe navigasyon: MainTabs > {sekme}.
    navigation.navigate("MainTabs", { screen: route });
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
      {navItems.map((item) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => handleNavigation(item.route)}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={24}
              color={isActive ? COLORS.primary : COLORS.textTertiary}
              style={styles.navIcon}
            />
            <Text style={[styles.navText, isActive && styles.activeNavText]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  navIcon: {
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  activeNavText: {
    color: COLORS.primary,
  },
});

export default BottomNavigation;
