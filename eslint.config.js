// eslint.config.js (flat) — hafif, gerçek hata yakalayan kural seti (TS yok).
// Gerçek sorunlar (tanımsız değişken, erişilemez kod) hata; gürültü (kullanılmayan
// import/değişken, kod kokusu) uyarı → CI gerçek hatalarda düşer.
const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const unusedImports = require("eslint-plugin-unused-imports");

const sharedRules = {
  "no-undef": "error",
  "no-dupe-keys": "error",
  "no-unreachable": "error",
  "no-cond-assign": "error",
  // Çekirdek no-unused-vars kapalı; yerine auto-fix edebilen unused-imports.
  "no-unused-vars": "off",
  "unused-imports/no-unused-imports": "warn", // import'lar otomatik temizlenir
  "unused-imports/no-unused-vars": [
    "warn",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
      caughtErrors: "none", // kullanılmayan catch(e) bağlamaları gürültü değil
    },
  ],
  "no-empty": "warn",
  "no-useless-catch": "warn",
  "no-useless-escape": "warn",
};

module.exports = [
  js.configs.recommended,
  {
    // Frontend (React Native / ESM / JSX)
    files: ["src/**/*.js"],
    plugins: { react, "unused-imports": unusedImports },
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
    rules: {
      ...sharedRules,
      // JSX'te kullanılan import'ları "kullanılmış" say (React/Text/View vb.).
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
    },
  },
  {
    // Backend (Node / CommonJS)
    files: ["backend/src/**/*.js"],
    plugins: { "unused-imports": unusedImports },
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
