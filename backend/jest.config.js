// backend/jest.config.js
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"], // env'i app import edilmeden ÖNCE kur
  testMatch: ["**/__tests__/**/*.test.js"],
  testTimeout: 20000,
  // pg pool gibi açık handle'lar varsa süreç asılı kalmasın
  forceExit: true,
};
