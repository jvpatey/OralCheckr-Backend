/*-- Global Test Environment Setup --*/

// Set the test environment
process.env.NODE_ENV = "test";

// Set the JWT secret
process.env.JWT_SECRET = "testsecret";

// Set the port
process.env.PORT = "3001";

// Mock the console object
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
