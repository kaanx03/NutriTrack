// src/utils/format.js
// Sayı / birim / tarih biçimlendirme için TEK kaynak. Ekranlardaki dağınık
// toLocaleString/toFixed/Math.round kullanımının yerine bunları kullan.
// Saf fonksiyonlar (RN importu yok) → kolay test edilir.

// Güvenli sayıya çevirme (pg NUMERIC string olarak gelebilir).
const num = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

// 1234.6 -> "1,235" (binlik ayraçlı, yuvarlanmış)
export const formatNumber = (v) => Math.round(num(v)).toLocaleString("en-US");

// Kalori: 2989.6 -> "2,990 kcal"
export const formatKcal = (v) => `${formatNumber(v)} kcal`;

// Gram makro: 150 -> "150 g" ; ondalık istenirse decimals ver
export const formatGrams = (v, decimals = 0) => {
  const n = num(v);
  return `${decimals > 0 ? n.toFixed(decimals) : Math.round(n)} g`;
};

// Su: 1500 -> "1,500 mL" ; litre gösterimi için formatLiters
export const formatMl = (v) => `${formatNumber(v)} mL`;
export const formatLiters = (v) => `${(num(v) / 1000).toFixed(1)} L`;

// Kilo: 80 -> "80.0 kg"
export const formatKg = (v, decimals = 1) => `${num(v).toFixed(decimals)} kg`;

// BMI: 22.49 -> "22.5"
export const formatBmi = (v) => num(v).toFixed(1);

// Tarih: Date|string -> "Jun 14, 2026"
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Aralık: (a, b) -> "Jun 8 - Jun 14, 2026"
export const formatDateRange = (start, end) => {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const sStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${sStr} - ${formatDate(e)}`;
};
