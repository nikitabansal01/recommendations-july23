import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import styles from './Recommendations.module.css';
import { RecommendationResult, UserProfile } from '../types/ResearchData';
import { SurveyResponses } from '../types/SurveyResponses';
import { ResultsSummary } from '../types/ResultsSummary';

const Recommendations: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const responseId = searchParams.get('responseId');
  const [surveyData, setSurveyData] = useState<SurveyResponses | null>(null);
  const [results, setResults] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(!!responseId);
  const [activeTab, setActiveTab] = useState<'food' | 'movement' | 'mindfulness'>('food');
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  useEffect(() => {
    if (!responseId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get-responses?responseId=${responseId}`);
        const data = await res.json();
        if (data.success && data.response) {
          setSurveyData(data.response.surveyData);
          setResults(data.response.results);
        }
      } catch (e) {
        setSurveyData(null);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [responseId]);

  useEffect(() => {
    if (!surveyData || !results) return;
    generateLLMRecommendationsFromSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData, results]);

  const generateLLMRecommendationsFromSurvey = async () => {
    try {
      setLoading(true); // 명시적으로 로딩 시작
      
      if (!surveyData || !results) {
        console.error('Missing survey data or results');
        router.push('/');
        return;
      }

      // 기존 방식: const userProfile = createUserProfileFromSurveyResults(surveyData, results);
      // LLM 방식: userProfile, 카테고리별로 API 호출
      const userProfile: UserProfile = {
        hormoneScores: results.scoringBreakdown?.hormoneScores || {
          androgens: 0, progesterone: 0, estrogen: 0, thyroid: 0, cortisol: 0, insulin: 0
        },
        primaryImbalance: results.primaryImbalance || '',
        secondaryImbalances: results.secondaryImbalances || [],
        conditions: surveyData.q10_conditions || [],
        symptoms: surveyData.q4_symptoms || [],
        cyclePhase: results.cyclePhase || 'unknown',
        birthControlStatus: surveyData.q9_birth_control || 'No',
        age: surveyData.age,
        ethnicity: surveyData.ethnicity,
        cravings: surveyData.q7_cravings || [],
        confidence: results.confidence || 'low'
      };

      // 카테고리별로 LLM 추천 요청
      const categories: ('food' | 'movement' | 'mindfulness')[] = ['food', 'movement', 'mindfulness'];
      const recResult: RecommendationResult = {
        food: [], movement: [], mindfulness: [], userProfile, generatedAt: new Date().toISOString()
      };
      let minConfidence = 100;
      
      for (const category of categories) {
        console.log('LLM API 요청:', { userProfile, category });
        const res = await fetch('/api/llm-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile, category })
        });
        const data = await res.json();
        console.log('LLM API 응답:', data);
        if (data.recommendations) recResult[category] = data.recommendations;
        if (typeof data.confidence === 'number') minConfidence = Math.min(minConfidence, data.confidence);
      }
      
      console.log('최종 추천 결과:', recResult);
      setRecommendations(recResult);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // 에러 발생 시에도 로딩 상태 해제
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

              {recommendation.contraindications?.length > 0 && (
                <div className={styles.contraindications}>
                  <h4>⚠️ Important Notes:</h4>
                  <ul>
                    {recommendation.contraindications.map((contraindication, index) => (
                      <li key={index}>{contraindication}</li>
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

export default Recommendations; 