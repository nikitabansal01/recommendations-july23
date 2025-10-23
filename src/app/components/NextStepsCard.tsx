import React, { useState } from 'react';
import styles from './NextStepsCard.module.css';

interface NextStepsCardProps {
  hasLabResults?: boolean;
  hasDownloadedReport?: boolean;
}

const NextStepsCard: React.FC<NextStepsCardProps> = ({ 
  hasLabResults = false, 
  hasDownloadedReport = false 
}) => {
  const [steps, setSteps] = useState([
    {
      id: 'lab-results',
      text: 'Upload your lab results',
      completed: hasLabResults,
      icon: '📊'
    },
    {
      id: 'download-report',
      text: 'Download your hormone report',
      completed: hasDownloadedReport,
      icon: '📄'
    },
    {
      id: 'action-plan',
      text: 'See your personalized action plan',
      completed: false,
      icon: '🧠',
      isPrimary: true
    },
    {
      id: 'mobile-app',
      text: 'Sign up for early access to the mobile app',
      completed: false,
      icon: '🚀'
    }
  ]);

  const handleStepClick = (id: string) => {
    if (id === 'action-plan') {
      console.log('Navigate to action plan');
    } else if (id === 'mobile-app') {
      console.log('Navigate to mobile app signup');
    }
    
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, completed: !step.completed } : step
    ));
  };

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
          <div
            key={step.id}
            className={`${styles.step} ${
              step.completed ? styles.completed : styles.active
            }`}
            onClick={() => handleStepClick(step.id)}
          >
            {/* Checkbox */}
            <div className={styles.checkbox}>
              {step.completed ? (
                <span className={styles.checkmark}>✅</span>
              ) : (
                <span className={styles.emptyCheckbox}>☐</span>
              )}
            </div>

            {/* Icon */}
            <div className={styles.stepIcon}>
              <span>{step.icon}</span>
            </div>

            {/* Text */}
            <div className={styles.stepText}>
              {step.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextStepsCard;
