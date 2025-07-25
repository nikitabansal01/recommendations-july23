import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => (
  <footer className={styles.footer}>
    <p>Auvra by Hormone Insight Inc</p>
    <p className={styles.disclaimer}>
      This app is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider.
    </p>
  </footer>
);

export default Footer; 