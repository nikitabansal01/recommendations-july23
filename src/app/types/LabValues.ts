/**
 * Lab Values Types
 * Centralized TypeScript interfaces for laboratory test data
 */

export interface LabValues {
  free_t: string;
  dhea: string;
  lh: string;
  fsh: string;
  tsh: string;
  t3: string;
  insulin: string;
  hba1c: string;
}

export interface LabReferenceRange {
  test: string;
  unit: string;
  low: number;
  high: number;
  optimal_low?: number;
  optimal_high?: number;
}

export interface LabAnalysis {
  test: string;
  value: number;
  unit: string;
  status: 'low' | 'normal' | 'high' | 'optimal';
  interpretation: string;
  clinicalSignificance: string;
}

export interface LabResults {
  values: LabValues;
  analysis: LabAnalysis[];
  hasAbnormalValues: boolean;
  recommendations: string[];
} 