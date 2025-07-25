/**
 * Cycle Phase Calculation Utilities
 * Handles menstrual cycle phase calculations based on user data
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

/**
 * Calculate menstrual cycle phase based on last period date
 * @param lastPeriodDate - Date string of last period start
 * @param isRegular - Whether user has regular cycles
 * @param cycleLength - User's cycle length in days (defaults to 28)
 * @returns Cycle phase: 'menstrual', 'follicular', 'ovulation', 'luteal', or 'unknown'
 */
export function getCyclePhase(
  lastPeriodDate: string, 
  isRegular: boolean, 
  cycleLength: number = 28
): CyclePhase {
  // If no date provided or irregular cycles, return unknown
  if (!lastPeriodDate || !isRegular) {
    return 'unknown';
  }

  const lastPeriod = new Date(lastPeriodDate);
  const today = new Date();
  
  // Calculate days since last period started
  const timeDiff = today.getTime() - lastPeriod.getTime();
  const daysSincePeriod = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Calculate current cycle day using user's cycle length
  const cycleDay = (daysSincePeriod % cycleLength) + 1;
  
  // Calculate ovulation day (typically 14 days before next period)
  const ovulationDay = cycleLength - 14;
  
  // Determine cycle phase
  if (cycleDay >= 1 && cycleDay <= 5) {
    return 'menstrual';
  } else if (cycleDay >= 6 && cycleDay <= ovulationDay - 1) {
    return 'follicular';
  } else if (cycleDay === ovulationDay) {
    return 'ovulation';
  } else if (cycleDay >= ovulationDay + 1 && cycleDay <= cycleLength) {
    return 'luteal';
  }
  
  return 'unknown';
}

/**
 * Get cycle phase display name
 * @param phase - Cycle phase
 * @returns Human-readable cycle phase name
 */
export function getCyclePhaseDisplayName(phase: CyclePhase): string {
  const names: Record<CyclePhase, string> = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulation: 'Ovulation',
    luteal: 'Luteal',
    unknown: 'Unknown'
  };
  return names[phase];
}

/**
 * Get cycle phase description
 * @param phase - Cycle phase
 * @returns Description of what happens during this phase
 */
export function getCyclePhaseDescription(phase: CyclePhase): string {
  const descriptions: Record<CyclePhase, string> = {
    menstrual: 'Period phase - estrogen and progesterone are low',
    follicular: 'Pre-ovulation phase - estrogen rises, preparing for ovulation',
    ovulation: 'Ovulation occurs - egg is released, estrogen peaks',
    luteal: 'Post-ovulation phase - progesterone rises, preparing for potential pregnancy',
    unknown: 'Unable to determine cycle phase'
  };
  return descriptions[phase];
}

/**
 * Check if a symptom is normal for a given cycle phase
 * @param symptom - Symptom to check
 * @param phase - Current cycle phase
 * @returns True if symptom is normal for this phase
 */
export function isSymptomNormalForPhase(symptom: string, phase: CyclePhase): boolean {
  const normalSymptoms: Record<CyclePhase, string[]> = {
    menstrual: ['cramps', 'fatigue', 'mood changes'],
    follicular: [],
    ovulation: ['mid-cycle pain', 'increased libido'],
    luteal: ['bloating', 'breast tenderness', 'mood swings', 'cravings'],
    unknown: []
  };
  
  return normalSymptoms[phase]?.includes(symptom.toLowerCase()) || false;
} 