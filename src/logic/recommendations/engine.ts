import { ResearchStudy, Recommendation, UserProfile, RecommendationResult } from '../../types/ResearchData';
import { researchDatabase, calculateResearchQualityScore } from '../../data/researchDatabase';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';

/**
 * Recommendation Engine
 * Matches user profiles to research studies and generates personalized recommendations
 */

interface StudyMatch {
  study: ResearchStudy;
  relevanceScore: number;
  qualityScore: number;
  totalScore: number;
}

/**
 * Calculate relevance score between user profile and research study
 */
function calculateRelevanceScore(userProfile: UserProfile, study: ResearchStudy): number {
  let score = 0;
  
  // Primary hormone imbalance (highest weight)
  const primaryHormone = userProfile.primaryImbalance as keyof typeof study.hormoneRelevance;
  if (study.hormoneRelevance[primaryHormone]) {
    score += study.hormoneRelevance[primaryHormone]! * 3; // 3x weight for primary
  }
  
  // Secondary hormone imbalances
  userProfile.secondaryImbalances.forEach(hormone => {
    const hormoneKey = hormone as keyof typeof study.hormoneRelevance;
    if (study.hormoneRelevance[hormoneKey]) {
      score += study.hormoneRelevance[hormoneKey]! * 2; // 2x weight for secondary
    }
  });
  
  // Medical conditions (high weight)
  userProfile.conditions.forEach(condition => {
    const conditionKey = condition.toLowerCase() as keyof typeof study.conditionRelevance;
    if (study.conditionRelevance[conditionKey]) {
      score += study.conditionRelevance[conditionKey]! * 2.5;
    }
  });
  
  // Symptoms (medium weight)
  userProfile.symptoms.forEach(symptom => {
    const symptomKey = symptom.toLowerCase().replace(/\s+/g, '') as keyof typeof study.symptomRelevance;
    if (study.symptomRelevance[symptomKey]) {
      score += study.symptomRelevance[symptomKey]! * 1.5;
    }
  });
  
  // Cycle phase relevance
  if (study.cyclePhaseRelevance && userProfile.cyclePhase !== 'unknown') {
    const cycleKey = userProfile.cyclePhase as keyof typeof study.cyclePhaseRelevance;
    if (study.cyclePhaseRelevance[cycleKey]) {
      score += study.cyclePhaseRelevance[cycleKey]! * 1.5;
    }
  }
  
  // Birth control relevance
  if (study.birthControlRelevance) {
    const bcKey = userProfile.birthControlStatus.toLowerCase().replace(/\s+/g, '') as keyof typeof study.birthControlRelevance;
    if (study.birthControlRelevance[bcKey]) {
      score += study.birthControlRelevance[bcKey]! * 1.5;
    }
  }
  
  // Cravings relevance
  userProfile.cravings.forEach(craving => {
    const cravingKey = craving.toLowerCase() as keyof typeof study.cravingsRelevance;
    if (study.cravingsRelevance && study.cravingsRelevance[cravingKey]) {
      score += study.cravingsRelevance[cravingKey]! * 1;
    }
  });
  
  return score;
}

/**
 * Find best matching studies for user profile
 */
function findMatchingStudies(userProfile: UserProfile, category: 'food' | 'movement' | 'mindfulness'): StudyMatch[] {
  const matchingStudies = researchDatabase
    .filter(study => study.interventionType === category)
    .map(study => {
      const relevanceScore = calculateRelevanceScore(userProfile, study);
      const qualityScore = calculateResearchQualityScore(study);
      const totalScore = relevanceScore * 0.7 + qualityScore * 0.3; // 70% relevance, 30% quality
      
      return {
        study,
        relevanceScore,
        qualityScore,
        totalScore
      };
    })
    .filter(match => match.totalScore > 5) // Only include relevant matches
    .sort((a, b) => b.totalScore - a.totalScore);
  
  return matchingStudies;
}

/**
 * Generate recommendation from research study
 */
function generateRecommendationFromStudy(
  study: ResearchStudy, 
  userProfile: UserProfile, 
  relevanceScore: number
): Recommendation {
  const category = study.interventionType as 'food' | 'movement' | 'mindfulness';
  
  // Generate specific action based on study
  const specificAction = study.specificIntervention;
  let frequency = 'daily';
  let duration = '';
  let intensity: 'low' | 'moderate' | 'high' = 'moderate';
  let expectedTimeline = '4-6 weeks';
  const contraindications: string[] = [];
  
  // Customize based on category
  switch (category) {
    case 'food':
      frequency = 'daily';
      expectedTimeline = '6-8 weeks';
      break;
    case 'movement':
      frequency = '3x per week';
      duration = '20 minutes';
      intensity = 'low';
      expectedTimeline = '4-6 weeks';
      break;
    case 'mindfulness':
      frequency = 'daily';
      duration = '10-15 minutes';
      intensity = 'low';
      expectedTimeline = '6-8 weeks';
      break;
  }
  
  // Determine priority based on relevance score
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (relevanceScore >= 20) priority = 'high';
  else if (relevanceScore >= 10) priority = 'medium';
  else priority = 'low';
  
  // Generate research backing summary
  const researchSummary = `Based on ${study.publicationYear} study with ${study.participantCount} women showing ${study.results}`;
  
  return {
    id: `rec_${study.id}`,
    category,
    title: `${study.specificIntervention.split(' ').slice(0, 3).join(' ')}...`,
    specificAction,
    researchBacking: {
      studies: [study],
      summary: researchSummary
    },
    expectedTimeline,
    contraindications,
    frequency,
    duration,
    intensity,
    priority,
    relevanceScore
  };
}

/**
 * Generate fallback recommendation using Groq
 */
async function generateFallbackRecommendation(
  userProfile: UserProfile,
  category: 'food' | 'movement' | 'mindfulness'
): Promise<Recommendation> {
  // This would integrate with Groq API
  // For now, return a generic recommendation
  const fallbackActions = {
    food: 'Try incorporating more whole foods and reducing processed foods',
    movement: 'Start with gentle walking for 10-15 minutes daily',
    mindfulness: 'Practice deep breathing exercises for 5-10 minutes daily'
  };
  
  return {
    id: `fallback_${category}`,
    category,
    title: `General ${category} recommendation`,
    specificAction: fallbackActions[category],
    researchBacking: {
      studies: [],
      summary: 'General recommendation based on hormone health principles'
    },
    expectedTimeline: '4-6 weeks',
    frequency: 'daily',
    priority: 'medium',
    relevanceScore: 5
  };
}

/**
 * Main recommendation generation function
 */
export async function generateRecommendations(userProfile: UserProfile): Promise<RecommendationResult> {
  const categories: ('food' | 'movement' | 'mindfulness')[] = ['food', 'movement', 'mindfulness'];
  const recommendations: RecommendationResult = {
    food: [],
    movement: [],
    mindfulness: [],
    userProfile,
    generatedAt: new Date().toISOString()
  };
  
  for (const category of categories) {
    const matchingStudies = findMatchingStudies(userProfile, category);
    
    if (matchingStudies.length > 0) {
      // Generate recommendations from research studies
      const topMatches = matchingStudies.slice(0, 3); // Top 3 matches
      const categoryRecommendations = topMatches.map(match => 
        generateRecommendationFromStudy(match.study, userProfile, match.relevanceScore)
      );
      
      recommendations[category] = categoryRecommendations;
    } else {
      // Use fallback recommendation
      const fallbackRec = await generateFallbackRecommendation(userProfile, category);
      recommendations[category] = [fallbackRec];
    }
  }
  
  return recommendations;
}

/**
 * LLM 프롬프트 엔지니어링 함수
 * 사용자 프로필, root cause, constraints, 카테고리명을 받아 LLM 프롬프트 문자열을 생성
 */
export function suggestLLMPromptForRecommendations({
  userProfile,
  category
}: {
  userProfile: UserProfile,
  category: 'food' | 'movement' | 'mindfulness'
}): string {
  // 주요 정보 추출
  const { primaryImbalance, secondaryImbalances, conditions, symptoms, cyclePhase, birthControlStatus, age, ethnicity } = userProfile;

  // 프롬프트 구성
  const userHealthProfile = [
    age && `Age: ${age}`,
    ethnicity && `Ethnicity: ${ethnicity}`,
    cyclePhase && cyclePhase !== 'unknown' && `Cycle phase: ${cyclePhase}`,
    birthControlStatus && `Birth control: ${birthControlStatus}`,
    conditions && conditions.length > 0 && `Diagnosis: ${conditions.join(', ')}`,
    symptoms && symptoms.length > 0 && `Symptoms: ${symptoms.join(', ')}`
  ].filter(Boolean).join(', ');

  const secondaryImbalancesText = secondaryImbalances && secondaryImbalances.length > 0 
    ? `, Secondary: ${secondaryImbalances.join(', ')}` 
    : '';

  const prompt = `
  You are a medical AI assistant specializing in women's hormone health. Your task is to generate HIGHLY SPECIFIC, SCIENTIFICALLY-BASED recommendations with exact amounts, durations, and frequencies.

  Category: ${category}
  Root cause (hormones out of balance): ${primaryImbalance}${secondaryImbalancesText}
  User health profile: ${userHealthProfile}

  SCIENTIFIC REQUIREMENTS:
  - Use ONLY research studies from the last 10 years on women's hormonal health
  - Medical accuracy is CRITICAL - every recommendation must be based on actual clinical studies
  - Match research to user's specific health profile (hormones, conditions, symptoms)
  - Medical factors (symptoms, diagnosis) carry more weight than demographic factors
  - STRONGLY prefer human clinical trials over animal studies
  - If research mentions specific supplements/nutrients, you may reference additional studies for food sources and amounts
  - ALL recommendations must be actionable with specific amounts, durations, and frequencies

  CRITICAL REQUIREMENTS FOR SPECIFIC ACTIONS:
  - FOOD: Specify exact amounts (grams, cups, servings) and frequency. Example: "Consume 2 tablespoons of ground flaxseed daily for 12 weeks" or "Eat 100g of salmon 3 times per week for 8 weeks"
  - MOVEMENT: Specify exact duration, intensity, and frequency. Example: "Perform 30-minute moderate-intensity yoga sessions 4 times per week for 12 weeks" or "Walk briskly for 45 minutes daily for 8 weeks"
  - MINDFULNESS: Specify exact duration, technique, and frequency. Example: "Practice 15-minute daily meditation for 12 weeks" or "Perform 20-minute deep breathing exercises twice daily for 8 weeks"
  - ALL recommendations must include: exact duration (weeks/months), frequency (daily/weekly), and specific amounts/times
  - Base ALL recommendations on actual research studies from the last 10 years
  - If research mentions specific supplements/nutrients, you may reference additional studies for food sources and amounts

  RESEARCH BACKING FORMAT:
  - Summary: "Based on [YEAR] study with [NUMBER] women showing [SPECIFIC RESULTS]"
  - Example: "Based on 2023 study with 130 women showing Improved insulin sensitivity by 25% and reduced fasting glucose"
  - Studies must include: title, authors (array), journal, publicationYear, participantCount, results
  - Example study: {"title": "Cinnamon Supplementation Improves Insulin Sensitivity in Women with PCOS", "authors": ["Lee J", "Kim S", "Park M"], "journal": "Diabetes Research", "publicationYear": 2023, "participantCount": 130, "results": "Improved insulin sensitivity by 25% and reduced fasting glucose"}

  Output format: Return a JSON array of recommendation cards. Each card must include: title, specificAction (with exact amounts/duration), frequency, intensity, expectedTimeline, priority (high/medium/low), contraindications (array), and researchBacking object with: summary (string) and studies (array of objects with: title, authors (array), journal, publicationYear, participantCount, results). Generate as many relevant cards as possible.

  Example structure: [{"title": "Cinnamon Supplementation for Insulin Sensitivity", "specificAction": "Take 1.5g of cinnamon powder daily for 12 weeks", "frequency": "Daily", "intensity": "Moderate", "expectedTimeline": "12 weeks", "priority": "high", "contraindications": ["Not recommended during pregnancy"], "researchBacking": {"summary": "Based on 2023 study with 130 women showing Improved insulin sensitivity by 25% and reduced fasting glucose", "studies": [{"title": "Cinnamon Supplementation Improves Insulin Sensitivity in Women with PCOS", "authors": ["Lee J", "Kim S", "Park M"], "journal": "Diabetes Research", "publicationYear": 2023, "participantCount": 130, "results": "Improved insulin sensitivity by 25% and reduced fasting glucose"}]}}]

  CONFIDENCE ASSESSMENT:
  - If you are highly confident in your recommendations (based on strong research evidence), include "confidence: 90" in your response
  - If you are moderately confident (some research support but limited), include "confidence: 70" in your response  
  - If you are less confident (limited research or extrapolation), include "confidence: 50" in your response
  - If you cannot provide evidence-based recommendations, include "confidence: 30" and explain why
  - Always base confidence on the quality and relevance of available research for this specific user profile
  `;

  return prompt;
}

/**
 * Convert survey results to user profile
 */
export function createUserProfileFromSurveyResults(surveyData: SurveyResponses, results: ResultsSummary): UserProfile {
  return {
    hormoneScores: (results.analysis && results.analysis.scores) ? results.analysis.scores : {
      androgens: 0, progesterone: 0, estrogen: 0, thyroid: 0, cortisol: 0, insulin: 0
    },
    primaryImbalance: results.analysis?.primaryImbalance || '',
    secondaryImbalances: results.analysis?.secondaryImbalances || [],
    conditions: surveyData.q10_conditions || [],
    symptoms: surveyData.q4_symptoms || [],
    cyclePhase: results.cyclePhase || 'unknown',
    birthControlStatus: surveyData.q9_birth_control || 'No',
    age: surveyData.age,
    ethnicity: surveyData.ethnicity,
    cravings: surveyData.q7_cravings || [],
    confidence: results.confidenceLevel || 'low'
  };
} 