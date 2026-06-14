// src/config.js — single source of truth for environment-specific values
import { Platform } from "react-native";

// Android emulator routes 10.0.2.2 to the host machine.
// iOS simulator and physical devices use the host's LAN IP.
// Override with EXPO_PUBLIC_API_URL in your .env for physical device testing:
//   EXPO_PUBLIC_API_URL=http://192.168.1.x:3001/api
const DEFAULT_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3001/api"
    : "http://localhost:3001/api";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;
