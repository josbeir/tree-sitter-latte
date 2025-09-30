const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["vendor/**", "src/**", "build/**", "node_modules/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Tree-sitter grammar DSL functions
        grammar: "readonly",
        seq: "readonly",
        choice: "readonly",
        repeat: "readonly",
        repeat1: "readonly",
        optional: "readonly",
        prec: "readonly",
        token: "readonly",
        alias: "readonly",
        field: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
