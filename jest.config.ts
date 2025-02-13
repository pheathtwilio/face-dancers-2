/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node", // For backend tests
    roots: ["<rootDir>/test"], // Define where to look for tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true, // Enable ESM for OpenAI compatibility
          },
        ],
      },
    extensionsToTreatAsEsm: [".ts"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]
  };
  