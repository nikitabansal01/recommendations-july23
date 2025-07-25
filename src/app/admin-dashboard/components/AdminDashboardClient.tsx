"use client";
import React, { useState } from 'react';
import styles from '../AdminDashboard.module.css';
import { SurveyResponses } from '../../types/SurveyResponses';
import { ResultsSummary } from '../../types/ResultsSummary';

interface UserResponse {
  id: string;
  surveyData: SurveyResponses;
  results: ResultsSummary;
  email: string | null;
  timestamp: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  initialResponses: UserResponse[];
  responseCounts: {
    withEmail: number;
    withoutEmail: number;
  };
}

const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({ 
  initialResponses, 
  responseCounts 
}) => {
  const [responses] = useState<UserResponse[]>(initialResponses);
  const [selectedResponse, setSelectedResponse] = useState<UserResponse | null>(null);
  const [filter, setFilter] = useState('all');
  const [showTestData, setShowTestData] = useState(false);
  // loading 상태 추가 (실제 fetch가 없으므로 false)
  const [loading] = useState(false);

  const handleResponseClick = (response: UserResponse) => {
    setSelectedResponse(response);
  };

  const handleCloseModal = () => {
    setSelectedResponse(null);
  };

  const getHormoneName = (hormone: string): string => {
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

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence.toLowerCase()) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredResponses = responses.filter(response => {
    if (filter === 'with-email') return response.email;
    if (filter === 'without-email') return !response.email;
    return true;
  });

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading responses...</p>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Medical Expert Dashboard</h1>
            <p className={styles.subtitle}>
              View and analyze hormone health assessment responses
            </p>
          </div>

          <div className={styles.filters}>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Responses ({responses.length})</option>
              <option value="with-email">With Email ({responseCounts.withEmail})</option>
              <option value="without-email">Without Email ({responseCounts.withoutEmail})</option>
            </select>

            <button 
              onClick={() => setShowTestData(!showTestData)}
              className={styles.testDataButton}
            >
              {showTestData ? 'Hide' : 'Show'} Test Data
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.responsesList}>
              {filteredResponses.map((response) => (
                <div 
                  key={response.id} 
                  className={styles.responseCard}
                  onClick={() => handleResponseClick(response)}
                >
                  <div className={styles.responseHeader}>
                    <span className={styles.responseId}>ID: {response.id.slice(-8)}</span>
                    <span 
                      className={styles.confidenceBadge}
                      style={{ backgroundColor: getConfidenceColor(response.results.confidenceLevel || 'low') }}
                    >
                      {response.results.confidenceLevel || 'low'} confidence
                    </span>
                  </div>
                  
                  <div className={styles.responseDetails}>
                    <div className={styles.primaryImbalance}>
                      <strong>Primary:</strong> {response.results.analysis?.primaryImbalance || 'Unknown'}
                    </div>
                    <div className={styles.secondaryImbalances}>
                      <strong>Secondary:</strong> {response.results.analysis?.secondaryImbalances?.join(', ') || 'None'}
                    </div>
                    <div className={styles.cyclePhase}>
                      <strong>Cycle Phase:</strong> {response.results.cyclePhase || 'Unknown'}
                    </div>
                    <div className={styles.timestamp}>
                      <strong>Date:</strong> {new Date(response.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedResponse && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <h2>Response Details - {selectedResponse.id.slice(-8)}</h2>
                  <button onClick={handleCloseModal} className={styles.closeButton}>×</button>
                </div>
                
                <div className={styles.modalBody}>
                  <div className={styles.detailedView}>
                    <div className={styles.section}>
                      <h3>Survey Data</h3>
                      <div className={styles.surveyData}>
                        {Object.entries(selectedResponse.surveyData).map(([key, value]) => (
                          <div key={key} className={styles.dataItem}>
                            <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3>Results Summary</h3>
                      <div className={styles.resultsSummary}>
                        <div><strong>Primary Imbalance:</strong> {selectedResponse.results.analysis?.primaryImbalance}</div>
                        <div><strong>Secondary Imbalances:</strong> {selectedResponse.results.analysis?.secondaryImbalances?.join(', ')}</div>
                        <div><strong>Confidence Level:</strong> {selectedResponse.results.confidenceLevel}</div>
                        <div><strong>Cycle Phase:</strong> {selectedResponse.results.cyclePhase}</div>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3>Hormone Scores</h3>
                      <div className={styles.subsection}>
                        <div className={styles.scoresGrid}>
                          {Object.entries(selectedResponse.results.analysis?.scores || {}).map(([hormone, score]) => (
                            <div key={hormone} className={styles.scoreItem}>
                              <span className={styles.hormoneName}>{getHormoneName(hormone)}</span>
                              <span className={styles.scoreValue}>{score}</span>
                            </div>
                          ))}
                        </div>
                        <div className={styles.totalScore}>
                          <strong>Total Score:</strong> {selectedResponse.results.analysis?.totalScore || 0}
                        </div>
                      </div>
                    </div>

                    <div className={styles.section}>
                      <h3>Explanations</h3>
                      <div className={styles.explanations}>
                        {selectedResponse.results.analysis?.explanations?.map((explanation, index) => (
                          <div key={index} className={styles.explanationItem}>
                            {explanation}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardClient; 