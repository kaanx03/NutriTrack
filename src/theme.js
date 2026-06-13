// src/theme.js — NutriTrack design tokens (SINGLE SOURCE OF TRUTH).
// İki katman: CORE (ham renk rampaları) → SEMANTIC (ekranların kullandığı
// anlamsal tokenlar). Ekranlar yalnızca COLORS / CHART / SPACING / RADIUS /
// TYPOGRAPHY kullanır; sabit hex KULLANMA.
//
// Tüm metin/zemin eşleşmeleri WCAG AA doğrulandı (gövde 4.5:1, büyük/grafik 3:1).
// Kural: success/water/weight beyaz metin taşıyorsa *Strong* adımını kullan;
// amber HER ZAMAN koyu metinle eşleşir (beyaz metin amber'da okunmaz).

// ---------------------------------------------------------------------------
// CORE / primitive ramps — ekranlar bunlara DOĞRUDAN referans vermez.
// ---------------------------------------------------------------------------
const NEUTRAL = {
  0: "#FFFFFF",
  50: "#F6F8FA",
  100: "#ECEFF3",
  200: "#DFE4EA",
  300: "#C7CED6",
  400: "#97A1AD",
  500: "#646E79",
  600: "#515B66",
  700: "#39424B",
  800: "#242A31",
  900: "#13171B",
};
const BLUE = { 50: "#ECF2FE", 100: "#D4E2FD", 400: "#5187EB", 500: "#2C66DC", 600: "#1E51BE", 700: "#173E90" };
const GREEN = { 50: "#E9F5E8", 100: "#CDE8C9", 400: "#57B257", 500: "#3C9A45", 600: "#2E7A37" };
const AMBER = { 400: "#FBC52F", 500: "#F2A413", 600: "#B9790B" };
const CYAN = { 400: "#35B6E8", 500: "#0E98D8", 600: "#0A78AC" };
const ORANGE = { 500: "#F2511E", 600: "#C53D12" };
const RED = { 50: "#FCEBE9", 500: "#D63A2D", 600: "#AE2C21" };

// ---------------------------------------------------------------------------
// SEMANTIC — ekranların kullandığı tokenlar (CORE'a referans verir).
// Not: anahtar isimleri korunur; tüm ekranlar zaten COLORS.* üzerinden geçtiği
// için değerleri burada değiştirmek paleti tek noktadan günceller.
// ---------------------------------------------------------------------------
export const COLORS = {
  // Brand / action
  primary: BLUE[500], // birincil CTA, seçili nav (beyaz metin AA 5.20)
  primaryDark: BLUE[600], // basılı durum
  primarySoft: BLUE[50], // açık zemin (chip, ikon arkası)
  info: BLUE[500],

  // Semantic state
  success: GREEN[500], // pozitif / kalori (grafik 3:1)
  successDark: GREEN[600], // beyaz metin/koyu vurgu (AA) — kalori aşımı
  warning: AMBER[500], // dikkat / aktivite — DAİMA koyu metin
  danger: RED[500],
  dangerStrong: RED[600],

  // Domain accents
  water: CYAN[500],
  waterStrong: CYAN[600], // beyaz metin taşıyan su dolguları
  weight: ORANGE[500],
  weightStrong: ORANGE[600],
  activity: AMBER[500],
  food: GREEN[500],

  // Surfaces
  background: NEUTRAL[50],
  surface: NEUTRAL[0],
  surfaceMuted: NEUTRAL[100],

  // Text
  textPrimary: NEUTRAL[900],
  textSecondary: NEUTRAL[700],
  textTertiary: NEUTRAL[500],
  textOnColor: NEUTRAL[0],

  // States
  disabled: NEUTRAL[300],
  disabledText: NEUTRAL[400],

  // Lines & misc
  border: NEUTRAL[200],
  borderStrong: NEUTRAL[300],
  divider: NEUTRAL[200],
  avatarBg: NEUTRAL[100],
  avatarIcon: NEUTRAL[400],
  shadow: NEUTRAL[900],
  overlay: "rgba(19,23,27,0.5)",

  // Third-party brand (palette DIŞI — açıkça izole). Yalnızca Google girişine ait.
  brandGoogle: "#4285F4",
};

// Data-viz / grafik paleti — markadan BAĞIMSIZ ve SABİT tutulur ki grafikler
// ve makro lejantları palet değişiminde KAYMASIN. (Protein makrosu tasarımca
// marka mavisine bağlı olduğundan COLORS.primary kullanır; burada yok.)
export const CHART = {
  carbs: "#F54336", // makro: karbonhidrat
  fat: "#FF9800", // makro: yağ (eski #FE9820 ile birleştirildi)
};

// Domain → renk eşlemesi (yardımcı erişim).
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
  sm: 8,
  md: 12, // butonlar, kompakt kartlar
  lg: 16, // standart kartlar
  pill: 999,
};

// Minimum dokunma hedefi (erişilebilirlik).
export const TOUCH_TARGET = 48;

export const SHADOWS = {
  card: {
    shadowColor: NEUTRAL[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    shadowColor: NEUTRAL[900],
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

export const PAGE_HORIZONTAL_PADDING = SPACING.xl;
