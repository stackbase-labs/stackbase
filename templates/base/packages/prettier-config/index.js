/** @typedef {import("prettier").Config} PrettierConfig */

/** @type { PrettierConfig } */
const config = {
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-packagejson",
  ],
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  endOfLine: "lf",
  overrides: [
    {
      files: ["**/*.{ts,tsx,md}"],
    },
  ],
};

export default config;
