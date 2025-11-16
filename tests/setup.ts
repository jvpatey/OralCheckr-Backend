/*-- Global Test Environment Setup --*/

// Set the test environment
process.env.NODE_ENV = "test";

// Set the JWT secret
process.env.JWT_SECRET = "testsecret";

// Set a dummy DATABASE_URL so db config parsing works in tests
process.env.DATABASE_URL =
  "postgres://testuser:testpass@localhost:5432/testdb";

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
