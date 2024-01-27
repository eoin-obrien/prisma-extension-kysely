/* eslint-env node */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/examples/",
    "/dist/",
    "/coverage/"
  ],
  workerThreads: true,
};
