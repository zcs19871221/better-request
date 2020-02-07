module.exports = {
  automock: false,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*.test.[jt]s?(x)',
  ],
  collectCoverageFrom: ['<rootDir>/src/**/*.[jt]s?(x)'],
  coverageDirectory: '<rootDir>/test/coverage',
  coverageThreshold: {
    global: {
      brances: 50,
      functis: 50,
      lines: 50,
      statements: -10,
    },
  },
  errorOnDeprecated: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs)$'],
};
