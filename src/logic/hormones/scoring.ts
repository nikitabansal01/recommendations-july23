/**
 * Hormone Health Assessment Scoring Logic
 * Analyzes user responses to determine potential hormone imbalances
 */

import { SurveyResponses, LabValues } from '../../types';
import { HormoneScores } from '../../types/HormoneScores';
import { AnalysisResult } from '../../types/ResultsSummary';

/**
 * Score symptoms to determine hormone imbalances
 * @param userResponses - User survey responses
 * @param cyclePhase - Current cycle phase
 * @returns Analysis results with imbalances and confidence
 */
export function scoreSymptoms(userResponses: SurveyResponses, cyclePhase: string): AnalysisResult {
  const scores: HormoneScores = {
    androgens: 0,
    progesterone: 0,
    estrogen: 0,
    thyroid: 0,
    cortisol: 0,
    insulin: 0
  };
  
  const explanations: string[] = [];
  let totalScore = 0;

  // Q1: Period regularity
  if (userResponses.q1_period === 'No period') {
    scores.androgens += 3;
    scores.estrogen += 2;
    explanations.push('Missing periods can indicate low estrogen or high androgens');
  } else if (userResponses.q1_period === 'No') {
    scores.progesterone += 2;
    explanations.push('Irregular periods often indicate progesterone deficiency');
  }

  // Q3: Menstrual flow
  if (userResponses.q3_flow === 'Heavy') {
    scores.estrogen += 3;
    explanations.push('Heavy periods can indicate estrogen dominance');
  } else if (userResponses.q3_flow === 'Light') {
    scores.estrogen += 2;
    explanations.push('Light periods may indicate low estrogen');
  } else if (userResponses.q3_flow === 'Painful') {
    scores.progesterone += 2;
    scores.estrogen += 1;
    explanations.push('Painful periods often indicate progesterone deficiency and inflammation');
  }

  // Q4: Symptoms (checkboxes)
  const symptoms = userResponses.q4_symptoms || [];
  
  if (symptoms.includes('Acne')) {
    scores.androgens += 3;
    explanations.push('Acne is strongly associated with high androgen levels');
  }
  
  if (symptoms.includes('Hair loss') || symptoms.includes('Hair thinning')) {
    scores.androgens += 2;
    scores.thyroid += 1;
    explanations.push('Hair loss can indicate high androgens or thyroid issues');
  }
  
  if (symptoms.includes('Bloating')) {
    // Only count bloating if not in luteal phase (normal PMS symptom)
    if (cyclePhase !== 'luteal') {
      scores.estrogen += 2;
      explanations.push('Bloating outside of PMS can indicate estrogen dominance');
    }
  }
  
  if (symptoms.includes('Breast tenderness')) {
    if (cyclePhase !== 'luteal') {
      scores.estrogen += 2;
      explanations.push('Breast tenderness outside of PMS can indicate estrogen dominance');
    }
  }

  // Q5: Energy levels
  if (userResponses.q5_energy === 'Morning fatigue') {
    scores.cortisol += 3;
    explanations.push('Morning fatigue often indicates cortisol/adrenal issues');
  } else if (userResponses.q5_energy === 'Afternoon crash') {
    scores.insulin += 2;
    scores.cortisol += 1;
    explanations.push('Afternoon crashes often indicate blood sugar/insulin issues');
  } else if (userResponses.q5_energy === 'Constant fatigue') {
    scores.thyroid += 3;
    scores.cortisol += 2;
    explanations.push('Constant fatigue strongly suggests thyroid or adrenal issues');
  }

  // Q6: Mood changes
  if (userResponses.q6_mood === 'Rage/anger') {
    scores.progesterone += 3;
    explanations.push('Rage and anger are classic signs of progesterone deficiency');
  } else if (userResponses.q6_mood === 'Irritable') {
    scores.progesterone += 2;
    explanations.push('Irritability can indicate progesterone deficiency');
  } else if (userResponses.q6_mood === 'Sad/depressed') {
    scores.thyroid += 2;
    scores.progesterone += 1;
    explanations.push('Depression can indicate thyroid issues or hormone imbalances');
  }

  // Q7: Food cravings
  const cravings = userResponses.q7_cravings || [];
  
  if (cravings.includes('Sugar')) {
    scores.insulin += 3;
    explanations.push('Sugar cravings strongly indicate insulin resistance');
  }
  
  if (cravings.includes('Chocolate')) {
    scores.progesterone += 2;
    explanations.push('Chocolate cravings often indicate progesterone deficiency');
  }
  
  if (cravings.includes('Salt')) {
    scores.cortisol += 2;
    explanations.push('Salt cravings can indicate adrenal/cortisol issues');
  }

  // Q8: Stress levels
  if (userResponses.q8_stress === 'High') {
    scores.cortisol += 3;
    scores.progesterone += 1;
    explanations.push('High stress increases cortisol and can deplete progesterone');
  } else if (userResponses.q8_stress === 'Moderate') {
    scores.cortisol += 1;
  }

  // Q9: Birth control
  if (userResponses.q9_birth_control === 'Recently stopped') {
    scores.androgens += 2;
    scores.estrogen += 1;
    explanations.push('Stopping birth control can cause temporary androgen rebound');
  }

  // Q10: Medical conditions
  const conditions = userResponses.q10_conditions || [];
  
  if (conditions.includes('PCOS')) {
    scores.androgens += 4;
    scores.insulin += 3;
    explanations.push('PCOS is characterized by high androgens and insulin resistance');
  }
  
  if (conditions.includes('PMDD')) {
    scores.progesterone += 3;
    explanations.push('PMDD is strongly linked to progesterone sensitivity');
  }
  
  if (conditions.includes('Hashimoto\'s')) {
    scores.thyroid += 4;
    explanations.push('Hashimoto\'s is an autoimmune thyroid condition');
  }

  // Calculate total score
  totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  // Determine primary and secondary imbalances
  const sortedScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0);

  const primaryImbalance = sortedScores.length > 0 ? sortedScores[0][0] : null;
  const secondaryImbalances = sortedScores.slice(1, 3).map(([hormone]) => hormone);

  // Calculate confidence level
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
  if (totalScore >= 15) {
    confidenceLevel = 'high';
  } else if (totalScore >= 8) {
    confidenceLevel = 'medium';
  }

  // Reduce confidence if cycle phase is unknown
  if (cyclePhase === 'unknown') {
    confidenceLevel = confidenceLevel === 'high' ? 'medium' : 'low';
    explanations.push('Cycle phase unknown - some symptoms may be normal for your cycle phase');
  }

  // Add lab data analysis if available
  const labs: LabValues = userResponses.q11_labs || {
    free_t: '',
    dhea: '',
    lh: '',
    fsh: '',
    tsh: '',
    t3: '',
    insulin: '',
    hba1c: ''
  };
  const labAnalysis = analyzeLabValues(labs);
  
  // Convert string lab values to numbers for adjustment function
  const numericLabs: {
    freeTestosterone?: number;
    dhea?: number;
    lh?: number;
    fsh?: number;
    tsh?: number;
    t3?: number;
    fastingInsulin?: number;
    hba1c?: number;
  } = {};
  
  if (labs.free_t) numericLabs.freeTestosterone = parseFloat(labs.free_t);
  if (labs.dhea) numericLabs.dhea = parseFloat(labs.dhea);
  if (labs.lh) numericLabs.lh = parseFloat(labs.lh);
  if (labs.fsh) numericLabs.fsh = parseFloat(labs.fsh);
  if (labs.tsh) numericLabs.tsh = parseFloat(labs.tsh);
  if (labs.t3) numericLabs.t3 = parseFloat(labs.t3);
  if (labs.insulin) numericLabs.fastingInsulin = parseFloat(labs.insulin);
  if (labs.hba1c) numericLabs.hba1c = parseFloat(labs.hba1c);
  
  // Adjust scores based on lab data
  const { adjustedScores, conflicts } = adjustScoresWithLabs(scores, numericLabs);
  
  // Update scores with adjusted values
  Object.assign(scores, adjustedScores);
  
  // Add lab analysis and conflicts to explanations
  if (labAnalysis.length > 0) {
    explanations.push(...labAnalysis);
  }
  if (conflicts.length > 0) {
    explanations.push(...conflicts);
  }
  
  // Increase confidence if lab data is available
  if (Object.keys(numericLabs).length > 0) {
    confidenceLevel = confidenceLevel === 'low' ? 'medium' : confidenceLevel;
    if (Object.keys(numericLabs).length >= 3) {
      confidenceLevel = confidenceLevel === 'medium' ? 'high' : confidenceLevel;
    }
  }

  return {
    primaryImbalance,
    secondaryImbalances,
    confidenceLevel,
    explanations,
    scores,
    totalScore,
    cyclePhase
  };
}

/**
 * Analyze lab values if provided
 * @param labs - Lab values object
 * @returns Array of lab-based explanations
 */
function analyzeLabValues(labs: LabValues): string[] {
  const explanations: string[] = [];
  
  if (labs.free_t && parseFloat(labs.free_t) > 2.1) {
    explanations.push('Elevated free testosterone suggests androgen excess');
  }
  
  if (labs.dhea && parseFloat(labs.dhea) > 350) {
    explanations.push('High DHEA can indicate adrenal stress or PCOS');
  }
  
  if (labs.lh && labs.fsh) {
    const lh = parseFloat(labs.lh);
    const fsh = parseFloat(labs.fsh);
    if (lh > 10 && fsh > 10) {
      explanations.push('Elevated LH and FSH suggest diminished ovarian reserve');
    } else if (lh/fsh > 2) {
      explanations.push('LH/FSH ratio >2 suggests PCOS');
    }
  }
  
  if (labs.tsh && parseFloat(labs.tsh) > 4.5) {
    explanations.push('Elevated TSH suggests hypothyroidism');
  }
  
  if (labs.insulin && parseFloat(labs.insulin) > 25) {
    explanations.push('High insulin suggests insulin resistance');
  }
  
  if (labs.hba1c && parseFloat(labs.hba1c) > 5.7) {
    explanations.push('Elevated HbA1c suggests blood sugar dysregulation');
  }
  
  return explanations;
}

/**
 * Adjust symptom-based scores using lab data for more accurate hormone imbalance detection
 * @param symptomScores - Scores calculated from symptoms
 * @param labs - Optional lab values
 * @returns Adjusted scores and any conflicts between symptoms and labs
 */
export function adjustScoresWithLabs(
  symptomScores: HormoneScores,
  labs: {
    freeTestosterone?: number;
    dhea?: number;
    lh?: number;
    fsh?: number;
    tsh?: number;
    t3?: number;
    fastingInsulin?: number;
    hba1c?: number;
  }
): {
  adjustedScores: HormoneScores;
  conflicts: string[];
} {
  const adjustedScores = { ...symptomScores };
  const conflicts: string[] = [];

  // 🩺 Lab Threshold Logic Implementation

  // LH:FSH Ratio Analysis
  if (labs.lh !== undefined && labs.fsh !== undefined) {
    const ratio = labs.lh / labs.fsh;
    if (ratio > 2.5) {
      adjustedScores.androgens += 2;
      conflicts.push(`LH:FSH ratio of ${ratio.toFixed(1)} > 2.5 suggests PCOS - added +2 to Androgens`);
    }
  }

  // Free Testosterone Analysis
  if (labs.freeTestosterone !== undefined) {
    if (labs.freeTestosterone > 2.0) {
      adjustedScores.androgens += 2;
      conflicts.push(`Free Testosterone ${labs.freeTestosterone} > 2.0 pg/mL - added +2 to Androgens`);
    } else if (labs.freeTestosterone < 1.0 && symptomScores.androgens > 0) {
      conflicts.push("Androgen symptoms with low labs - Free T < 1.0 pg/mL");
    }
  }

  // DHEA Analysis
  if (labs.dhea !== undefined) {
    if (labs.dhea > 300) {
      adjustedScores.androgens += 2;
      conflicts.push(`DHEA ${labs.dhea} > 300 µg/dL - added +2 to Androgens`);
    }
  }

  // Thyroid Analysis (TSH)
  if (labs.tsh !== undefined) {
    if (labs.tsh > 2.5) {
      adjustedScores.thyroid += 2;
      conflicts.push(`TSH ${labs.tsh} > 2.5 µIU/mL - added +2 to Thyroid`);
    }
  }

  // Thyroid Analysis (T3)
  if (labs.t3 !== undefined) {
    if (labs.t3 < 100) {
      adjustedScores.thyroid += 2;
      conflicts.push(`T3 ${labs.t3} < 100 ng/dL - added +2 to Thyroid`);
    }
  }

  // Insulin Analysis (Fasting Insulin)
  if (labs.fastingInsulin !== undefined) {
    if (labs.fastingInsulin > 6) {
      adjustedScores.insulin += 2;
      conflicts.push(`Fasting Insulin ${labs.fastingInsulin} > 6 µIU/mL - added +2 to Insulin`);
    }
  }

  // Insulin Analysis (HbA1c)
  if (labs.hba1c !== undefined) {
    if (labs.hba1c > 5.4) {
      adjustedScores.insulin += 2;
      conflicts.push(`HbA1c ${labs.hba1c} > 5.4% - added +2 to Insulin`);
    }
  }

  // Ensure no negative scores
  Object.keys(adjustedScores).forEach(key => {
    if (adjustedScores[key as keyof HormoneScores] < 0) {
      (adjustedScores as any)[key] = 0;
    }
  });

  return {
    adjustedScores,
    conflicts
  };
} 