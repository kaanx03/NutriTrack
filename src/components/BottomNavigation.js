// src/components/BottomNavigation.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const BottomNavigation = ({ activeTab = "Home" }) => {
  const navigation = useNavigation();

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
    if (route !== activeTab) {
      navigation.navigate(route);
    }
  };

  return (
    <View style={styles.bottomNav}>
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
              color={isActive ? "#63A4F4" : "#999"}
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
    height: 64,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#63A4F4",
  },
  navIcon: {
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: "#999",
  },
  activeNavText: {
    color: "#63A4F4",
  },
});

export default BottomNavigation;
