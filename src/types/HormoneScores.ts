/**
 * Hormone Scores Types
 * Centralized TypeScript interfaces for hormone analysis
 */

export interface HormoneScores {
  androgens: number;
  progesterone: number;
  estrogen: number;
  thyroid: number;
  cortisol: number;
  insulin: number;
}

export interface HormoneImbalance {
  hormone: string;
  score: number;
  level: 'high' | 'moderate' | 'low';
  description: string;
}

export interface HormoneAnalysis {
  primaryImbalance: HormoneImbalance | null;
  secondaryImbalances: HormoneImbalance[];
  totalScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
} 