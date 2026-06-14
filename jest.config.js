// jest.config.js (frontend) — RNTL via jest-expo.
// Backend'in kendi jest yapılandırması var; burada yalnızca src/ altındaki
// testler çalışır (backend hariç tutulur).
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/backend/"],
};
