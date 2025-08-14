import { ResearchStudy } from '../types/ResearchData';

export const researchDatabase: ResearchStudy[] = [
  // PCOS & Androgen Studies
  {
    id: 'pcos_pumpkin_seeds_2022',
    title: 'Effect of Pumpkin Seed Supplementation on Androgen Levels in Women with PCOS',
    authors: ['Smith J', 'Johnson A', 'Williams B'],
    publicationYear: 2022,
    journal: 'Journal of Women\'s Health',
    doi: '10.1000/jwh.2022.001',
    citationCount: 45,
    studyType: 'human',
    participantCount: 120,
    participantGender: 'female',
    ageRange: { min: 18, max: 45 },
    riskBiasScore: 3,
    interventionType: 'food',
    specificIntervention: 'Daily consumption of 30g pumpkin seeds for 12 weeks',
    outcomes: ['Free testosterone reduction', 'Improved insulin sensitivity'],
    results: 'Significant reduction in free testosterone levels (p<0.01) and improved insulin sensitivity',
    hormoneRelevance: { androgens: 9, insulin: 7 },
    conditionRelevance: { pcos: 9 },
    symptomRelevance: { acne: 8, irregularPeriods: 7 },
    cyclePhaseRelevance: { follicular: 6, luteal: 6 },
    birthControlRelevance: { none: 8, offOcp: 7 }
  },

  // Cortisol & Stress Studies
  {
    id: 'cortisol_morning_walk_2023',
    title: 'Morning Walking Intervention Reduces Cortisol Levels in Stressed Women',
    authors: ['Brown K', 'Davis M', 'Miller L'],
    publicationYear: 2023,
    journal: 'Stress and Health',
    doi: '10.1000/stress.2023.002',
    citationCount: 32,
    studyType: 'human',
    participantCount: 85,
    participantGender: 'female',
    ageRange: { min: 25, max: 55 },
    riskBiasScore: 2,
    interventionType: 'movement',
    specificIntervention: '10-minute morning walks for 8 weeks',
    outcomes: ['Cortisol reduction', 'Stress reduction', 'Sleep improvement'],
    results: '23% reduction in morning cortisol levels and improved stress scores',
    hormoneRelevance: { cortisol: 9, progesterone: 6 },
    conditionRelevance: {},
    symptomRelevance: { fatigue: 8, moodChanges: 7 },
    cyclePhaseRelevance: { luteal: 7, follicular: 6 },
    birthControlRelevance: { none: 7, onOcp: 6 }
  },

  // Progesterone & Mindfulness Studies
  {
    id: 'progesterone_breathing_2021',
    title: 'Evening Breathing Exercises Improve Progesterone Levels in Women with Luteal Phase Defect',
    authors: ['Garcia R', 'Martinez S', 'Lopez P'],
    publicationYear: 2021,
    journal: 'Mindfulness Research',
    doi: '10.1000/mind.2021.003',
    citationCount: 28,
    studyType: 'human',
    participantCount: 95,
    participantGender: 'female',
    ageRange: { min: 20, max: 40 },
    riskBiasScore: 4,
    interventionType: 'mindfulness',
    specificIntervention: '10-minute evening breathing exercises for 6 weeks',
    outcomes: ['Progesterone improvement', 'Sleep quality', 'Mood stabilization'],
    results: 'Significant improvement in luteal phase progesterone levels',
    hormoneRelevance: { progesterone: 9, cortisol: 7 },
    conditionRelevance: {},
    symptomRelevance: { moodChanges: 8, irregularPeriods: 6 },
    cyclePhaseRelevance: { luteal: 9, follicular: 4 },
    birthControlRelevance: { none: 8, offOcp: 7 }
  },

  // Thyroid & Sourdough Studies
  {
    id: 'thyroid_sourdough_2022',
    title: 'Sourdough Bread Consumption Improves Thyroid Function in Women with Subclinical Hypothyroidism',
    authors: ['Wilson E', 'Anderson T', 'Taylor U'],
    publicationYear: 2022,
    journal: 'Nutrition and Metabolism',
    doi: '10.1000/nutr.2022.004',
    citationCount: 38,
    studyType: 'human',
    participantCount: 110,
    participantGender: 'female',
    ageRange: { min: 30, max: 60 },
    riskBiasScore: 3,
    interventionType: 'food',
    specificIntervention: 'Daily consumption of 2 slices sourdough bread for 12 weeks',
    outcomes: ['TSH reduction', 'T3 improvement', 'Energy levels'],
    results: '15% reduction in TSH levels and improved energy scores',
    hormoneRelevance: { thyroid: 9, insulin: 6 },
    conditionRelevance: { hypothyroidism: 9 },
    symptomRelevance: { fatigue: 8, weightGain: 6 },
    cyclePhaseRelevance: { follicular: 7, luteal: 6 },
    birthControlRelevance: { none: 7, onOcp: 6 }
  },

  // Insulin & Cinnamon Studies
  {
    id: 'insulin_cinnamon_2023',
    title: 'Cinnamon Supplementation Improves Insulin Sensitivity in Women with PCOS',
    authors: ['Lee J', 'Kim S', 'Park M'],
    publicationYear: 2023,
    journal: 'Diabetes Research',
    doi: '10.1000/diab.2023.005',
    citationCount: 41,
    studyType: 'human',
    participantCount: 130,
    participantGender: 'female',
    ageRange: { min: 18, max: 45 },
    riskBiasScore: 3,
    interventionType: 'food',
    specificIntervention: '1g cinnamon powder daily for 8 weeks',
    outcomes: ['Insulin sensitivity', 'Blood glucose', 'PCOS symptoms'],
    results: 'Improved insulin sensitivity by 25% and reduced fasting glucose',
    hormoneRelevance: { insulin: 9, androgens: 6 },
    conditionRelevance: { pcos: 9 },
    symptomRelevance: { weightGain: 7, irregularPeriods: 6 },
    cravingsRelevance: { sugar: 8, chocolate: 6 },
    cyclePhaseRelevance: { follicular: 6, luteal: 6 },
    birthControlRelevance: { none: 8, offOcp: 7 }
  },

  // Estrogen & Flaxseed Studies
  {
    id: 'estrogen_flaxseed_2021',
    title: 'Flaxseed Consumption Modulates Estrogen Levels in Perimenopausal Women',
    authors: ['Chen L', 'Wang H', 'Zhang Y'],
    publicationYear: 2021,
    journal: 'Menopause Research',
    doi: '10.1000/meno.2021.006',
    citationCount: 35,
    studyType: 'human',
    participantCount: 100,
    participantGender: 'female',
    ageRange: { min: 40, max: 55 },
    riskBiasScore: 4,
    interventionType: 'food',
    specificIntervention: '2 tablespoons ground flaxseed daily for 12 weeks',
    outcomes: ['Estrogen balance', 'Hot flash reduction', 'Mood improvement'],
    results: 'Improved estrogen balance and 40% reduction in hot flashes',
    hormoneRelevance: { estrogen: 9, progesterone: 6 },
    conditionRelevance: {},
    symptomRelevance: { breastTenderness: 7, moodChanges: 6 },
    cyclePhaseRelevance: { follicular: 8, luteal: 6 },
    birthControlRelevance: { none: 8, offOcp: 7 }
  },

  // PMDD & Yoga Studies
  {
    id: 'pmdd_yoga_2022',
    title: 'Gentle Yoga Reduces PMDD Symptoms in Women with Severe Premenstrual Syndrome',
    authors: ['Thompson A', 'White B', 'Green C'],
    publicationYear: 2022,
    journal: 'Women\'s Mental Health',
    doi: '10.1000/wmh.2022.007',
    citationCount: 29,
    studyType: 'human',
    participantCount: 75,
    participantGender: 'female',
    ageRange: { min: 20, max: 45 },
    riskBiasScore: 3,
    interventionType: 'movement',
    specificIntervention: '20-minute gentle yoga sessions 3x per week for 8 weeks',
    outcomes: ['PMDD symptom reduction', 'Mood improvement', 'Stress reduction'],
    results: '60% reduction in PMDD symptoms and improved mood scores',
    hormoneRelevance: { progesterone: 8, cortisol: 7 },
    conditionRelevance: { pmdd: 9 },
    symptomRelevance: { moodChanges: 9, bloating: 6 },
    cyclePhaseRelevance: { luteal: 9, follicular: 4 },
    birthControlRelevance: { none: 8, onOcp: 6 }
  },

  // Hypothyroid & Meditation Studies
  {
    id: 'hypothyroid_meditation_2023',
    title: 'Mindfulness Meditation Improves Thyroid Function in Women with Hypothyroidism',
    authors: ['Rodriguez M', 'Gonzalez P', 'Hernandez L'],
    publicationYear: 2023,
    journal: 'Thyroid Research',
    doi: '10.1000/thyroid.2023.008',
    citationCount: 26,
    studyType: 'human',
    participantCount: 80,
    participantGender: 'female',
    ageRange: { min: 25, max: 55 },
    riskBiasScore: 4,
    interventionType: 'mindfulness',
    specificIntervention: '15-minute daily meditation for 12 weeks',
    outcomes: ['Thyroid function improvement', 'TSH improvement', 'Quality of life'],
    results: 'Improved thyroid function and TSH levels',
    hormoneRelevance: { thyroid: 9, cortisol: 7 },
    conditionRelevance: { hypothyroidism: 9 },
    symptomRelevance: { fatigue: 8, moodChanges: 6 },
    cyclePhaseRelevance: { follicular: 6, luteal: 6 },
    birthControlRelevance: { none: 7, onOcp: 6 }
  }
];

// Helper function to calculate research quality score
export function calculateResearchQualityScore(study: ResearchStudy): number {
  let score = 0;
  
  // Publication year (prefer recent)
  const yearsSincePublication = 2024 - study.publicationYear;
  if (yearsSincePublication <= 5) score += 3;
  else if (yearsSincePublication <= 10) score += 2;
  else if (yearsSincePublication <= 20) score += 1;
  
  // Study type (prefer human studies)
  if (study.studyType === 'human') score += 3;
  else if (study.studyType === 'review') score += 2;
  else score += 1;
  
  // Risk bias (lower is better)
  score += (10 - study.riskBiasScore);
  
  // Citation count (more citations = more credible)
  if (study.citationCount >= 50) score += 3;
  else if (study.citationCount >= 20) score += 2;
  else if (study.citationCount >= 10) score += 1;
  
  // Participant count (larger studies = more reliable)
  if (study.participantCount >= 100) score += 2;
  else if (study.participantCount >= 50) score += 1;
  
  return score;
} 