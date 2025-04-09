/* -- Guest User Interfaces -- */

export interface GuestLoginResponse {
  message: string;
  userId: number;
  role: string;
}

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

export interface GuestConversionError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}
