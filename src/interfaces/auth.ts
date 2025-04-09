import { Request } from "express";

/* -- Authentication Interfaces -- */

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role?: string;
    email?: string;
  };
}

export interface JWTError extends Error {
  name: "TokenExpiredError" | "JsonWebTokenError" | "NotBeforeError";
}

export interface DecodedToken {
  userId: number;
  role?: string;
}

export interface RegistrationError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}

export interface UserResponse {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isGuest: boolean;
}
