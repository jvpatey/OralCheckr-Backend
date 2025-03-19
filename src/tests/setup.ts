// Test environment setup
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecret";
process.env.PORT = "3001";

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
