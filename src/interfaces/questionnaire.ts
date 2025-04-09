/* -- Questionnaire Interfaces -- */

export type QuestionType = "RADIO" | "CHECKBOX" | "RANGE";

export interface QuestionOption {
  optionId: number;
  optionLabel: string;
}

export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  options: QuestionOption[];
}

export interface QuestionnaireResponse {
  id?: number;
  userId: number;
  responses: Record<number, number | number[]>;
  totalScore: number;
  currentQuestion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionnaireProgress {
  id?: number;
  userId: number;
  responses: Record<number, number | number[]>;
  currentQuestion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface QuestionnaireError {
  error: string;
  details?: string;
  errors?: ValidationError[];
}
