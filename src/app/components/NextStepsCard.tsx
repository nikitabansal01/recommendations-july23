import React from 'react';
import styles from './NextStepsCard.module.css';

interface NextStepsCardProps {
  hasLabResults?: boolean;
  hasDownloadedReport?: boolean;
}

const NextStepsCard: React.FC<NextStepsCardProps> = ({ 
  hasLabResults = false, 
  hasDownloadedReport = false 
}) => {
  const steps = [
    {
      id: 'lab-results',
      title: 'Upload your lab results',
      description: 'Helps us personalize your insights further',
      buttonText: 'Upload Labs',
      buttonAction: () => console.log('Upload labs clicked'),
      completed: hasLabResults
    },
    {
      id: 'download-report',
      title: 'Download your hormone report',
      description: 'Your full summary in PDF',
      buttonText: 'Download PDF',
      buttonAction: () => console.log('Download PDF clicked'),
      completed: hasDownloadedReport
    },
    {
      id: 'action-plan',
      title: 'See your personalized action plan',
      description: '3-month overview of what your body needs',
      buttonText: 'View Action Plan',
      buttonAction: () => console.log('View action plan clicked'),
      completed: false
    },
    {
      id: 'mobile-app',
      title: 'Sign up for early access to our app',
      description: 'Get daily support when we launch',
      buttonText: 'Join Waitlist',
      buttonAction: () => console.log('Join waitlist clicked'),
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
