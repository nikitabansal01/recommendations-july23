"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Results.module.css';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';
import FeedbackPopup, { FeedbackData } from '../../components/FeedbackPopup';
import NextStepsCard from '../../components/NextStepsCard';
import StayConnectedCard from '../../components/StayConnectedCard';

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
  
  // State for feedback popup
  const [feedbackPopupOpen, setFeedbackPopupOpen] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // 20-second timer for feedback popup
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedbackPopupOpen(true);
    }, 20000); // 20 seconds

    return () => clearTimeout(timer);
  }, []);

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    setFeedbackSubmitting(true);
    try {
      const response = await fetch('/api/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: initialData.id,
          feedback
        })
      });

      if (response.ok) {
        setFeedbackPopupOpen(false);
        // Use a custom alert to control the title
        const customAlert = document.createElement('div');
        customAlert.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Auvra Team says</h3>
              <p style="margin: 0 0 15px 0; color: #666;">Thank you for your feedback!</p>
              <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(customAlert);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        
        // Show detailed error message
        let errorMessage = 'Failed to save feedback.';
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.debug) {
          errorMessage += ` (Debug: Redis available: ${errorData.debug.redisAvailable}, URL set: ${errorData.debug.environmentVariables?.urlSet}, Token set: ${errorData.debug.environmentVariables?.tokenSet})`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

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
          {/* Next Steps Card */}
          <div className={styles.nextStepsContainer}>
            <NextStepsCard 
              hasLabResults={!!initialData.surveyData.q11_labs && Object.values(initialData.surveyData.q11_labs).some(value => value && value.trim() !== '')}
              hasDownloadedReport={false}
            />
            
            {/* Stay Connected Card */}
            <StayConnectedCard />
          </div>
        </div>
      </div>
      <div className={styles.actionGroup}>
        <button 
          className={styles.recommendationsButton}
          onClick={() => window.open(`/recommendations?responseId=${initialData.id}`, '_blank')}
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
      
      {/* Feedback Popup */}
      <FeedbackPopup
        isOpen={feedbackPopupOpen}
        onClose={() => setFeedbackPopupOpen(false)}
        onSubmit={handleFeedbackSubmit}
        submitting={feedbackSubmitting}
      />
    </div>
  );
};

export default ResultsClient; 