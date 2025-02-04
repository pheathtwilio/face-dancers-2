/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node", // For backend tests
    roots: ["<rootDir>/test"], // Define where to look for tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // or if your "app" folder is at the root:
        // '^@/(.*)$': '<rootDir>/app/$1',
    },
    transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true, // Enable ESM for OpenAI compatibility
          },
        ],
      },
    // moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    extensionsToTreatAsEsm: [".ts"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]
  };
  