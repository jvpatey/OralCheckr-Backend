/* -- Google Auth Interfaces -- */

// Structure of the payload received from Google OAuth token
export interface GoogleTokenPayload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// Response structure for successful Google login
export interface GoogleLoginResponse {
  message: string;
  user: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    isGuest: boolean;
  };
}

// Custom error type for Google authentication failures
export interface GoogleLoginError extends Error {
  name: string;
  message: string;
  stack?: string;
}
