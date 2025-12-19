const { defineConfig } = require("eslint/config");
const expoFlat = require("eslint-config-expo/flat");

const expoConfigs = Array.isArray(expoFlat) ? expoFlat : [expoFlat];

module.exports = defineConfig([
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    ...(expoConfigs[0] ?? {}),
  },
  ...expoConfigs.slice(1),
  {
    ignores: ["dist/*"],
  },
]);
