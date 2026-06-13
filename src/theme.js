// src/theme.js — NutriTrack design tokens (SINGLE SOURCE OF TRUTH).
// Tüm ekranlar renk/boşluk/radius/gölge/tipografi değerlerini buradan almalı.
// Sabit (hardcoded) hex / boşluk / radius KULLANMA — yeni token gerekiyorsa
// burada tanımla.

export const COLORS = {
  // --- Brand ---
  primary: "#63A4F4", // ana mavi (nav, seçili durumlar, birincil CTA)
  primaryDark: "#3C82DA", // basılı durum, birincil buton press state
  primarySoft: "#E7F1FD", // açık mavi zemin (chip, ikon arkası)

  // --- Semantic ---
  success: "#A1CE50", // pozitif / kalori yeşili
  successDark: "#4E7A1E", // kalori aşımı / koyu yeşil vurgusu
  warning: "#FDCD55", // dikkat / aktivite sarısı
  danger: "#E74C3C", // hata / silme / yıkıcı eylem
  info: "#63A4F4", // bilgilendirme (= primary)

  // --- Domain (alan rengi) ---
  // Kural: her veri alanı kendi rengini kullanır; nötr/birincil eylemler
  // `primary` kullanır. Bkz. DOMAIN.
  water: "#1A96F0", // su
  weight: "#FF5726", // kilo
  activity: "#FDCD55", // aktivite (= warning tonu)
  food: "#A1CE50", // yemek (= success tonu)

  // --- Surfaces ---
  background: "#f5f5f5",
  surface: "#FFFFFF",
  surfaceMuted: "#F8F9FA",

  // --- Text ---
  textPrimary: "#333333",
  textSecondary: "#666666",
  textTertiary: "#999999",
  textOnColor: "#FFFFFF",

  // --- States ---
  disabled: "#E0E0E0",
  disabledText: "#B0B8C1",

  // --- Lines & placeholders ---
  border: "#f0f0f0",
  divider: "#f0f0f0",
  avatarBg: "#EDF1F5",
  avatarIcon: "#B0B8C1",
};

// Alan → renk eşlemesi. Bir ekranın hangi domain rengini kullanacağına
// karar verirken buradan oku (örn. Weight CTA = DOMAIN.weight).
export const DOMAIN = {
  food: COLORS.food,
  water: COLORS.water,
  weight: COLORS.weight,
  activity: COLORS.activity,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // standart sayfa yatay padding'i
  xxl: 24,
};

export const RADIUS = {
  sm: 8, // küçük input'lar
  md: 12, // kartlar (kompakt), butonlar
  lg: 16, // kartlar (standart)
  pill: 999, // tam yuvarlak
};

// Minimum dokunma hedefi (erişilebilirlik) — buton/ikon-buton yüksekliği.
export const TOUCH_TARGET = 48;

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: "700", color: COLORS.textPrimary },
  h2: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: "600", color: COLORS.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  body: { fontSize: 14, color: COLORS.textPrimary },
  bodyStrong: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  button: { fontSize: 16, fontWeight: "600" },
  caption: { fontSize: 12, color: COLORS.textSecondary },
};

// Tüm sayfalarda aynı içerik genişliği için
export const PAGE_HORIZONTAL_PADDING = SPACING.xl;
