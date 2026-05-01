module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "./jest.setup.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/gt/",
    "/p1/",
    "/proj3/",
    "/proj4/",
    "/poj2/",
    "/Proj5/",
  ],
  moduleNameMapper: {
    // Redirect all ThemeContext imports to the manual mock
    "(.*)context/ThemeContext": "<rootDir>/packages/ui/context/__mocks__/ThemeContext.tsx",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native(-.*)?|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|resend|svix))",
  ],
};
