import React from 'react';
import styles from './Footer.module.css';
import logo from '../assets/auvra-logo.png';

const Footer: React.FC = () => (
  <footer className={styles.footer}>
    <img src={logo} alt="Auvra logo" style={{ height: 40, marginBottom: 8 }} />
    <p>Auvra by Hormone Insight Inc</p>
    <p className={styles.disclaimer}>
      This app is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider.
    </p>
  </footer>
);

export default Footer; 