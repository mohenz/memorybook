module.exports = {
  clearMocks: true,
  restoreMocks: true,
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': '<rootDir>/config/jest-esbuild-transformer.cjs',
  },
};
