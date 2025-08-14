"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../Recommendations.module.css';
import { RecommendationResult, UserProfile } from '../../types/ResearchData';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';
import { useCurrentRecommendations } from '../../lib/current-recommendations-context';

interface RecommendationsClientProps {
  initialData: {
    surveyData: SurveyResponses;
    results: ResultsSummary;
  };
  initialRecommendations?: RecommendationResult | null;
  chatbotState?: any; // Add chatbot state as prop
  chatbotDispatch?: any; // Add chatbot dispatch as prop
}

const RecommendationsClient: React.FC<RecommendationsClientProps> = ({ initialData, initialRecommendations, chatbotState, chatbotDispatch }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateRecommendations } = useCurrentRecommendations();
  const [surveyData] = useState<SurveyResponses | null>(initialData.surveyData);
  const [results] = useState<ResultsSummary | null>(initialData.results);
  const [loading, setLoading] = useState(!initialRecommendations);
  const [activeTab, setActiveTab] = useState<'food' | 'movement' | 'mindfulness'>('food');
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(initialRecommendations || null);
  const chatbotStateData = chatbotState || { recommendationChanges: { shouldRefresh: false, refreshReason: '', alternativePreferences: [] } };

  useEffect(() => {
    if (!surveyData || !results) return;
    generateLLMRecommendationsFromSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData, results]);

  // Watch for chatbot recommendation refresh requests
  useEffect(() => {
    if (chatbotStateData.recommendationChanges.shouldRefresh) {
      console.log('🔄 Chatbot requested recommendation refresh:', chatbotStateData.recommendationChanges.refreshReason);
      console.log('📝 Alternative preferences:', chatbotStateData.recommendationChanges.alternativePreferences);
      
      // Regenerate recommendations with new preferences
      generateLLMRecommendationsFromSurvey();
      
      // Reset the refresh flag after a delay to ensure recommendations are generated
      setTimeout(() => {
        if (chatbotDispatch) {
          chatbotDispatch({ type: 'RESET_RECOMMENDATION_REFRESH' });
          console.log('🔄 Reset refresh flag after generating recommendations');
        }
      }, 1000);
    }
  }, [chatbotStateData.recommendationChanges.shouldRefresh]);

  const generateLLMRecommendationsFromSurvey = async () => {
    try {
      setLoading(true);
      if (!surveyData || !results) {
        router.push('/');
        return;
      }
      
      // Check if this is a refresh request from chatbot
      const isRefreshRequest = chatbotStateData.recommendationChanges.shouldRefresh;
      const alternativePreferences = chatbotStateData.recommendationChanges.alternativePreferences;
      
      console.log('🔄 Refresh request check:', {
        isRefreshRequest,
        alternativePreferences,
        reason: chatbotStateData.recommendationChanges.refreshReason
      });
      
      // Check if user selected a specific category from "Too hard" flow
      let selectedCategory: ('food' | 'movement' | 'mindfulness') | null = null;
      if (alternativePreferences && alternativePreferences.length > 0) {
        const easiestToStart = alternativePreferences.find((pref: string) => pref.startsWith('Easiest to start:'));
        if (easiestToStart) {
          const category = easiestToStart.split(': ')[1];
          if (category === 'food') selectedCategory = 'food';
          else if (category === 'move') selectedCategory = 'movement';
          else if (category === 'emotions') selectedCategory = 'mindfulness';
          console.log('🎯 User selected category from Too Hard flow:', selectedCategory);
        }
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
      
      // If user selected a specific category from "Too hard" flow, only generate recommendations for that category
      const categories: ('food' | 'movement' | 'mindfulness')[] = selectedCategory ? [selectedCategory] : ['food', 'movement', 'mindfulness'];
      const recResult: RecommendationResult = {
        food: [], movement: [], mindfulness: [], userProfile, generatedAt: new Date().toISOString()
      };
      
      let minConfidence = 100;
      for (const category of categories) {
        const requestBody = { 
          userProfile, 
          category,
          // Add alternative preferences if this is a refresh request
          alternativePreferences: isRefreshRequest ? alternativePreferences : undefined
        };
        
        console.log(`📡 API call for ${category}:`, requestBody);
        
        const res = await fetch('/api/llm-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const data = await res.json();
        if (data.recommendations) recResult[category] = data.recommendations;
        if (typeof data.confidence === 'number') minConfidence = Math.min(minConfidence, data.confidence);
      }
      
      // If user selected a specific category, clear other categories
      if (selectedCategory) {
        if (selectedCategory !== 'food') recResult.food = [];
        if (selectedCategory !== 'movement') recResult.movement = [];
        if (selectedCategory !== 'mindfulness') recResult.mindfulness = [];
        console.log(`🎯 Showing only ${selectedCategory} recommendations as requested by user`);
      }
      
      setRecommendations(recResult);
      
      // Update the context so chatbot knows about new recommendations
      const allRecommendations = [
        ...recResult.food.map(rec => ({ ...rec, category: 'food' })),
        ...recResult.movement.map(rec => ({ ...rec, category: 'movement' })),
        ...recResult.mindfulness.map(rec => ({ ...rec, category: 'mindfulness' }))
      ];
      updateRecommendations(allRecommendations);
      console.log('🔄 Updated chatbot context with new recommendations:', allRecommendations);
      
      // Show a success message if this was a refresh
      if (isRefreshRequest) {
        console.log('✅ Recommendations refreshed based on chatbot feedback!');
        // Reset the refresh flag after successful refresh
        // Note: In a real app, you'd dispatch an action to reset this
        // For now, we'll handle this in the useEffect
      }
      
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
        {chatbotStateData.recommendationChanges.shouldRefresh && (
          <div className={styles.refreshNotice}>
            🔄 Recommendations refreshed based on your feedback: "{chatbotStateData.recommendationChanges.refreshReason}"
          </div>
        )}
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
      
      {/* Personalization Notice */}
      {chatbotStateData.recommendationChanges.shouldRefresh && (
        <div className={styles.personalizationNotice}>
          <div className={styles.personalizationIcon}>🎯</div>
          <div className={styles.personalizationText}>
            <strong>Personalizing recommendations...</strong>
            <p>Generating new suggestions based on your preferences: {chatbotStateData.recommendationChanges.alternativePreferences.join(', ')}</p>
          </div>
        </div>
      )}
        
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