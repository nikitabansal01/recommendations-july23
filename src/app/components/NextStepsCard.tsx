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

  const toggleStep = (id: string) => {
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
            className={`${styles.stepItem} ${
              step.completed ? styles.completed : 
              step.isPrimary ? styles.primary : ''
            }`}
            onClick={() => !step.isPrimary && toggleStep(step.id)}
          >
            {/* Checkbox */}
            <div className={styles.checkbox}>
              {step.completed ? (
                <div className={styles.checkboxCompleted}>
                  <span>✓</span>
                </div>
              ) : (
                <div className={`${styles.checkboxEmpty} ${
                  step.isPrimary ? styles.primary : ''
                }`} />
              )}
            </div>

            {/* Icon */}
            <div className={styles.stepIcon}>
              <span>{step.icon}</span>
            </div>

            {/* Text */}
            <div className={`${styles.stepText} ${
              step.completed ? styles.completed : 
              step.isPrimary ? styles.primary : styles.default
            }`}>
              {step.text}
            </div>

            {/* Primary CTA Arrow */}
            {step.isPrimary && (
              <div className={styles.primaryArrow}>
                <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextStepsCard;
