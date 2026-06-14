import {
  required,
  minLength,
  positiveNumber,
  numberInRange,
  email,
  runValidators,
  isNetworkError,
} from "../validation";

describe("validation util", () => {
  it("required", () => {
    expect(required("")).toMatch(/required/i);
    expect(required("   ")).toMatch(/required/i);
    expect(required(null, "Name")).toBe("Name is required");
    expect(required("ok")).toBeNull();
  });

  it("minLength", () => {
    expect(minLength("a", 2)).toMatch(/at least 2/);
    expect(minLength("ab", 2)).toBeNull();
  });

  it("positiveNumber", () => {
    expect(positiveNumber("0", "Calories")).toMatch(/greater than 0/);
    expect(positiveNumber("-5")).toMatch(/greater than 0/);
    expect(positiveNumber("abc")).toMatch(/must be a number/);
    expect(positiveNumber("30")).toBeNull();
  });

  it("numberInRange (weight 1-500)", () => {
    expect(numberInRange("0", 1, 500, "Weight")).toMatch(/between 1 and 500/);
    expect(numberInRange("600", 1, 500, "Weight")).toMatch(/between 1 and 500/);
    expect(numberInRange("80", 1, 500, "Weight")).toBeNull();
    expect(numberInRange("x", 1, 500)).toMatch(/must be a number/);
  });

  it("email", () => {
    expect(email("not-an-email")).toMatch(/invalid/i);
    expect(email("a@b.co")).toBeNull();
  });

  it("runValidators aggregates + isValid", () => {
    const r = runValidators({
      name: () => required("", "Name"),
      cals: () => positiveNumber("30"),
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.name).toMatch(/required/i);
    expect(r.errors.cals).toBeNull();

    const ok = runValidators({ a: () => required("x"), b: () => positiveNumber("5") });
    expect(ok.isValid).toBe(true);
  });

  it("isNetworkError detects offline-style failures", () => {
    expect(isNetworkError(new Error("Network request failed"))).toBe(true);
    expect(isNetworkError({ name: "AbortError" })).toBe(true);
    expect(isNetworkError(new Error("HTTP Error: 500"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
