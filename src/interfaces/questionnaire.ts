/* -- Questionnaire Interfaces -- */

// Type for the question type
export type QuestionType = "RADIO" | "CHECKBOX" | "RANGE";

// Structure for a question option
export interface QuestionOption {
  optionId: number;
  optionLabel: string;
}

// Structure for a question
export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  options: QuestionOption[];
}

// Structure for a questionnaire response
export interface QuestionnaireResponse {
  id?: number;
  userId: number;
  responses: Record<number, number | number[]>;
  totalScore: number;
  currentQuestion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Structure for questionnaire progress
export interface QuestionnaireProgress {
  id?: number;
  userId: number;
  responses: Record<number, number | number[]>;
  currentQuestion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Structure for validation errors
export interface ValidationError {
  field: string;
  message: string;
}

// Structure for questionnaire errors
export interface QuestionnaireError {
  error: string;
  details?: string;
  errors?: ValidationError[];
}

// Structure for decoded token
export interface DecodedToken {
  userId: number;
}

// Structure for Sequelize validation errors
export interface SequelizeValidationError extends Error {
  errors: ValidationError[];
}

// Structure for questionnaire request body
export interface QuestionnaireRequestBody {
  responses: Record<number, number | number[]>;
  totalScore: number;
}
