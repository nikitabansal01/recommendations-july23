"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../Recommendations.module.css';
import { RecommendationResult, UserProfile } from '../../types/ResearchData';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';

interface RecommendationsClientProps {
  initialData: {
    surveyData: SurveyResponses;
    results: ResultsSummary;
  };
  initialRecommendations?: RecommendationResult | null;
}

const RecommendationsClient: React.FC<RecommendationsClientProps> = ({ initialData, initialRecommendations }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surveyData] = useState<SurveyResponses | null>(initialData.surveyData);
  const [results] = useState<ResultsSummary | null>(initialData.results);
  const [loading, setLoading] = useState(!initialRecommendations);
  const [activeTab, setActiveTab] = useState<'food' | 'movement' | 'mindfulness'>('food');
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(initialRecommendations || null);

  useEffect(() => {
    if (!surveyData || !results) return;
    generateLLMRecommendationsFromSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData, results]);

  const generateLLMRecommendationsFromSurvey = async () => {
    try {
      setLoading(true);
      if (!surveyData || !results) {
        router.push('/');
        return;
      }
      const userProfile: UserProfile = {
        hormoneScores: results.analysis?.scores || {
          androgens: 0, progesterone: 0, estrogen: 0, thyroid: 0, cortisol: 0, insulin: 0
        },
        primaryImbalance: results.analysis?.primaryImbalance || '',
        secondaryImbalances: results.analysis?.secondaryImbalances || [],
        conditions: surveyData.q10_conditions || [],
        symptoms: surveyData.q4_symptoms || [],
        cyclePhase: results.cyclePhase || 'unknown',
        birthControlStatus: surveyData.q9_birth_control || 'No',
        age: surveyData.age,
        ethnicity: surveyData.ethnicity,
        cravings: surveyData.q7_cravings || [],
        confidence: results.confidenceLevel || 'low'
      };
      const categories: ('food' | 'movement' | 'mindfulness')[] = ['food', 'movement', 'mindfulness'];
      const recResult: RecommendationResult = {
        food: [], movement: [], mindfulness: [], userProfile, generatedAt: new Date().toISOString()
      };
      let minConfidence = 100;
      for (const category of categories) {
        const res = await fetch('/api/llm-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile, category })
        });
        const data = await res.json();
        if (data.recommendations) recResult[category] = data.recommendations;
        if (typeof data.confidence === 'number') minConfidence = Math.min(minConfidence, data.confidence);
      }
      setRecommendations(recResult);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e53e3e';
      case 'medium': return '#d69e2e';
      case 'low': return '#38a169';
      default: return '#718096';
    }
  };
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return '#e53e3e';
      case 'moderate': return '#d69e2e';
      case 'low': return '#38a169';
      default: return '#718096';
    }
  };
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'movement': return '🏃‍♀️';
      case 'mindfulness': return '🧘‍♀️';
      default: return '💡';
    }
  };

  if (loading || !recommendations) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Generating your personalized action plan...</h2>
          <p>This may take a few moments as we analyze your health profile and generate personalized recommendations.</p>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Personalized Action Plan</h1>
        <p className={styles.subtitle}>
          Based on your hormone health assessment, here are specific actions backed by research
        </p>
      </div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'food' ? styles.active : ''}`}
          onClick={() => setActiveTab('food')}
        >
          🍽️ Food
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'movement' ? styles.active : ''}`}
          onClick={() => setActiveTab('movement')}
        >
          🏃‍♀️ Movement
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'mindfulness' ? styles.active : ''}`}
          onClick={() => setActiveTab('mindfulness')}
        >
          🧘‍♀️ Pause
        </button>
      </div>
      <div className={styles.content}>
        <div className={styles.recommendationsList}>
          {recommendations[activeTab].map((recommendation, index) => (
            <div key={`${activeTab}-${index}-${recommendation.title?.slice(0, 20) || 'rec'}`} className={styles.recommendationCard}>
              <div className={styles.recommendationHeader}>
                <div className={styles.recommendationTitle}>
                  <span className={styles.categoryIcon}>
                    {getCategoryIcon(recommendation.category)}
                  </span>
                  <h3>{recommendation.title}</h3>
                </div>
                <div className={styles.priorityBadge}>
                  <span 
                    className={styles.priorityDot}
                    style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
                  ></span>
                  {recommendation.priority.toUpperCase()}
                </div>
              </div>
              <div className={styles.specificAction}>
                <h4>Specific Action:</h4>
                <p>{recommendation.specificAction}</p>
              </div>
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <strong>Frequency:</strong> {recommendation.frequency || 'Daily'}
                </div>
                {recommendation.duration && (
                  <div className={styles.detailItem}>
                    <strong>Duration:</strong> {recommendation.duration}
                  </div>
                )}
                {recommendation.intensity && (
                  <div className={styles.detailItem}>
                    <strong>Intensity:</strong> 
                    <span 
                      className={styles.intensityBadge}
                      style={{ backgroundColor: getIntensityColor(recommendation.intensity) }}
                    >
                      {recommendation.intensity}
                    </span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <strong>Expected Timeline:</strong> {recommendation.expectedTimeline || '4-6 weeks'}
                </div>
              </div>
              <div className={styles.researchBacking}>
                <h4>Research Backing:</h4>
                <p>{recommendation.researchBacking?.summary || 'Based on current research'}</p>
                <div className={styles.studyDetails}>
                  <details>
                    <summary>View Study Details</summary>
                    {recommendation.researchBacking?.studies?.length > 0 ? (
                      recommendation.researchBacking.studies.map((study, index) => (
                        <div key={index} className={styles.studyInfo}>
                          <p><strong>{study.title}</strong></p>
                          <p>Authors: {study.authors?.join(', ') || 'Research team'}</p>
                          <p>Journal: {study.journal} ({study.publicationYear})</p>
                          <p>Participants: {study.participantCount} women</p>
                          <p>Results: {study.results}</p>
                        </div>
                      ))
                    ) : (
                      <div className={styles.studyInfo}>
                        <p><em>Detailed study information will be available as research data is updated.</em></p>
                      </div>
                    )}
                  </details>
                </div>
              </div>
              {(recommendation.contraindications ?? []).length > 0 && (
                <div className={styles.contraindications}>
                  <h4>⚠️ Important Notes:</h4>
                  <ul>
                    {(recommendation.contraindications ?? []).map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={() => router.push('/results')} className={styles.backButton}>
          ← Back to Results
        </button>
        <button onClick={() => router.push('/survey')} className={styles.restartButton}>
          🔁 Start Over
        </button>
      </div>
      <div className={styles.disclaimer}>
        <p>
          <strong>Medical Disclaimer:</strong> These recommendations are based on research studies 
          and should not replace professional medical advice. Always consult with your healthcare 
          provider before starting any new health interventions.
        </p>
      </div>
    </div>
  );
};

export default RecommendationsClient; 