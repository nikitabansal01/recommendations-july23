/**
 * Survey Responses Types
 * Centralized TypeScript interfaces for survey data
 */

import { LabValues } from './LabValues';

export interface SurveyResponses {
  q1_period: string;
  q1_cycle_length: string;
  q2_last_period: string;
  q2_dont_remember: boolean;
  q3_flow: string;
  q4_symptoms: string[];
  q5_energy: string;
  q6_mood: string;
  q7_cravings: string[];
  q8_stress: string;
  q9_birth_control: string;
  q10_conditions: string[];
  q11_labs: LabValues;
}

export interface Question {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'number' | 'date';
  options?: string[];
  conditional?: string;
  conditionalValue?: string;
  hasDontRemember?: boolean;
} 