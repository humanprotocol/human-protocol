module.exports = {
  coverageDirectory: "../coverage",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testEnvironment: "node",
  testRegex: ".spec.ts$",
  transform: {
    ".+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^axios$": require.resolve("axios"),
    "^uuid$": require.resolve("uuid"),
  },
};
