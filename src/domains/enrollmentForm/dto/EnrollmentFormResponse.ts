import { Question } from './CreateEnrollmentFormDto.js';

export interface EnrollmentFormResponse {
  id: string;
  mclassId: string;
  title: string;
  description: string | null;
  questions: Question[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
