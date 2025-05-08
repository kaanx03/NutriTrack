// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // .native.js uzantısını da çözümlemesi için ekliyoruz
  config.resolver.sourceExts.push("native.js");

  return config;
})();
