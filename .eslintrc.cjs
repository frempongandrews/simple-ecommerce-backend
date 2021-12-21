module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb-base",
  ],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: "module",
  },
  rules: {
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "no-unused-vars": "warn",
    "no-console": "warn",
    "import/extensions": "off",
    "import/prefer-default-export": "off",
    "eol-last": "off",
    "no-trailing-spaces": ["error", { "skipBlankLines": true }],
    "object-shorthand": "off",
    "no-underscore-dangle": "off",
    "import/no-mutable-exports": "off",
    "max-len": "off",
    "consistent-return": "warn",
  },
};
