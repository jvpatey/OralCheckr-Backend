/* -- Google Auth Interfaces -- */

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

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

export interface GoogleLoginError extends Error {
  name: string;
  message: string;
  stack?: string;
}
