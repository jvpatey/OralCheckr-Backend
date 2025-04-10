import { SignOptions } from "jsonwebtoken";

/* -- Time Constants -- */

// Time units in milliseconds
export const MILLISECONDS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Token expiration times
export const TOKEN_EXPIRATION: { [key: string]: SignOptions["expiresIn"] } = {
  GUEST: "1d", // Guest tokens expire in 1 day
  USER: "7d", // Regular user tokens expire in 7 days
  TEST: "1h", // Test tokens expire in 1 hour
};

// Cookie expiration times
export const COOKIE_EXPIRATION = {
  GUEST: MILLISECONDS.DAY, // Guest cookies expire in 1 day
  USER: MILLISECONDS.WEEK, // Regular user cookies expire in 7 days
  TEST: MILLISECONDS.HOUR, // Test cookies expire in 1 hour
};
