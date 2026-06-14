// src/utils/motion.js
// Hareket (animasyon) yardımcıları. Tüm animasyonlar OS "reduce motion"
// ayarına saygı göstermeli: açıkken anlık/animasyonsuz davran.
import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

// Süreler — tasarım kuralı: hızlı (150) / temel (220) / yavaş (300) ms.
export const DURATION = { fast: 150, base: 220, slow: 300 };

// OS "reduce motion" açık mı? React state; ayar değişince güncellenir.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (AccessibilityInfo.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v) => {
          if (mounted) setReduced(!!v);
        })
        .catch(() => {});
    }
    const sub = AccessibilityInfo.addEventListener
      ? AccessibilityInfo.addEventListener("reduceMotionChanged", (v) =>
          setReduced(!!v)
        )
      : null;
    return () => {
      mounted = false;
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  return reduced;
}
