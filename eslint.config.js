const { defineConfig } = require("eslint/config");
const expoFlat = require("eslint-config-expo/flat");

const expoConfigs = Array.isArray(expoFlat) ? expoFlat : [expoFlat];

const FILES = ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"];

module.exports = defineConfig([
  {
    ...(expoConfigs[0] ?? {}),
    files: FILES,
    ignores: ["dist/**", "node_modules/**", ".expo/**"],
  },
  ...expoConfigs
    .slice(1)
    .map((c) => (c && typeof c === "object" && !Array.isArray(c) ? { ...c, files: c.files ?? FILES } : c)),
]);
