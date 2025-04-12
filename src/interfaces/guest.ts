/* -- Guest User Interfaces -- */

// Response structure for successful guest user login
export interface GuestLoginResponse {
  message: string;
  userId: number;
  role: string;
}

// Response structure for successful guest to regular user conversion
export interface GuestConversionResponse {
  message: string;
  user: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    isGuest: boolean;
  };
  dataMigrated: {
    questionnaires: number;
    habits: number;
    habitLogs: number;
  };
}

// Custom error type for guest conversion validation failures
export interface GuestConversionError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}
