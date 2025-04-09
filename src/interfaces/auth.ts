/* -- Authentication Interfaces -- */

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
