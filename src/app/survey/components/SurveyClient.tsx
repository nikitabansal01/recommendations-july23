"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyResponses, Question, AnalysisResult } from '../../types';
import QuestionBlock from '../../components/QuestionBlock';
import RadioGroup from '../../components/RadioGroup';
import CheckboxGroup from '../../components/CheckboxGroup';
import styles from '../Survey.module.css';
import { scoreSymptoms, adjustScoresWithLabs } from '../../logic/hormones/scoring';
import { getCyclePhase } from '../../logic/hormones/cycleUtils';

interface SurveyClientProps {
  questions: Question[];
}

const SurveyClient: React.FC<SurveyClientProps> = ({
  questions
}) => {
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
      free_t: '', dhea: '', lh: '', fsh: '', tsh: '', t3: '', insulin: '', hba1c: ''
    }
  });
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<SurveyResponses | null>(null);

  // Wrapper function to convert SurveyResponses to getCyclePhase parameters
  const getCyclePhaseFromAnswers = (answers: SurveyResponses): string => {
    const lastPeriodDate = answers.q2_last_period;
    const isRegular = answers.q1_period === 'Yes';
    const cycleLength = answers.q1_cycle_length ? parseInt(answers.q1_cycle_length) : 28;
    return getCyclePhase(lastPeriodDate, isRegular, cycleLength);
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({ ...prev, [questionId]: value }));
  };
  const handleCheckboxChange = (questionId: string, values: string[]) => {
    setAnswers((prev: SurveyResponses) => ({ ...prev, [questionId]: values }));
  };
  const handleNumberChange = (questionId: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({ ...prev, [questionId]: value }));
  };
  const handleDateChange = (value: string) => {
    setAnswers((prev: SurveyResponses) => ({ ...prev, q2_last_period: value }));
  };
  const handleDontRememberChange = (checked: boolean) => {
    setAnswers((prev: SurveyResponses) => ({ ...prev, q2_dont_remember: checked }));
  };
  const handleLabChange = (labKey: string, value: string) => {
    setAnswers((prev: SurveyResponses) => ({
      ...prev,
      q11_labs: { ...prev.q11_labs, [labKey]: value }
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
    const cyclePhase = getCyclePhaseFromAnswers(answers);
    const analysis: AnalysisResult = scoreSymptoms(answers, cyclePhase);
    const labs = answers.q11_labs || {};
    const numericLabs: Record<string, number> = {};
    if (labs.free_t) numericLabs.freeTestosterone = parseFloat(labs.free_t);
    if (labs.dhea) numericLabs.dhea = parseFloat(labs.dhea);
    if (labs.lh) numericLabs.lh = parseFloat(labs.lh);
    if (labs.fsh) numericLabs.fsh = parseFloat(labs.fsh);
    if (labs.tsh) numericLabs.tsh = parseFloat(labs.tsh);
    if (labs.t3) numericLabs.t3 = parseFloat(labs.t3);
    if (labs.insulin) numericLabs.fastingInsulin = parseFloat(labs.insulin);
    if (labs.hba1c) numericLabs.hba1c = parseFloat(labs.hba1c);
    let finalScores = analysis.scores;
    if (Object.values(numericLabs).some(v => typeof v === 'number' && !isNaN(v))) {
      const adjustResult = adjustScoresWithLabs(finalScores, numericLabs);
      finalScores = adjustResult.adjustedScores;
    }
    // 분석 결과 콘솔 출력
    console.log('scoreSymptoms analysis:', analysis);
    setPendingResult(analysis);
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
          results: {
            analysis: pendingResult,
            recommendations: [],
            cyclePhase: pendingResult?.cyclePhase || '',
            confidenceLevel: pendingResult?.confidenceLevel || 'low',
            disclaimer: 'This analysis is for informational purposes only and should not replace professional medical advice.'
          },
          email: email,
          timestamp: new Date().toISOString()
        })
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/results?responseId=${data.responseId}`);
      } else {
        setEmailError('Failed to save. Please try again.');
      }
    } catch {
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
  const shouldShowQuestion = (question: Question) => {
    if (!question.conditional) return true;
    const conditionalAnswer = answers[question.conditional as keyof SurveyResponses];
    return conditionalAnswer === question.conditionalValue;
  };
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
      <div className={styles.header}>
        <h1 className={styles.title}>Hormone Health Assessment</h1>
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

export default SurveyClient; 