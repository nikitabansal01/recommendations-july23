import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { scoreSymptoms } from '../logic/hormones/scoring';
import { getCyclePhase } from '../logic/hormones/cycleUtils';
import { SurveyResponses, Question } from '../types';
import QuestionBlock from '../components/QuestionBlock';
import RadioGroup from '../components/RadioGroup';
import CheckboxGroup from '../components/CheckboxGroup';
import styles from './Survey.module.css';
import { adjustScoresWithLabs } from '../logic/hormones/scoring';

// Helper functions for scoring breakdown
function generateSymptomSources(answers: SurveyResponses, cyclePhase: string) {
  const sources: Array<{symptom: string, score: number, hormone: string, explanation: string}> = [];
  
  // Q1: Period regularity
  if (answers.q1_period === 'No period') {
    sources.push({symptom: 'No period', score: 3, hormone: 'androgens', explanation: 'Missing periods can indicate high androgens'});
    sources.push({symptom: 'No period', score: 2, hormone: 'estrogen', explanation: 'Missing periods can indicate low estrogen'});
  } else if (answers.q1_period === 'No') {
    sources.push({symptom: 'Irregular periods', score: 2, hormone: 'progesterone', explanation: 'Irregular periods often indicate progesterone deficiency'});
  }
  
  // Q3: Menstrual flow
  if (answers.q3_flow === 'Heavy') {
    sources.push({symptom: 'Heavy periods', score: 3, hormone: 'estrogen', explanation: 'Heavy periods can indicate estrogen dominance'});
  } else if (answers.q3_flow === 'Light') {
    sources.push({symptom: 'Light periods', score: 2, hormone: 'estrogen', explanation: 'Light periods may indicate low estrogen'});
  } else if (answers.q3_flow === 'Painful') {
    sources.push({symptom: 'Painful periods', score: 1, hormone: 'estrogen', explanation: 'Painful periods often indicate inflammation'});
    sources.push({symptom: 'Painful periods', score: 2, hormone: 'progesterone', explanation: 'Painful periods often indicate progesterone deficiency'});
  }
  
  // Q4: Symptoms
  const symptoms = answers.q4_symptoms || [];
  if (symptoms.includes('Acne')) {
    sources.push({symptom: 'Acne', score: 3, hormone: 'androgens', explanation: 'Acne is strongly associated with high androgen levels'});
  }
  if (symptoms.includes('Hair loss') || symptoms.includes('Hair thinning')) {
    sources.push({symptom: 'Hair loss/thinning', score: 2, hormone: 'androgens', explanation: 'Hair loss can indicate high androgens'});
    sources.push({symptom: 'Hair loss/thinning', score: 1, hormone: 'thyroid', explanation: 'Hair loss can indicate thyroid issues'});
  }
  if (symptoms.includes('Bloating') && cyclePhase !== 'luteal') {
    sources.push({symptom: 'Bloating', score: 2, hormone: 'estrogen', explanation: 'Bloating outside of PMS can indicate estrogen dominance'});
  }
  if (symptoms.includes('Breast tenderness') && cyclePhase !== 'luteal') {
    sources.push({symptom: 'Breast tenderness', score: 2, hormone: 'estrogen', explanation: 'Breast tenderness outside of PMS can indicate estrogen dominance'});
  }
  
  // Q5: Energy levels
  if (answers.q5_energy === 'Morning fatigue') {
    sources.push({symptom: 'Morning fatigue', score: 3, hormone: 'cortisol', explanation: 'Morning fatigue often indicates cortisol/adrenal issues'});
  } else if (answers.q5_energy === 'Afternoon crash') {
    sources.push({symptom: 'Afternoon crash', score: 2, hormone: 'insulin', explanation: 'Afternoon crashes often indicate blood sugar/insulin issues'});
    sources.push({symptom: 'Afternoon crash', score: 1, hormone: 'cortisol', explanation: 'Afternoon crashes can indicate adrenal issues'});
  } else if (answers.q5_energy === 'Constant fatigue') {
    sources.push({symptom: 'Constant fatigue', score: 3, hormone: 'thyroid', explanation: 'Constant fatigue strongly suggests thyroid issues'});
    sources.push({symptom: 'Constant fatigue', score: 2, hormone: 'cortisol', explanation: 'Constant fatigue can indicate adrenal issues'});
  }
  
  // Q6: Mood changes
  if (answers.q6_mood === 'Rage/anger') {
    sources.push({symptom: 'Rage/anger', score: 3, hormone: 'progesterone', explanation: 'Rage and anger are classic signs of progesterone deficiency'});
  } else if (answers.q6_mood === 'Irritable') {
    sources.push({symptom: 'Irritability', score: 2, hormone: 'progesterone', explanation: 'Irritability can indicate progesterone deficiency'});
  } else if (answers.q6_mood === 'Sad/depressed') {
    sources.push({symptom: 'Sad/depressed', score: 2, hormone: 'thyroid', explanation: 'Depression can indicate thyroid issues'});
    sources.push({symptom: 'Sad/depressed', score: 1, hormone: 'progesterone', explanation: 'Depression can indicate hormone imbalances'});
  }
  
  // Q7: Food cravings
  const cravings = answers.q7_cravings || [];
  if (cravings.includes('Sugar')) {
    sources.push({symptom: 'Sugar cravings', score: 3, hormone: 'insulin', explanation: 'Sugar cravings strongly indicate insulin resistance'});
  }
  if (cravings.includes('Chocolate')) {
    sources.push({symptom: 'Chocolate cravings', score: 2, hormone: 'progesterone', explanation: 'Chocolate cravings often indicate progesterone deficiency'});
  }
  
  // Q10: Medical conditions
  const conditions = answers.q10_conditions || [];
  if (conditions.includes('PCOS')) {
    sources.push({symptom: 'PCOS diagnosis', score: 4, hormone: 'androgens', explanation: 'PCOS is characterized by high androgen levels'});
  }
  if (conditions.includes('Hashimoto')) {
    sources.push({symptom: 'Hashimoto diagnosis', score: 4, hormone: 'thyroid', explanation: 'Hashimoto\'s is an autoimmune thyroid condition'});
  }
  if (conditions.includes('PMDD')) {
    sources.push({symptom: 'PMDD diagnosis', score: 3, hormone: 'progesterone', explanation: 'PMDD often indicates progesterone deficiency'});
  }
  
  return sources;
}

function generateLabAdjustments(answers: SurveyResponses) {
  const adjustments: Array<{lab: string, value: number, threshold: string, adjustment: number, hormone: string, explanation: string}> = [];
  const labs = answers.q11_labs || {};
  
  // LH:FSH Ratio
  if (labs.lh && labs.fsh) {
    const ratio = parseFloat(labs.lh) / parseFloat(labs.fsh);
    if (ratio > 2.5) {
      adjustments.push({
        lab: 'LH:FSH Ratio',
        value: ratio,
        threshold: '> 2.5',
        adjustment: 2,
        hormone: 'androgens',
        explanation: `LH:FSH ratio of ${ratio.toFixed(1)} > 2.5 suggests PCOS`
      });
    }
  }
  
  // Free Testosterone
  if (labs.free_t) {
    const value = parseFloat(labs.free_t);
    if (value > 2.0) {
      adjustments.push({
        lab: 'Free Testosterone',
        value,
        threshold: '> 2.0 pg/mL',
        adjustment: 2,
        hormone: 'androgens',
        explanation: `Free Testosterone ${value} > 2.0 pg/mL`
      });
    }
  }
  
  // DHEA
  if (labs.dhea) {
    const value = parseFloat(labs.dhea);
    if (value > 300) {
      adjustments.push({
        lab: 'DHEA',
        value,
        threshold: '> 300 µg/dL',
        adjustment: 2,
        hormone: 'androgens',
        explanation: `DHEA ${value} > 300 µg/dL`
      });
    }
  }
  
  // TSH
  if (labs.tsh) {
    const value = parseFloat(labs.tsh);
    if (value > 2.5) {
      adjustments.push({
        lab: 'TSH',
        value,
        threshold: '> 2.5 µIU/mL',
        adjustment: 2,
        hormone: 'thyroid',
        explanation: `TSH ${value} > 2.5 µIU/mL`
      });
    }
  }
  
  // T3
  if (labs.t3) {
    const value = parseFloat(labs.t3);
    if (value < 100) {
      adjustments.push({
        lab: 'T3',
        value,
        threshold: '< 100 ng/dL',
        adjustment: 2,
        hormone: 'thyroid',
        explanation: `T3 ${value} < 100 ng/dL`
      });
    }
  }
  
  // Fasting Insulin
  if (labs.insulin) {
    const value = parseFloat(labs.insulin);
    if (value > 6) {
      adjustments.push({
        lab: 'Fasting Insulin',
        value,
        threshold: '> 6 µIU/mL',
        adjustment: 2,
        hormone: 'insulin',
        explanation: `Fasting Insulin ${value} > 6 µIU/mL`
      });
    }
  }
  
  // HbA1c
  if (labs.hba1c) {
    const value = parseFloat(labs.hba1c);
    if (value > 5.4) {
      adjustments.push({
        lab: 'HbA1c',
        value,
        threshold: '> 5.4%',
        adjustment: 2,
        hormone: 'insulin',
        explanation: `HbA1c ${value} > 5.4%`
      });
    }
  }
  
  return adjustments;
}

function generateConfidenceFactors(totalScore: number, cyclePhase: string, answers: SurveyResponses) {
  const factors: string[] = [];
  
  if (totalScore >= 15) {
    factors.push('High symptom burden (score ≥ 15)');
  } else if (totalScore >= 8) {
    factors.push('Moderate symptom burden (score 8-14)');
  } else {
    factors.push('Low symptom burden (score < 8) - consider retesting');
  }
  
  if (cyclePhase === 'unknown') {
    factors.push('Cycle data missing or uncertain → confidence reduced');
  }
  
  const labCount = Object.keys(answers.q11_labs || {}).filter(key => 
    answers.q11_labs?.[key as keyof typeof answers.q11_labs]
  ).length;
  
  if (labCount > 0) {
    factors.push(`Lab data available (${labCount} values) → confidence increased`);
  }
  
  return factors;
}

const Survey: React.FC = () => {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showLabs, setShowLabs] = useState(false);
  const [answers, setAnswers] = useState<SurveyResponses>({
    q1_period: '',
    q1_cycle_length: '',
    q2_last_period: '',
    q2_dont_remember: false,
    q3_flow: '',
    q4_symptoms: [],
    q5_energy: '',
    q6_mood: '',
    q7_cravings: [],
    q8_stress: '',
    q9_birth_control: '',
    q10_conditions: [],
    q11_labs: {
      free_t: '',
      dhea: '',
      lh: '',
      fsh: '',
      tsh: '',
      t3: '',
      insulin: '',
      hba1c: ''
    }
  });
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [pendingAnswers, setPendingAnswers] = useState<any>(null);

  const questions: Question[] = [
    {
      id: 'q1_period',
      question: 'Do you currently have regular menstrual periods?',
      type: 'radio',
      options: ['Yes', 'No', 'No period']
    },
    {
      id: 'q1_cycle_length',
      question: 'What is your average cycle length in days?',
      type: 'number',
      conditional: 'q1_period',
      conditionalValue: 'Yes'
    },
    {
      id: 'q2_last_period',
      question: 'When was your last menstrual period?',
      type: 'date',
      hasDontRemember: true
    },
    {
      id: 'q3_flow',
      question: 'How would you describe your typical menstrual flow?',
      type: 'radio',
      options: ['Normal', 'Heavy', 'Light', 'Painful']
    },
    {
      id: 'q4_symptoms',
      question: 'Which of the following symptoms do you experience? (Select all that apply)',
      type: 'checkbox',
      options: ['Acne', 'Hair loss', 'Hair thinning', 'Bloating', 'Breast tenderness', 'None of the above']
    },
    {
      id: 'q5_energy',
      question: 'How would you describe your energy levels throughout the day?',
      type: 'radio',
      options: ['Steady energy', 'Morning fatigue', 'Afternoon crash', 'Constant fatigue']
    },
    {
      id: 'q6_mood',
      question: 'What shifts have you observed in your mood a week before your periods?',
      type: 'radio',
      options: ['No change', 'Irritable', 'Sad/depressed', 'Rage/anger']
    },
    {
      id: 'q7_cravings',
      question: 'What types of food do you crave? (Select all that apply)',
      type: 'checkbox',
      options: ['Sugar', 'Salt', 'Chocolate', 'None']
    },
    {
      id: 'q8_stress',
      question: 'How would you rate your current stress level?',
      type: 'radio',
      options: ['Low', 'Moderate', 'High']
    },
    {
      id: 'q9_birth_control',
      question: 'Are you currently using hormonal birth control?',
      type: 'radio',
      options: ['No', 'Currently using', 'Recently stopped']
    },
    {
      id: 'q10_conditions',
      question: 'Do you have any of the following conditions? (Select all that apply)',
      type: 'checkbox',
      options: ['PCOS', 'Endometriosis', 'PMDD', 'Hashimoto\'s', 'None of the above']
    }
  ];

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: string, values: string[]) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      [questionId]: values
    }));
  };

  const handleNumberChange = (questionId: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleDateChange = (value: string) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      q2_last_period: value
    }));
  };

  const handleDontRememberChange = (checked: boolean) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      q2_dont_remember: checked
    }));
  };

  const handleLabChange = (labKey: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      q11_labs: {
        ...prev.q11_labs,
        [labKey]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev: number) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev: number) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // 설문 결과와 답변을 미리 계산해서 상태에 저장하고, 이메일 입력 모달을 띄움
    const isRegular = answers.q1_period === 'Yes';
    const cycleLength = answers.q1_cycle_length ? parseInt(answers.q1_cycle_length) : 28;
    const cyclePhase = getCyclePhase(answers.q2_last_period, isRegular, cycleLength);
    const analysis = scoreSymptoms(answers, cyclePhase);
    const labs = answers.q11_labs || {};
    const numericLabs: any = {};
    if (labs.free_t) numericLabs.freeTestosterone = parseFloat(labs.free_t);
    if (labs.dhea) numericLabs.dhea = parseFloat(labs.dhea);
    if (labs.lh) numericLabs.lh = parseFloat(labs.lh);
    if (labs.fsh) numericLabs.fsh = parseFloat(labs.fsh);
    if (labs.tsh) numericLabs.tsh = parseFloat(labs.tsh);
    if (labs.t3) numericLabs.t3 = parseFloat(labs.t3);
    if (labs.insulin) numericLabs.fastingInsulin = parseFloat(labs.insulin);
    if (labs.hba1c) numericLabs.hba1c = parseFloat(labs.hba1c);
    let finalScores = analysis.scores;
    let conflicts: string[] = [];
    if (Object.values(numericLabs).some(v => v !== undefined && !isNaN(v))) {
      const adjustResult = adjustScoresWithLabs(finalScores, numericLabs);
      finalScores = adjustResult.adjustedScores;
      conflicts = adjustResult.conflicts;
    }
    const explanationsByHormone: Record<string, string> = {};
    (analysis.explanations || []).forEach(exp => {
      if (exp.toLowerCase().includes('androgen')) explanationsByHormone['androgens'] = exp;
      if (exp.toLowerCase().includes('insulin')) explanationsByHormone['insulin'] = exp;
      if (exp.toLowerCase().includes('progesterone')) explanationsByHormone['progesterone'] = exp;
      if (exp.toLowerCase().includes('estrogen')) explanationsByHormone['estrogen'] = exp;
      if (exp.toLowerCase().includes('thyroid')) explanationsByHormone['thyroid'] = exp;
      if (exp.toLowerCase().includes('cortisol')) explanationsByHormone['cortisol'] = exp;
    });
    const explanationsArray = Object.values(explanationsByHormone);
    const result = {
      cyclePhase,
      confidenceLevel: analysis.confidenceLevel,
      analysis: {
        primaryImbalance: analysis.primaryImbalance,
        secondaryImbalances: analysis.secondaryImbalances,
        explanations: explanationsArray,
      },
      conflicts,
      scoringBreakdown: {
        hormoneScores: finalScores,
        totalScore: analysis.totalScore,
        symptomSources: generateSymptomSources(answers, cyclePhase),
        labAdjustments: generateLabAdjustments(answers),
        conflicts,
        labAnalysis: analysis.explanations.filter(exp => 
          exp.toLowerCase().includes('lab') || 
          exp.toLowerCase().includes('testosterone') ||
          exp.toLowerCase().includes('dhea') ||
          exp.toLowerCase().includes('lh') ||
          exp.toLowerCase().includes('fsh') ||
          exp.toLowerCase().includes('tsh') ||
          exp.toLowerCase().includes('insulin') ||
          exp.toLowerCase().includes('hba1c')
        ),
        confidenceFactors: generateConfidenceFactors(analysis.totalScore, cyclePhase, answers),
        cyclePhaseImpact: cyclePhase === 'unknown' ? 'Unknown cycle phase reduces confidence' : `Cycle phase: ${cyclePhase}`
      }
    };
    setPendingResult(result);
    setPendingAnswers(answers);
    setShowEmailInput(true);
  };

  const handleEmailSubmit = async () => {
    setEmailError('');
    if (!email || !isValidEmail(email)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/save-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: pendingAnswers,
          results: pendingResult,
          email: email,
          timestamp: new Date().toISOString()
        })
      });
      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: '/results',
          query: {
            responseId: data.responseId
          }
        });
      } else {
        setEmailError('Failed to save. Please try again.');
      }
    } catch (error) {
      setEmailError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  function isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const currentQ = questions[currentQuestion];
  
  // Check if current question should be shown based on conditional logic
  const shouldShowQuestion = (question: Question) => {
    if (!question.conditional) return true;
    
    const conditionalAnswer = answers[question.conditional as keyof SurveyResponses];
    return conditionalAnswer === question.conditionalValue;
  };

  // Filter questions based on conditional logic
  const visibleQuestions = questions.filter(shouldShowQuestion);
  const currentVisibleIndex = visibleQuestions.findIndex(q => q.id === currentQ.id);
  const actualProgress = ((currentVisibleIndex + 1) / visibleQuestions.length) * 100;

  const canProceed = () => {
    const currentAnswer = answers[currentQ.id as keyof SurveyResponses];
    if (currentQ.type === 'radio') {
      return currentAnswer !== '';
    } else if (currentQ.type === 'checkbox') {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    } else if (currentQ.type === 'date') {
      return answers.q2_last_period !== '' || answers.q2_dont_remember;
    } else if (currentQ.type === 'number') {
      // For cycle length, it's optional so always allow proceeding
      return true;
    }
    return false;
  };

  const renderQuestion = () => {
    switch (currentQ.type) {
      case 'radio':
        return (
          <RadioGroup
            options={currentQ.options || []}
            selectedValue={answers[currentQ.id as keyof SurveyResponses] as string}
            onChange={(value) => handleRadioChange(currentQ.id, value)}
            name={currentQ.id}
          />
        );

      case 'checkbox':
        return (
          <CheckboxGroup
            options={currentQ.options || []}
            selectedValues={answers[currentQ.id as keyof SurveyResponses] as string[]}
            onChange={(values) => handleCheckboxChange(currentQ.id, values)}
            name={currentQ.id}
          />
        );

      case 'number':
        return (
          <div className={styles.numberContainer}>
            <input
              type="number"
              className={styles.numberInput}
              value={String(answers[currentQ.id as keyof SurveyResponses] || '')}
              onChange={(e) => handleNumberChange(currentQ.id, e.target.value)}
              placeholder="Enter number of days"
              min="21"
              max="45"
            />
            <p className={styles.helperText}>
              Optional - will default to 28 days if not specified
            </p>
          </div>
        );

      case 'date':
        return (
          <div className={styles.dateContainer}>
            <input
              type="date"
              className={styles.dateInput}
              value={answers.q2_last_period}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={answers.q2_dont_remember}
            />
            <label className={styles.checkboxOption}>
              <input
                type="checkbox"
                checked={answers.q2_dont_remember}
                onChange={(e) => handleDontRememberChange(e.target.checked)}
              />
              <span className={styles.checkboxLabel}>I don&apos;t remember</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ position: 'absolute', top: 16, right: 16, color: '#fff', fontSize: '0.95em', fontWeight: 'normal', zIndex: 1000 }}>
        🚧 This is a Beta Version — We&apos;re still improving!
      </div>
      <div className={styles.header}>
        <h1 className={styles.title}>Hormone Health Survey</h1>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${actualProgress}%` }}
          ></div>
        </div>
        <p className={styles.progressText}>
          Question {currentVisibleIndex + 1} of {visibleQuestions.length}
        </p>
      </div>

      <QuestionBlock
        question={currentQ.question}
        questionNumber={currentVisibleIndex + 1}
        totalQuestions={visibleQuestions.length}
      >
        {renderQuestion()}
      </QuestionBlock>

      <div className={styles.navigation}>
        {currentVisibleIndex > 0 && (
          <button className={styles.navButton} onClick={handlePrevious}>
            Previous
          </button>
        )}
        {currentVisibleIndex < visibleQuestions.length - 1 ? (
          <button 
            className={`${styles.navButton} ${styles.primary}`}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
          </button>
        ) : (
          <button 
            className={`${styles.navButton} ${styles.primary}`}
            onClick={handleSubmit}
            disabled={!canProceed()}
          >
            Submit
          </button>
        )}
      </div>

      {/* Optional Lab Section */}
      <div className={styles.labSection}>
        <button 
          className={styles.labToggle}
          onClick={() => setShowLabs(!showLabs)}
        >
          {showLabs ? '−' : '+'} Optional: Add Hormone Lab Values
        </button>
        
        {showLabs && (
          <div className={styles.labForm}>
            <p className={styles.labDescription}>
              If you have recent hormone lab results, you can add them here for more accurate analysis.
            </p>
            <div className={styles.labGrid}>
              <div className={styles.labInput}>
                <label>Free Testosterone</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ng/dL"
                  value={answers.q11_labs.free_t}
                  onChange={(e) => handleLabChange('free_t', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>DHEA</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="μg/dL"
                  value={answers.q11_labs.dhea}
                  onChange={(e) => handleLabChange('dhea', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>LH</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="mIU/mL"
                  value={answers.q11_labs.lh}
                  onChange={(e) => handleLabChange('lh', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>FSH</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="mIU/mL"
                  value={answers.q11_labs.fsh}
                  onChange={(e) => handleLabChange('fsh', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>TSH</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="μIU/mL"
                  value={answers.q11_labs.tsh}
                  onChange={(e) => handleLabChange('tsh', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>T3</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ng/dL"
                  value={answers.q11_labs.t3}
                  onChange={(e) => handleLabChange('t3', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>Insulin</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="μIU/mL"
                  value={answers.q11_labs.insulin}
                  onChange={(e) => handleLabChange('insulin', e.target.value)}
                />
              </div>
              <div className={styles.labInput}>
                <label>HbA1c</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="%"
                  value={answers.q11_labs.hba1c}
                  onChange={(e) => handleLabChange('hba1c', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 이메일 입력 모달/화면 */}
      {showEmailInput && (
        <div className={styles.emailModal}>
          <div className={styles.emailModalContent}>
            <h2>Please enter your email to view your results.</h2>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={styles.emailInput}
              disabled={submitting}
            />
            {emailError && <div className={styles.emailError}>{emailError}</div>}
            <button
              className={styles.emailSubmitButton}
              onClick={handleEmailSubmit}
              disabled={submitting}
            >
              Submit & View Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Survey; 