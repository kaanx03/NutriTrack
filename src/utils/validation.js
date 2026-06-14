// src/utils/validation.js
// Saf, test edilebilir form doğrulama yardımcıları. Her biri geçerliyse null,
// değilse kullanıcıya gösterilecek hata METNİ döner (inline gösterim için).

export const required = (value, label = "This field") =>
  value == null || String(value).trim() === "" ? `${label} is required` : null;

export const minLength = (value, n, label = "This field") =>
  String(value || "").trim().length >= n
    ? null
    : `${label} must be at least ${n} characters`;

// Pozitif sayı (> 0).
export const positiveNumber = (value, label = "Value") => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n <= 0) return `${label} must be greater than 0`;
  return null;
};

// Belirli aralıkta sayı (dahil).
export const numberInRange = (value, min, max, label = "Value") => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return null;
};

export const email = (value, label = "Email") => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(String(value || "").trim()) ? null : `${label} is invalid`;
};

// Bir alan->kural haritasını çalıştırıp ilk hatayı ya da null döndürür.
// errors objesi { field: messageOrNull } biçiminde döner; isValid yardımcı.
export const runValidators = (validatorsByField) => {
  const errors = {};
  let isValid = true;
  for (const field of Object.keys(validatorsByField)) {
    const msg = validatorsByField[field]();
    errors[field] = msg;
    if (msg) isValid = false;
  }
  return { errors, isValid };
};

// fetch ağ hatasını tanı (çevrimdışı durumu için). RN'de ağ hatası genelde
// "Network request failed" mesajlı bir TypeError olur.
export const isNetworkError = (err) => {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    err.name === "AbortError"
  );
};
