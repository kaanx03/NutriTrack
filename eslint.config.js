// eslint.config.js (flat) — hafif, gerçek hata yakalayan kural seti (TS yok).
// Gerçek sorunlar (tanımsız değişken, erişilemez kod) hata; gürültü (kullanılmayan
// değişken, kod kokusu) uyarı → CI gerçek hatalarda düşer, Phase 5'te temizlenir.
const js = require("@eslint/js");
const globals = require("globals");

const sharedRules = {
  "no-undef": "error",
  "no-dupe-keys": "error",
  "no-unreachable": "error",
  "no-cond-assign": "error",
  "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  "no-empty": "warn",
  "no-useless-catch": "warn",
  "no-useless-escape": "warn",
};

module.exports = [
  js.configs.recommended,
  {
    // Frontend (React Native / ESM / JSX)
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
      },
    },
    rules: sharedRules,
  },
  {
    // Backend (Node / CommonJS)
    files: ["backend/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: sharedRules,
  },
  {
    ignores: [
      "node_modules/**",
      "backend/node_modules/**",
      "**/__tests__/**",
      "jest.setup.js",
      "*.config.js",
    ],
  },
];
