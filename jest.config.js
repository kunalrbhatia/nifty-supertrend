export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
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
  coverageThreshold: {
    global: {
      lines: 75,
      functions: 75,
      branches: 70,
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
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|@scure|otplib|@otplib|@noble|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)'
  ]
};
