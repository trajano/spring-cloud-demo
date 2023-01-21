module.exports = {
  extends: [
    "@react-native-community",
    "plugin:@typescript-eslint/strict",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jest/recommended",
    "plugin:react-hooks/recommended",
    "plugin:testing-library/react",
    "universe/native",
    "prettier", // must be last
  ],
  settings: {
    "import/ignore": ["react-native"],
    "import/resolver": {
      typescript: {
        project: process.cwd() + "/tsconfig.json",
      },
    },
  },
  parserOptions: {
    project: [process.cwd() + "/tsconfig.json"],
  },
  rules: {
    "arrow-body-style": "error",
    eqeqeq: "error",
    "logical-assignment-operators": ["error", "never"],
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "prefer-numeric-literals": "error",
    "prefer-object-spread": "error",
    "prefer-template": "error",
    yoda: "error",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/member-ordering": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "import/no-named-as-default": "off",
    "import/no-unresolved": [
      "error",
      {
        ignore: ["@env"],
      },
    ],
    "react-hooks/exhaustive-deps": "error",
    "react/react-in-jsx-scope": "off",
  },
  ignorePatterns: ["coverage/", "dist/", "lib/", "node_modules/"],
  root: true,
};
