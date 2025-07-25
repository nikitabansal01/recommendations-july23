/**
 * Results Summary Types
 * Centralized TypeScript interfaces for analysis results
 */

import { HormoneScores } from './HormoneScores';

export interface AnalysisResult {
  primaryImbalance: string | null;
  secondaryImbalances: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  explanations: string[];
  scores: HormoneScores;
  totalScore: number;
  cyclePhase: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'lifestyle' | 'medical' | 'diet' | 'supplement';
}

export interface ResultsSummary {
  analysis: AnalysisResult;
  recommendations: Recommendation[];
  cyclePhase: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  disclaimer: string;
} 