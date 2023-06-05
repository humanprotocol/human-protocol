module.exports = {
  coverageDirectory: "../coverage",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src/modules",
  testEnvironment: "node",
  testRegex: ".spec.ts$",
  transform: {
    ".+\\.ts$": "ts-jest",
  },
  moduleNameMapper: {
    uuid: require.resolve("uuid"),
  },
};
