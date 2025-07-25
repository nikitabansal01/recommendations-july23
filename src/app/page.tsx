import Link from 'next/link'
import styles from './Home.module.css'

export default function Home() {
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
        <Link href="/survey" className={styles.startButton}>
          Start Assessment
        </Link>
        
        {/* Admin Link - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.adminLink}>
            <Link href="/admin-dashboard" className={styles.adminButton}>
              🔬 Medical Expert Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 