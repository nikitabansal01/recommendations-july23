import React from 'react';
import { useRouter } from 'next/router';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const router = useRouter();

  const handleStart = () => {
    router.push('/survey');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Hormone Health Assessment</h1>
        <p className={styles.description}>
          Take a quick 8-10 question survey to identify potential hormone imbalances 
          and get personalized recommendations for better hormonal health.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📋</span>
            <span>Quick symptom assessment</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔬</span>
            <span>Optional lab value analysis</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>💡</span>
            <span>Personalized recommendations</span>
          </div>
        </div>
        <button className={styles.startButton} onClick={handleStart}>
          Start Assessment
        </button>
        
        {/* Admin Link - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.adminLink}>
            <button 
              className={styles.adminButton}
              onClick={() => router.push('/admin-dashboard')}
            >
              🔬 Medical Expert Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 