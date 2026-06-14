import {
  formatNumber,
  formatKcal,
  formatGrams,
  formatMl,
  formatLiters,
  formatKg,
  formatBmi,
  formatDate,
  formatDateRange,
} from "../format";

describe("format util", () => {
  it("formatNumber rounds + thousands separator", () => {
    expect(formatNumber(2989.6)).toBe("2,990");
    expect(formatNumber("1234")).toBe("1,234");
    expect(formatNumber(null)).toBe("0");
  });

  it("formatKcal", () => {
    expect(formatKcal(2989.6)).toBe("2,990 kcal");
  });

  it("formatGrams with/without decimals", () => {
    expect(formatGrams(150.4)).toBe("150 g");
    expect(formatGrams(12.34, 1)).toBe("12.3 g");
  });

  it("formatMl + formatLiters", () => {
    expect(formatMl(1500)).toBe("1,500 mL");
    expect(formatLiters(1500)).toBe("1.5 L");
  });

  it("formatKg", () => {
    expect(formatKg(80)).toBe("80.0 kg");
    expect(formatKg(80.25, 2)).toBe("80.25 kg");
  });

  it("formatBmi one decimal", () => {
    expect(formatBmi(22.49)).toBe("22.5");
  });

  it("formatDate medium", () => {
    expect(formatDate("2026-06-14T00:00:00")).toBe("Jun 14, 2026");
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formatDateRange", () => {
    expect(formatDateRange("2026-06-08T00:00:00", "2026-06-14T00:00:00")).toBe(
      "Jun 8 - Jun 14, 2026"
    );
  });

  it("handles pg NUMERIC strings", () => {
    expect(formatKg("95.00")).toBe("95.0 kg");
    expect(formatNumber("2990.00")).toBe("2,990");
  });
});
