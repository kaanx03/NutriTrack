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

// PARITY: the util must produce EXACTLY what the old inline calc in
// LoginScreen/SignUpScreen10 produced — these drive the calorie target, so any
// drift would change every user's goal. This guards the rewire.
describe("calculateCaloriesAndMacros parity with old inline calc", () => {
  // Verbatim copy of the pre-extraction inline math (BMR + multiplier + macros).
  const oldInline = (weight, height, age, gender, activityLevel) => {
    const bmr =
      gender && gender.toLowerCase() === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    const multiplier =
      { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9 }[activityLevel] || 1.55;
    const calories = Math.round(bmr * multiplier);
    return {
      calories,
      carbs: Math.round((calories * 0.5) / 4),
      protein: Math.round((calories * 0.3) / 4),
      fat: Math.round((calories * 0.2) / 9),
    };
  };

  it("matches the old inline output across a grid of inputs", () => {
    const genders = ["male", "female", "Male", "FEMALE"];
    const weights = [50, 70, 95, 120];
    const heights = [150, 175, 190];
    const ages = [18, 24, 40, 65];
    const activities = [1, 2, 3, 4, 5, 99]; // 99 -> default multiplier
    for (const g of genders)
      for (const w of weights)
        for (const h of heights)
          for (const a of ages)
            for (const act of activities) {
              const got = calculateCaloriesAndMacros(w, h, a, g, act);
              const old = oldInline(w, h, a, g, act);
              expect({
                calories: got.calories,
                carbs: got.carbs,
                protein: got.protein,
                fat: got.fat,
              }).toEqual(old);
            }
  });
});
