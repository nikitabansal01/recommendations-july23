import { Question } from '../types';
import SurveyClient from './components/SurveyClient';

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

export default function SurveyPage() {
  return (
    <SurveyClient
      questions={questions}
    />
  );
} 