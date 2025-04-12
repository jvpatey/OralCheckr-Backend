import { Request } from "express";

/* -- Authentication Interfaces -- */

// Extends Express Request to include authenticated user information
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role?: string;
    email?: string;
  };
}

// Custom error type for JWT-related errors
export interface JWTError extends Error {
  name: "TokenExpiredError" | "JsonWebTokenError" | "NotBeforeError";
}

// Structure of decoded JWT token payload
export interface DecodedToken {
  userId: number;
  role?: string;
}

// Custom error type for user registration validation errors
export interface RegistrationError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}

// Standardized user response object structure
export interface UserResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isGuest: boolean;
}
