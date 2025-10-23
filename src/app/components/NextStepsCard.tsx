import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './NextStepsCard.module.css';

interface NextStepsCardProps {
  hasLabResults?: boolean;
  hasDownloadedReport?: boolean;
  responseId?: string;
}

const NextStepsCard: React.FC<NextStepsCardProps> = ({ 
  hasLabResults = false, 
  hasDownloadedReport = false,
  responseId = ''
}) => {
  const router = useRouter();
  const steps = [
    {
      id: 'action-plan',
      title: 'See your personalized action plan',
      description: '3-month overview of what your body needs',
      buttonText: '🎯 View Action Plan',
      buttonAction: () => window.open(`/recommendations?responseId=${responseId}`, '_blank'),
      completed: false
    },
    {
      id: 'lab-results',
      title: 'Start again with recent lab values',
      description: 'Upload labs for higher accuracy and faster results',
      buttonText: '🔄 Retake with Lab Results',
      buttonAction: () => router.push('/survey'),
      completed: hasLabResults
    },
    {
      id: 'mobile-app',
      title: 'Sign up for early access to Auvra mobile app',
      description: 'Get daily support when we launch',
      buttonText: '🚀 Join Waitlist',
      buttonAction: () => window.open('https://forms.fillout.com/t/x8xyYYpek3us', '_blank'),
      completed: false
    }
  ];

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>🧭</span>
        <h2 className={styles.title}>Next Steps</h2>
      </div>

      {/* Steps List */}
      <div className={styles.stepsList}>
        {steps.map((step) => (
          <div key={step.id} className={styles.step}>
            {/* Step Content */}
            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>→ {step.description}</p>
            </div>
            
            {/* Action Button */}
            <button 
              className={`${styles.stepButton} ${step.completed ? styles.completed : ''}`}
              onClick={step.buttonAction}
            >
              {step.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextStepsCard;
