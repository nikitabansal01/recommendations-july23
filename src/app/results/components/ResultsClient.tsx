"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Results.module.css';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';

interface ResultsClientProps {
  initialData: {
    id: string;
    surveyData: SurveyResponses;
    results: ResultsSummary;
    email: string | null;
    timestamp: string;
    createdAt: string;
  };
}

const ResultsClient: React.FC<ResultsClientProps> = ({ initialData }) => {
  const router = useRouter();
  const [result] = useState<ResultsSummary | null>(initialData.results);
  const reportRef = useRef<HTMLDivElement>(null);

  // State for email functionality
  const [email, setEmail] = useState(initialData.email || '');
  const [emailModalOpen, setEmailModalOpen] = useState(!initialData.email);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responseData, setResponseData] = useState<typeof initialData>(initialData);

  // 이메일 업데이트
  const handleEmailUpdate = async () => {
    setEmailError('');
    if (!email || !isValidEmail(email)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: initialData.id, email })
      });
      if (response.ok) {
        setEmailModalOpen(false);
        setResponseData((prev: typeof initialData) => ({ ...prev, email }));
      } else {
        setEmailError('Failed to update email.');
      }
    } catch {
      setEmailError('Failed to update email.');
    } finally {
      setSubmitting(false);
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      } as Parameters<typeof html2canvas>[1]);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('hormone-health-report.pdf');
    } catch {
      alert('Unable to generate PDF. Please try again.');
    }
  };

  // Helper functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const getHormoneName = (hormone: string) => {
    const names: Record<string, string> = {
      androgens: 'Androgens',
      progesterone: 'Progesterone',
      estrogen: 'Estrogen',
      thyroid: 'Thyroid',
      cortisol: 'Cortisol',
      insulin: 'Insulin'
    };
    return names[hormone] || hormone;
  };
  const getHormoneDescription = (hormone: string) => {
    const descriptions: Record<string, string> = {
      androgens: 'High androgen levels can cause acne, hair loss/thinning, hirsutism, and irregular periods.',
      progesterone: 'Low progesterone can cause PMS symptoms, mood swings, and irregular cycles.',
      estrogen: 'Estrogen dominance can cause heavy periods, bloating, and breast tenderness.',
      thyroid: 'Thyroid issues can cause fatigue, weight changes, and mood problems.',
      cortisol: 'High cortisol from stress can affect energy, sleep, and hormone balance.',
      insulin: 'Insulin resistance can cause sugar cravings, weight gain, and PCOS symptoms.'
    };
    return descriptions[hormone] || 'This hormone may be contributing to your symptoms.';
  };
  const getConfidenceDisplay = (confidence: string) => {
    const confidenceInfo = {
      high: { text: 'High Confidence', color: '#4CAF50', icon: '🎯' },
      medium: { text: 'Medium Confidence', color: '#FF9800', icon: '⚠️' },
      low: { text: 'Low Confidence', color: '#F44336', icon: '❓' }
    };
    return confidenceInfo[confidence as keyof typeof confidenceInfo] || confidenceInfo.low;
  };
  const getCyclePhaseDisplay = (phase: string) => {
    const phaseInfo = {
      follicular: { text: 'Follicular Phase', description: 'Building up to ovulation' },
      ovulatory: { text: 'Ovulatory Phase', description: 'Ovulation occurring' },
      luteal: { text: 'Luteal Phase', description: 'Post-ovulation, preparing for period' },
      menstrual: { text: 'Menstrual Phase', description: 'Period occurring' },
      unknown: { text: 'Unknown Phase', description: 'Unable to determine cycle phase' }
    };
    return phaseInfo[phase as keyof typeof phaseInfo] || phaseInfo.unknown;
  };
  const categorizeExplanations = (explanations: string[]) => {
    const categories = {
      symptoms: [] as string[],
      labs: [] as string[],
      conflicts: [] as string[],
      general: [] as string[]
    };
    const explanationsArray = Array.isArray(explanations) ? explanations : [];
    explanationsArray.forEach(explanation => {
      if (explanation.includes('lab') || explanation.includes('Lab') || explanation.includes('added +2')) {
        categories.labs.push(explanation);
      } else if (explanation.includes('conflict') || explanation.includes('low labs') || explanation.includes('despite')) {
        categories.conflicts.push(explanation);
      } else if (explanation.includes('symptom') || explanation.includes('indicate') || explanation.includes('suggest')) {
        categories.symptoms.push(explanation);
      } else {
        categories.general.push(explanation);
      }
    });
    return categories;
  };

  // Loading
  if (!result || !result.analysis?.primaryImbalance) {
    // 디버깅용 콘솔 출력
    console.log('ResultsClient: result or primaryImbalance missing', { result });
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Analysis Complete</h1>
          <p className={styles.subtitle}>
            Unable to analyze your responses. Please try again.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={() => router.push('/survey')}>
            Take Assessment Again
          </button>
        </div>
      </div>
    );
  }

  const confidenceInfo = getConfidenceDisplay(result?.confidenceLevel || result?.analysis?.confidenceLevel || 'low');
  const cyclePhaseInfo = getCyclePhaseDisplay(result?.cyclePhase || result?.analysis?.cyclePhase || '');
  const categorizedExplanations = categorizeExplanations(result?.analysis?.explanations || []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Hormone Analysis</h1>
        <p className={styles.subtitle}>
          Based on your responses and lab data, here&apos;s what we found:
        </p>
        <div className={styles.confidenceBadge} style={{ backgroundColor: confidenceInfo.color }}>
          <span className={styles.confidenceIcon}>{confidenceInfo.icon}</span>
          <span className={styles.confidenceText}>{confidenceInfo.text}</span>
        </div>
        {result.cyclePhase && result.cyclePhase !== 'unknown' && (
          <div className={styles.cyclePhaseInfo}>
            <h3>Current Cycle Phase</h3>
            <p className={styles.cyclePhaseName}>{cyclePhaseInfo.text}</p>
            <p className={styles.cyclePhaseDescription}>{cyclePhaseInfo.description}</p>
          </div>
        )}
      </div>
      <div ref={reportRef} className={styles.reportContent}>
        <div className={styles.resultsContainer}>
          <div className={styles.explanationsSection}>
            <h2 className={styles.resultTitle}>Analysis Details</h2>
            {categorizedExplanations.symptoms.length > 0 && (
              <div className={styles.explanationCategory}>
                <h3 className={styles.explanationTitle}>📋 Symptom Analysis</h3>
                <ul className={styles.explanationList}>
                  {categorizedExplanations.symptoms.map((explanation: string, index: number) => (
                    <li key={index} className={styles.explanationItem}>
                      {explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {categorizedExplanations.labs.length > 0 && (
              <div className={styles.explanationCategory}>
                <h3 className={styles.explanationTitle}>🧪 Lab Results Analysis</h3>
                <ul className={styles.explanationList}>
                  {categorizedExplanations.labs.map((explanation: string, index: number) => (
                    <li key={index} className={styles.explanationItem}>
                      {explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {categorizedExplanations.general.length > 0 && (
              <div className={styles.explanationCategory}>
                <h3 className={styles.explanationTitle}>ℹ️ Additional Information</h3>
                <ul className={styles.explanationList}>
                  {categorizedExplanations.general.map((explanation: string, index: number) => (
                    <li key={index} className={styles.explanationItem}>
                      {explanation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className={styles.primaryResult}>
            <h2 className={styles.resultTitle}>Primary Hormone Issue</h2>
            <div className={styles.hormoneCard}>
              <div className={styles.hormoneHeader}>
                <h3 className={styles.hormoneName}>
                  {getHormoneName(String(result.analysis?.primaryImbalance))}
                </h3>
                <span className={`${styles.level} ${styles.high}`}>
                  High Priority
                </span>
              </div>
              <p className={styles.description}>
                {getHormoneDescription(String(result.analysis?.primaryImbalance))}
              </p>
              {result.analysis?.explanations && result.analysis.explanations.find((exp: string) => exp.includes(String(result.analysis?.primaryImbalance))) && (
                <div className={styles.scoreInfo}>
                  <span className={styles.scoreLabel}>Explanation:</span>
                  <span className={styles.scoreValue}>{result.analysis.explanations.find((exp: string) => exp.includes(String(result.analysis?.primaryImbalance)))}</span>
                </div>
              )}
            </div>
          </div>
          {result.analysis?.secondaryImbalances && result.analysis.secondaryImbalances.length > 0 && (
            <div className={styles.secondaryResult}>
              <h2 className={styles.resultTitle}>Secondary Hormone Issues</h2>
              {result.analysis.secondaryImbalances.map((hormone: string | null, index: number) => (
                <div key={index} className={styles.hormoneCard}>
                  <div className={styles.hormoneHeader}>
                    <h3 className={styles.hormoneName}>
                      {getHormoneName(String(hormone))}
                    </h3>
                    <span className={`${styles.level} ${styles.normal}`}>
                      Moderate
                    </span>
                  </div>
                  <p className={styles.description}>
                    {getHormoneDescription(String(hormone))}
                  </p>
                  {result.analysis?.explanations && result.analysis.explanations.find((exp: string) => exp.includes(String(hormone))) && (
                    <div className={styles.scoreInfo}>
                      <span className={styles.scoreLabel}>Explanation:</span>
                      <span className={styles.scoreValue}>{result.analysis.explanations.find((exp: string) => exp.includes(String(hormone)))}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className={styles.recommendations}>
            <h2 className={styles.resultTitle}>Join Us on the Journey</h2>
            <p className={styles.description}>
              We&apos;re building something meaningful for your hormone health. Stay connected, explore our content, and be among the first to experience it.
            </p>
            <div className={styles.linkList}>
              <div className={styles.linkItem}>
                <a href="https://forms.fillout.com/t/x8xyYYpek3us" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                  <span className={styles.icon} style={{verticalAlign: 'middle', marginRight: 8}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 16.5L8.5 15.5L15.5 8.5C16.3284 7.67157 17.6716 7.67157 18.5 8.5C19.3284 9.32843 19.3284 10.6716 18.5 11.5L11.5 18.5L10.5 25L2 16.5Z" fill="#FF9800"/><circle cx="17" cy="7" r="2" fill="#90CAF9"/></svg>
                  </span>
                  Join our Waitlist – Be the First to Know!
                </a>
              </div>
              <div className={styles.linkItem}>
                <a href="https://www.instagram.com/myauvra/" target="_blank" rel="noopener noreferrer" className={styles.iconLink} style={{verticalAlign: 'middle'}}>
                  <span style={{marginRight: 8}}>📸</span>
                  Follow us on Instagram
                </a>
              </div>
              <div className={styles.linkItem}>
                <a href="https://www.linkedin.com/company/hormone-insight/" target="_blank" rel="noopener noreferrer" className={styles.iconLink} style={{verticalAlign: 'middle'}}>
                  <span style={{marginRight: 8}}>💼</span>
                  Connect with us on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.actionGroup}>
        <button 
          className={styles.recommendationsButton}
          onClick={() => router.push(`/recommendations?responseId=${initialData.id}`)}
        >
          🎯 See Personalized Action Plan
        </button>
        <button className={styles.downloadButton} onClick={handleDownloadPDF}>
          📄 Download My Hormone Report (PDF)
        </button>
        <button className={styles.restartButton} onClick={() => router.push('/survey')}>
          🔁 Start Over
        </button>
        {process.env.NODE_ENV === 'development' && (
          <button 
            className={styles.adminButton}
            onClick={() => router.push('/admin-dashboard')}
          >
            🔬 Medical Expert Dashboard
          </button>
        )}
      </div>
      <div className={styles.disclaimer}>
        This analysis is for informational purposes only and should not replace professional medical advice. 
        Always consult with a qualified healthcare provider for diagnosis and treatment.
      </div>
    </div>
  );
};

export default ResultsClient; 