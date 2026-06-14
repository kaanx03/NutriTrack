// src/screens/main/AICoachScreen.js
// AI beslenme koçu — Groq üzerinden (backend proxy). Konuşma cihazda saklanır.
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenHeader from "../../components/ScreenHeader";
import { showToast } from "../../components/AppToast";
import { hapticLight } from "../../utils/haptics";
import NutritionService from "../../services/NutritionService";
import { useAuth } from "../../context/AuthContext";
import { COLORS, SPACING, RADIUS } from "../../theme";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm your NutriTrack coach. Ask me anything about your nutrition, calories, or goals — I can see your recent logs.",
};

const AICoachScreen = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const storageKey = `aiCoach:${user?.id || "anon"}`;

  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef(null);

  // reanimated klavye API'si — edge-to-edge dahil her cihazda gerçek klavye
  // yüksekliğini runtime'da okur, tahmin yok. İçeriği tam o kadar yukarı iter.
  const keyboard = useAnimatedKeyboard();
  const kbStyle = useAnimatedStyle(() => ({
    // Klavye nav çubuğunu da örttüğü için inset'i düşüyoruz; böylece input
    // klavyenin tam üstünde durur, fazla boşluk olmaz.
    paddingBottom: Math.max(keyboard.height.value - insets.bottom, 0),
  }));

  // Konuşmayı yükle / kaydet
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
        } catch (e) {
          // bozuk kayıt — baştan başla
        }
      }
    });
  }, [storageKey]);

  const persist = (msgs) => {
    AsyncStorage.setItem(storageKey, JSON.stringify(msgs.slice(-50))).catch(
      () => {}
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    hapticLight();
    setInput("");

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    persist(next);
    setThinking(true);

    try {
      // Karşılama mesajını bağlamdan çıkar, son 12 mesajı gönder
      const history = next
        .filter((m) => m !== WELCOME)
        .slice(-12)
        .map(({ role, content }) => ({ role, content }));

      const reply = await NutritionService.aiCoach(history);

      const withReply = [...next, { role: "assistant", content: reply }];
      setMessages(withReply);
      persist(withReply);
    } catch (error) {
      const msg = error.message?.includes("AI not configured")
        ? "AI is not configured on the server (missing API key)."
        : "Couldn't reach the coach. Please try again.";
      showToast(msg, "error");
      // Kullanıcı mesajı listede kalsın — tekrar gönderebilir
    } finally {
      setThinking(false);
    }
  };

  const clearChat = () => {
    Alert.alert("Clear conversation", "Delete this chat history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setMessages([WELCOME]);
          AsyncStorage.removeItem(storageKey);
        },
      },
    ]);
  };

  const renderBubble = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={isUser ? styles.userText : styles.assistantText}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="AI Coach"
        rightIcon="trash-outline"
        onRightPress={clearChat}
      />

      <Animated.View style={[styles.flex, kbStyle]}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => `msg_${i}`}
          renderItem={renderBubble}
          style={styles.flex}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            thinking ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.typingText}>Thinking…</Text>
                </View>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputRow,
            // Coach bir SEKME — alt güvenli-alan boşluğu MainTabs kapsayıcısında
            // (tab bar'ın altında) zaten veriliyor. Burada tekrar insets.bottom
            // eklemek input'u tab bar'ın üstünde yukarı itiyordu (çift inset).
            // Sadece küçük bir nefes payı bırak; klavye mantığı (kbStyle) aynen kaldı.
            { paddingBottom: SPACING.md },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            maxLength={2000}
            editable={!thinking}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || thinking) && styles.sendDisabled,
            ]}
            onPress={send}
            disabled={!input.trim() || thinking}
          >
            <Ionicons name="send" size={18} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  list: {
    padding: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: COLORS.surface,
    fontSize: 15,
    lineHeight: 21,
  },
  assistantText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.md,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});

export default AICoachScreen;
