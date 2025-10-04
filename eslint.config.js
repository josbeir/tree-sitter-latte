import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "vendor/**",
      "src/**",
      "build/**",
      "node_modules/**",
      "bindings/**",
      "tree-sitter-html/**",
    ],
  },
  {
    files: ["grammar.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
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
