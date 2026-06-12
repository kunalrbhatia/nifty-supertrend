export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!otplib|@otplib|@scure|@noble|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    'src/server.ts',
    'src/main.ts',
    'src/telegram/bot.ts',
    'src/scripts/',
    'src/helpers/api.ts'
  ],
  setupFiles: ['./jest.setup.js'],
};
