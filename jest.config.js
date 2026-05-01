module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: [
    "./jest.setup.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/gt/",
    "/tt/",
    "/p1/",
    "/proj3/",
    "/proj4/",
    "/poj2/",
    "/Proj5/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/gt/", "<rootDir>/tt/", "<rootDir>/p1/", "<rootDir>/proj3/", "<rootDir>/proj4/", "<rootDir>/poj2/", "<rootDir>/Proj5/"],
  moduleNameMapper: {
    // Redirect all ThemeContext imports to the manual mock
    "(.*)context/ThemeContext": "<rootDir>/packages/ui/context/__mocks__/ThemeContext.tsx",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native(-.*)?|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|resend|svix))",
  ],
};
