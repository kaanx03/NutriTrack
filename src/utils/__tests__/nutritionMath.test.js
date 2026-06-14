import {
  calculateAge,
  calculateBMR,
  calculateCaloriesAndMacros,
  calculateBMI,
  getBMICategory,
} from "../nutritionMath";

describe("nutritionMath", () => {
  it("calculateBMR Mifflin-St Jeor (male vs female)", () => {
    // male: 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBMR(80, 180, 30, "male")).toBe(1780);
    // female: ... - 161 = 1614
    expect(calculateBMR(80, 180, 30, "female")).toBe(1614);
  });

  it("calculateCaloriesAndMacros (the 2990 case: 95kg/175cm/age24/male/3)", () => {
    const r = calculateCaloriesAndMacros(95, 175, 24, "male", 3);
    // bmr = 950 + 1093.75 - 120 + 5 = 1928.75 ; *1.55 = 2989.56 -> 2990
    expect(r.calories).toBe(2990);
    expect(r.carbs).toBe(Math.round((2990 * 0.5) / 4)); // 374
    expect(r.protein).toBe(Math.round((2990 * 0.3) / 4)); // 224
    expect(r.fat).toBe(Math.round((2990 * 0.2) / 9)); // 66
  });

  it("activity multiplier defaults to 1.55 for unknown level", () => {
    const known = calculateCaloriesAndMacros(80, 180, 30, "male", 3);
    const unknown = calculateCaloriesAndMacros(80, 180, 30, "male", 99);
    expect(unknown.calories).toBe(known.calories);
  });

  it("calculateBMI + guards", () => {
    expect(calculateBMI(80, 178)).toBeCloseTo(25.25, 1);
    expect(calculateBMI(0, 178)).toBe(0);
    expect(calculateBMI(80, 0)).toBe(0);
  });

  it("getBMICategory thresholds", () => {
    expect(getBMICategory(15)).toBe("Very Severely Underweight");
    expect(getBMICategory(22)).toBe("Normal");
    expect(getBMICategory(27)).toBe("Overweight");
    expect(getBMICategory(32)).toBe("Obese Class I");
    expect(getBMICategory(45)).toBe("Obese Class III");
  });

  it("calculateAge returns a whole number for a known birthdate", () => {
    const age = calculateAge("2000-01-01T00:00:00");
    expect(Number.isInteger(age)).toBe(true);
    expect(age).toBeGreaterThanOrEqual(25);
  });
});
