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
    "prettier",
  ],
  settings: {
    "import/ignore": ["react-native"],
    "import/resolver": {
      typescript: {
        project: process.cwd() + "./tsconfig.json",
      },
    },
  },
  rules: {
    "arrow-body-style": "error",
    curly: "error",
    eqeqeq: "error",
    "logical-assignment-operators": ["error", "never"],
    "multiline-comment-style": "error",
    "no-floating-decimal": "error",
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
  root: true,
};
