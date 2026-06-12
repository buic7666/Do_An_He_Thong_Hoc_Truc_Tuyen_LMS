module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/models/**/*.js',
    '!src/config/**/*.js',
  ],
};
